// server/routes/dashboard.js
const router = require("express").Router();
const pool = require("../db");
const authorize = require("../middleware/authorization"); // Importamos al guardia

// 1. OBTENER PERFIL Y MASCOTAS (GET)
// Esta ruta trae el nombre del dueño y su lista de mascotas
router.get("/", authorize, async (req, res) => {
  try {
    // req.user.id viene del middleware (del token)
    
    // Buscar datos del usuario
    const user = await pool.query(
      "SELECT full_name, city FROM users WHERE id = $1", 
      [req.user.id]
    );

    // Buscar mascotas de este usuario
    const pets = await pool.query(
      "SELECT * FROM pets WHERE user_id = $1", 
      [req.user.id]
    );

    res.json({
      owner: user.rows[0],
      pets: pets.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. CREAR UNA NUEVA MASCOTA (POST)
router.post("/pets", authorize, async (req, res) => {
  try {
    const { name, species, breed, birth_date, weight, allergies } = req.body;

    // Insertar nueva mascota vinculada al ID del usuario logueado
    const newPet = await pool.query(
      "INSERT INTO pets (user_id, name, species, breed, birth_date, weight, allergies) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [req.user.id, name, species, breed, birth_date, weight, allergies]
    );

    res.json(newPet.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al guardar mascota");
  }
});

module.exports = router;