const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService"); // Importar servicio

// GET VETS
router.get("/vets", authorization, async (req, res) => {
  try {
    const vets = await pool.query("SELECT * FROM veterinarians ORDER BY name ASC");
    res.json(vets.rows);
  } catch (err) { res.status(500).send("Error"); }
});

// POST VETS
router.post("/vets", authorization, async (req, res) => {
  try {
    const { name, specialty, phone, address } = req.body;
    const newVet = await pool.query("INSERT INTO veterinarians (name, specialty, phone, address) VALUES ($1, $2, $3, $4) RETURNING *", [name, specialty, phone, address]);
    res.json(newVet.rows[0]);
  } catch (err) { res.status(500).send("Error"); }
});

// GET CITAS
router.get("/", authorization, async (req, res) => {
  try {
    const appointments = await pool.query(
      `SELECT a.id, to_char(a.date, 'DD Mon YYYY - HH24:MI') as formatted_date, a.date as raw_date, a.reason, a.status, p.name as pet_name, p.photo_url as pet_image, v.name as vet_name, v.address as vet_address
       FROM appointments a JOIN pets p ON a.pet_id = p.id LEFT JOIN veterinarians v ON a.vet_id = v.id
       WHERE a.user_id = $1 AND a.status != 'Cancelada' ORDER BY a.date ASC`,
      [req.user]
    );
    res.json(appointments.rows);
  } catch (err) { res.status(500).send("Error"); }
});

// CREAR CITA (CON EMAIL)
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

    // --- NOTIFICAR POR CORREO ---
    const user = await pool.query("SELECT email, full_name FROM users WHERE id = $1", [req.user]);
    const { email, full_name } = user.rows[0];
    
    const subject = "Cita Agendada - PetHealth";
    const message = `Hola ${full_name},\n\nTu cita ha sido confirmada para el ${new Date(date).toLocaleString()}.\n\nMotivo: ${reason}\n\nNo olvides asistir puntual.`;
    
    sendEmail(email, subject, message);
    // ----------------------------

    res.json(newAppointment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM appointments WHERE id = $1 AND user_id = $2", [id, req.user]);
    res.json("Eliminado");
  } catch (err) { res.status(500).send("Error"); }
});

module.exports = router;