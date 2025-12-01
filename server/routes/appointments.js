const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService");

// 1. OBTENER LISTA DE VETERINARIOS
router.get("/vets", authorization, async (req, res) => {
  try {
    const vets = await pool.query("SELECT * FROM veterinarians ORDER BY name ASC");
    res.json(vets.rows);
  } catch (err) { res.status(500).send("Error"); }
});

// 2. CREAR NUEVO VETERINARIO
router.post("/vets", authorization, async (req, res) => {
  try {
    const { name, specialty, clinic_id } = req.body; 
    
    const newVet = await pool.query(
      "INSERT INTO veterinarians (name, specialty, clinic_id) VALUES ($1, $2, $3) RETURNING *",
      [name, specialty, clinic_id]
    );

    res.json(newVet.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send("Error del servidor"); }
});

// 3. OBTENER CITAS (MEJORADO)
router.get("/", authorization, async (req, res) => {
  try {
    const appointments = await pool.query(
      `SELECT 
        a.id, 
        to_char(a.date, 'DD Mon YYYY - HH24:MI') as formatted_date,
        a.date as raw_date,
        a.reason, 
        a.status,
        p.name as pet_name, 
        p.photo_url as pet_image,
        
        -- MEJORA: Si el doctor se borró, muestra "Doctor no asignado"
        COALESCE(v.name, 'Doctor no asignado') as vet_name,
        
        -- MEJORA: Si la clínica se borró, muestra "Consultorio Privado"
        COALESCE(c.name, 'Consultorio Privado') as clinic_name,
        COALESCE(c.address, 'Ubicación del doctor') as clinic_address

       FROM appointments a
       LEFT JOIN pets p ON a.pet_id = p.id
       LEFT JOIN veterinarians v ON a.vet_id = v.id
       LEFT JOIN clinics c ON v.clinic_id = c.id
       WHERE a.user_id = $1 AND a.status != 'Cancelada'
       ORDER BY a.date ASC`,
      [req.user]
    );
    res.json(appointments.rows);
  } catch (err) { console.error(err.message); res.status(500).send("Error del servidor"); }
});

// 4. CREAR NUEVA CITA
router.post("/", authorization, async (req, res) => {
  try {
    const { pet_id, vet_id, date, reason } = req.body;
    
    const ownership = await pool.query("SELECT * FROM pets WHERE id = $1 AND user_id = $2", [pet_id, req.user]);
    if (ownership.rows.length === 0) return res.status(403).json("No autorizado");

    const newAppointment = await pool.query(
      `INSERT INTO appointments (user_id, pet_id, vet_id, date, reason) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user, pet_id, vet_id, date, reason]
    );

    const user = await pool.query("SELECT email, full_name FROM users WHERE id = $1", [req.user]);
    const { email, full_name } = user.rows[0];
    
    const subject = "Cita Agendada 📅";
    const message = `Hola ${full_name},\n\nHemos registrado tu cita para el ${new Date(date).toLocaleString()}.\n\nMotivo: ${reason}\n\nNo olvides asistir.`;
    
    if(sendEmail) sendEmail(email, subject, message);

    res.json(newAppointment.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send("Error del servidor"); }
});

// 5. CANCELAR CITA
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM appointments WHERE id = $1 AND user_id = $2", [id, req.user]);
    res.json("Cita eliminada");
  } catch (err) { res.status(500).send("Error"); }
});

// 6. ELIMINAR VETERINARIO
router.delete("/vets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Al borrar, si ya ejecutaste el comando SQL "ON DELETE SET NULL",
    // las citas de este doctor quedarán con vet_id = NULL automáticamente.
    await pool.query("DELETE FROM veterinarians WHERE id = $1", [id]);
    
    res.json("Veterinario eliminado");
  } catch (err) {
    console.error(err.message);
    // Si olvidaste ejecutar el comando SQL, este error te avisará:
    if (err.code === '23503') {
        return res.status(400).json({ message: "No se puede eliminar: El doctor tiene citas pendientes." });
    }
    res.status(500).send("Error al eliminar veterinario");
  }
});

module.exports = router;