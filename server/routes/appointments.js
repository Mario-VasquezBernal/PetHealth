const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService");

// 1. OBTENER CITAS
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
        COALESCE(v.name, 'Doctor no asignado') as vet_name,
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. CREAR NUEVA CITA
router.post("/", authorization, async (req, res) => {
  try {
    const { pet_id, vet_id, date, reason } = req.body;

    const ownership = await pool.query(
      "SELECT * FROM pets WHERE id = $1 AND user_id = $2",
      [pet_id, req.user]
    );

    if (ownership.rows.length === 0) {
      return res.status(403).json("No autorizado");
    }

    const newAppointment = await pool.query(
      `INSERT INTO appointments (user_id, pet_id, vet_id, date, reason) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.user, pet_id, vet_id, date, reason]
    );

    const user = await pool.query("SELECT email, full_name FROM users WHERE id = $1", [req.user]);
    const { email, full_name } = user.rows[0];

    const subject = "Cita Agendada";
    const message = `Hola ${full_name}, registrado tu cita para el ${new Date(date).toLocaleString()}. ${reason}. ¡No olvides asistir!`;

    if (sendEmail) {
      sendEmail(email, subject, message);
    }

    res.json(newAppointment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 3. CANCELAR CITA
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM appointments WHERE id = $1 AND user_id = $2", [id, req.user]);
    res.json("Cita eliminada");
  } catch (err) {
    res.status(500).send("Error");
  }
});

module.exports = router;
