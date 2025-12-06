const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// 1. OBTENER TODAS LAS CLÍNICAS
router.get("/", authorization, async (req, res) => {
  try {
    const clinics = await pool.query("SELECT id, name, address, phone FROM clinics ORDER BY name ASC");
    res.json(clinics.rows);
  } catch (err) {
    console.error("❌ Error en GET /clinics:", err.message);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

// 2. CREAR NUEVA CLÍNICA
router.post("/", authorization, async (req, res) => {
  try {
    const { name, address, phone, website } = req.body;
    const newClinic = await pool.query(
      "INSERT INTO clinics (name, address, phone, website) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, phone, website || null]
    );
    res.json(newClinic.rows[0]);
  } catch (err) {
    console.error("❌ Error en POST /clinics:", err.message);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

// 3. ELIMINAR CLÍNICA
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteClinic = await pool.query("DELETE FROM clinics WHERE id = $1", [id]);

    if (deleteClinic.rowCount === 0) {
        return res.status(404).json({ error: "Clínica no encontrada" });
    }

    res.json({ message: "Clínica eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error en DELETE /clinics:", err.message);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

// 4. OBTENER TODOS LOS VETERINARIOS
router.get("/vets", authorization, async (req, res) => {
  try {
    const vets = await pool.query(
      `SELECT v.id, v.name, v.specialty, v.clinic_id, c.name as clinic_name 
       FROM veterinarians v
       LEFT JOIN clinics c ON v.clinic_id = c.id
       ORDER BY v.name ASC`
    );
    console.log("✅ GET /clinics/vets - Veterinarios obtenidos:", vets.rows.length);
    res.json(vets.rows);
  } catch (err) {
    console.error("❌ Error en GET /clinics/vets:", err.message);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

// 5. CREAR NUEVO VETERINARIO
router.post("/vets", authorization, async (req, res) => {
  try {
    const { name, specialty, clinic_id } = req.body;
    
    console.log("📝 POST /clinics/vets - Creando veterinario:", { name, specialty, clinic_id });
    
    // ✅ NO convertir a parseInt - clinic_id ya es UUID (string)
    const newVet = await pool.query(
      `INSERT INTO veterinarians (name, specialty, clinic_id) 
       VALUES ($1, $2, $3::uuid) 
       RETURNING *`,
      [name, specialty || null, clinic_id || null]
    );
    
    console.log("✅ Veterinario creado exitosamente:", newVet.rows[0]);
    res.json(newVet.rows[0]);
  } catch (err) {
    console.error("❌ Error en POST /clinics/vets:", err.message);
    res.status(500).json({ error: "Error del servidor", details: err.message });
  }
});

// 6. ELIMINAR VETERINARIO
router.delete("/vets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ DELETE /clinics/vets - Eliminando veterinario ID:", id);
    
    const result = await pool.query("DELETE FROM veterinarians WHERE id = $1::uuid RETURNING *", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Veterinario no encontrado" });
    }
    
    console.log("✅ Veterinario eliminado:", result.rows[0]);
    res.json({ message: "Veterinario eliminado" });
  } catch (err) {
    console.error("❌ Error en DELETE /clinics/vets:", err.message);
    res.status(500).json({ error: "Error al eliminar veterinario", details: err.message });
  }
});

module.exports = router;
