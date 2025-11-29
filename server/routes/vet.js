const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// 1. OBTENER TODAS LAS MASCOTAS
router.get("/", authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, name, species as type, breed, gender, weight, photo_url as image,
        EXTRACT(YEAR FROM age(birth_date)) as age, is_sterilized
       FROM pets WHERE user_id = $1`, 
      [req.user] 
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. OBTENER UNA MASCOTA (CON HISTORIAL + VETERINARIO)
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const petQuery = await pool.query(
      `SELECT *, species as type, EXTRACT(YEAR FROM age(birth_date)) as age 
       FROM pets WHERE id = $1 AND user_id = $2`, 
      [id, req.user]
    );

    if (petQuery.rows.length === 0) return res.status(404).json({ message: "No encontrada" });

    const pet = petQuery.rows[0];

    // Ahora traemos también el 'vet_name'
    const historyQuery = await pool.query(
      `SELECT 
        to_char(visit_date, 'DD Mon YYYY') as date, 
        reason as type, 
        diagnosis as detail,
        vet_name
       FROM medical_records 
       WHERE pet_id = $1 
       ORDER BY visit_date DESC`,
      [id]
    );

    pet.history = historyQuery.rows;
    res.json(pet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 3. CREAR MASCOTA
router.post("/", authorization, async (req, res) => {
  try {
    const { name, species, breed, birth_date, gender, weight, photo_url, is_sterilized, allergies } = req.body; 
    const newPet = await pool.query(
      `INSERT INTO pets (user_id, name, species, breed, birth_date, gender, weight, photo_url, is_sterilized, allergies) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user, name, species, breed, birth_date, gender, weight, photo_url || null, is_sterilized || false, allergies || 'Ninguna']
    );
    res.json(newPet.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 4. AGREGAR HISTORIAL (CON VETERINARIO)
router.post("/:id/record", authorization, async (req, res) => {
  try {
    const { id } = req.params; 
    // Recibimos vet_name del frontend
    const { type, detail, vet_name } = req.body; 

    const ownership = await pool.query("SELECT * FROM pets WHERE id = $1 AND user_id = $2", [id, req.user]);
    if (ownership.rows.length === 0) return res.status(403).json("No autorizado");

    const newRecord = await pool.query(
      `INSERT INTO medical_records (pet_id, reason, diagnosis, vet_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING to_char(visit_date, 'DD Mon YYYY') as date, reason as type, diagnosis as detail, vet_name`,
      [id, type, detail, vet_name || 'No especificado']
    );

    res.json(newRecord.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 5. ELIMINAR MASCOTA
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM pets WHERE id = $1 AND user_id = $2", [id, req.user]);
    res.json("Eliminado");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;