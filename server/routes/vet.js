const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// ========================================
// 1. OBTENER TODOS LOS VETERINARIOS (GET)
// ========================================
router.get("/", authorization, async (req, res) => {
  try {
    const vets = await pool.query(
      `SELECT v.*, c.name as clinic_name 
       FROM veterinarians v
       LEFT JOIN clinics c ON v.clinic_id = c.id
       ORDER BY v.name ASC`
    );
    res.json(vets.rows);
  } catch (err) {
    console.error('Error al obtener veterinarios:', err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ========================================
// 2. CREAR VETERINARIO (POST) ✅ SIN user_id
// ========================================
router.post("/", authorization, async (req, res) => {
  try {
    const { name, specialty, clinic_id } = req.body;
    
    console.log('📥 Datos recibidos en backend:', { name, specialty, clinic_id, user: req.user });
    
    if (!name || !specialty) {
      return res.status(400).json({ error: "Nombre y especialidad son obligatorios" });
    }

    const clinicIdValue = clinic_id && clinic_id !== '' ? clinic_id : null;

    console.log('✅ Insertando en BD:', { name, specialty, clinic_id: clinicIdValue });

    // ✅ ARREGLADO: Insertar SIN user_id
    const newVet = await pool.query(
      `INSERT INTO veterinarians (name, specialty, clinic_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, specialty, clinicIdValue]
    );
    
    console.log('✅ Veterinario creado:', newVet.rows[0]);
    res.json(newVet.rows[0]);
  } catch (err) {
    console.error('❌ Error al crear veterinario:', err.message);
    console.error('Stack completo:', err.stack);
    res.status(500).json({ 
      error: "Error del servidor al crear veterinario", 
      details: err.message 
    });
  }
});

// ========================================
// 3. ACTUALIZAR VETERINARIO (PUT)
// ========================================
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, clinic_id } = req.body;
    
    const clinicIdValue = clinic_id && clinic_id !== '' ? clinic_id : null;

    const updateVet = await pool.query(
      `UPDATE veterinarians 
       SET name = $1, specialty = $2, clinic_id = $3
       WHERE id = $4
       RETURNING *`,
      [name, specialty, clinicIdValue, id]
    );

    if (updateVet.rows.length === 0) {
      return res.status(404).json({ error: "Veterinario no encontrado" });
    }

    res.json(updateVet.rows[0]);
  } catch (err) {
    console.error('Error al actualizar veterinario:', err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ========================================
// 4. ELIMINAR VETERINARIO (DELETE)
// ========================================
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "DELETE FROM veterinarians WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Veterinario no encontrado" });
    }

    res.json({ message: "Veterinario eliminado" });
  } catch (err) {
    console.error('Error al eliminar veterinario:', err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
