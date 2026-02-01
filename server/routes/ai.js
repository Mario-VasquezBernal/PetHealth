const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const { predictHealth } = require("../ai/healthPredictor");

router.post("/health-prediction", authorization, async (req, res) => {
  try {
    const { pet_id, lifestyle, species } = req.body;

    if (!pet_id || !lifestyle) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const petResult = await pool.query(
  `
  SELECT 
    p.*,
    sc.code            AS species_code,
    sc.display_name    AS species_name,
    sc.ai_profile,
    EXTRACT(YEAR FROM AGE(p.birth_date)) as age
  FROM pets p
  JOIN species_catalog sc 
       ON sc.code = p.species_code
  WHERE p.id = $1 
    AND p.user_id = $2
  `,
  [pet_id, req.user.id]
);


    if (petResult.rows.length === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    const pet = petResult.rows[0];

    // 👉 inyectamos species (si viene desde frontend)
    // sin romper compatibilidad con datos antiguos
    if (species) {
      pet.species = species;
    }

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
