const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// ------------------------------------------------------------------
// 1. ACTUALIZAR MASCOTA (PUT) - ¡ESTA ES LA RUTA QUE FALLABA!
// ------------------------------------------------------------------
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    // IMPORTANTE: Recibimos 'type' del frontend, pero en la BD se llama 'species'
    const { name, type, breed, birth_date, gender, weight, is_sterilized, allergies } = req.body;

    // Ejecutamos la actualización
    const updatePet = await pool.query(
      `UPDATE pets 
       SET name = $1, species = $2, breed = $3, birth_date = $4, gender = $5, weight = $6, is_sterilized = $7, allergies = $8
       WHERE id = $9 AND user_id = $10 
       RETURNING *`,
      [name, type, breed, birth_date, gender, weight, is_sterilized, allergies, id, req.user]
    );

    // Si no se actualizó nada (ID incorrecto o no pertenece al usuario)
    if (updatePet.rows.length === 0) {
      return res.status(403).json("No autorizado o mascota no encontrada");
    }

    res.json(updatePet.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor al actualizar");
  }
});

// ------------------------------------------------------------------
// 2. OBTENER HISTORIAL MÉDICO (GET) - TAMBIÉN DABA ERROR 404
// ------------------------------------------------------------------
router.get("/:id/history", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const history = await pool.query(
      `SELECT 
        mr.id,
        mr.visit_date as date, 
        mr.reason as type, 
        mr.diagnosis as description,
        v.name as vet_name,
        c.name as clinic_name
       FROM medical_records mr
       LEFT JOIN veterinarians v ON mr.vet_id = v.id
       LEFT JOIN clinics c ON mr.clinic_id = c.id
       WHERE mr.pet_id = $1 
       ORDER BY mr.visit_date DESC`,
      [id]
    );
    res.json(history.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al obtener historial");
  }
});

// ------------------------------------------------------------------
// 3. OBTENER TODAS LAS MASCOTAS (GET)
// ------------------------------------------------------------------
router.get("/", authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, species as type FROM pets WHERE user_id = $1 ORDER BY name ASC`, 
      [req.user] 
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ------------------------------------------------------------------
// 4. OBTENER UNA MASCOTA (GET)
// ------------------------------------------------------------------
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const petQuery = await pool.query(
      `SELECT *, species as type FROM pets WHERE id = $1 AND user_id = $2`, 
      [id, req.user]
    );

    if (petQuery.rows.length === 0) return res.status(404).json({ message: "No encontrada" });
    res.json(petQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ------------------------------------------------------------------
// 5. CREAR MASCOTA (POST)
// ------------------------------------------------------------------
router.post("/", authorization, async (req, res) => {
  try {
    const { name, species, breed, birth_date, gender, weight, photo_url, is_sterilized, allergies } = req.body; 
    
    const newPet = await pool.query(
      `INSERT INTO pets (user_id, name, species, breed, birth_date, gender, weight, photo_url, is_sterilized, allergies) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [req.user, name, species, breed, birth_date, gender, weight, photo_url || null, is_sterilized || false, allergies || 'Ninguna']
    );

    res.json(newPet.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ------------------------------------------------------------------
// 6. AGREGAR REGISTRO AL HISTORIAL (POST)
// ------------------------------------------------------------------
router.post("/:id/record", authorization, async (req, res) => {
  try {
    const { id } = req.params; 
    const { type, date, description, vet_id, clinic_id } = req.body;
    
    const ownership = await pool.query("SELECT * FROM pets WHERE id = $1 AND user_id = $2", [id, req.user]);
    if (ownership.rows.length === 0) return res.status(403).json("No autorizado");

    const newRecord = await pool.query(
      `INSERT INTO medical_records (pet_id, reason, visit_date, diagnosis, vet_id, clinic_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, type, date, description, vet_id || null, clinic_id || null]
    );
    
    res.json(newRecord.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ------------------------------------------------------------------
// 7. ELIMINAR MASCOTA (DELETE)
// ------------------------------------------------------------------
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