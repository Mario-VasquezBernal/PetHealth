const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// 1. OBTENER TODAS LAS CLÍNICAS
router.get("/", authorization, async (req, res) => {
  try {
    const clinics = await pool.query("SELECT id, name, address, phone FROM clinics ORDER BY name ASC");
    res.json(clinics.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. CREAR NUEVA CLÍNICA
router.post("/", authorization, async (req, res) => {
  try {
    const { name, address, phone, website } = req.body;
    const newClinic = await pool.query(
      "INSERT INTO clinics (name, address, phone, website) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, phone, website]
    );
    res.json(newClinic.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 3. ELIMINAR CLÍNICA (VERSIÓN PROFESIONAL)
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ahora esto SIEMPRE funcionará aunque tenga doctores.
    // La base de datos se encargará de poner clinic_id = NULL a los doctores afectados.
    const deleteClinic = await pool.query("DELETE FROM clinics WHERE id = $1", [id]);

    if (deleteClinic.rowCount === 0) {
        return res.status(404).json("Clínica no encontrada");
    }

    res.json("Clínica eliminada (y doctores desvinculados correctamente)");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// ... tus otras rutas ...

// 6. ELIMINAR VETERINARIO (NUEVO)
router.delete("/vets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    // Borramos el veterinario.
    // OJO: Si tienes citas con este vet, esas citas podrían quedarse sin doctor (vet_id = NULL)
    // si configuraste la base de datos como hicimos con las clínicas.
    await pool.query("DELETE FROM veterinarians WHERE id = $1", [id]);
    res.json("Veterinario eliminado");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al eliminar veterinario");
  }
});

module.exports = router;