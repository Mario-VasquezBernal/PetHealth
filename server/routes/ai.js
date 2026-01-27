const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const { predictHealth } = require("../ai/healthPredictor");

router.post("/health-prediction", authorization, async (req, res) => {
  try {
    const { pet_id, lifestyle } = req.body;

    if (!pet_id || !lifestyle) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const petResult = await pool.query(
      "SELECT *, EXTRACT(YEAR FROM AGE(birth_date)) as age FROM pets WHERE id = $1 AND user_id = $2",
      [pet_id, req.user.id]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    const pet = petResult.rows[0];

    const prediction = predictHealth(pet, lifestyle);

    res.json({
      success: true,
      pet_id,
      prediction
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando predicción IA" });
  }
});

module.exports = router;
