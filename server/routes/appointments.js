const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService");

const generateCalendarLink = require("../utils/calendar");
const appointmentTemplate = require("../utils/emailTemplates");


// ==========================================
// 1. OBTENER CITAS (GET)
// ==========================================
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
        v.id as vet_id,
        COALESCE(v.name, 'Doctor no asignado') as vet_name,
        v.average_rating,
        COALESCE(c.name, 'Atención Independiente / Domicilio') as clinic_name,
        COALESCE(c.address, 'Ubicación coordinada con doctor') as clinic_address,
        r.id as review_id
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN veterinarians v ON a.vet_id = v.id 
      LEFT JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN veterinarian_ratings r ON a.id = r.appointment_id
      WHERE a.user_id = $1 AND a.status != 'cancelled'
      ORDER BY a.date DESC`,
      [req.user.id]
    );

    const formattedAppointments = appointments.rows.map(a => ({
      ...a,
      has_review: !!a.review_id
    }));

    res.json(formattedAppointments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor al obtener citas");
  }
});


// ==========================================
// 2. CREAR NUEVA CITA (POST)
// ==========================================
router.post("/", authorization, async (req, res) => {
  try {

    const { pet_id, veterinarian_id, vet_id, clinic_id, date, reason } = req.body;

    const finalVetId = veterinarian_id || vet_id;

    if (!pet_id || !finalVetId || !date) {
      return res.status(400).json({ error: "Datos incompletos: Faltan campos obligatorios." });
    }

    const appointmentDate = new Date(date);

    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ error: "Fecha inválida" });
    }

    const ownership = await pool.query(
      "SELECT id FROM pets WHERE id = $1 AND user_id = $2",
      [pet_id, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(403).json("No tienes permiso para agendar cita con esta mascota.");
    }

    const newAppointment = await pool.query(
      `INSERT INTO appointments (
          user_id, 
          pet_id, 
          vet_id,
          clinic_id, 
          date, 
          reason,
          status,
          reminder_sent
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', false) 
       RETURNING *`,
      [req.user.id, pet_id, finalVetId, clinic_id, appointmentDate, reason]
    );

    const appointment = newAppointment.rows[0];

    // =========================
    // EMAIL BONITO CON CALENDAR
    // =========================
    try {

      const userResult = await pool.query(
        `SELECT u.email, u.full_name, p.name AS pet_name
         FROM users u
         JOIN pets p ON p.id = $1
         WHERE u.id = $2`,
        [pet_id, req.user.id]
      );

      const { email, full_name, pet_name } = userResult.rows[0] || {};

      if (email) {

        const calendarLink = generateCalendarLink({
          title: "Cita Veterinaria - PetHealth",
          description: reason || "Consulta veterinaria",
          location: "PetHealth",
          startDate: appointmentDate
        });

        const html = appointmentTemplate({
          name: full_name,
          petName: pet_name || "Tu mascota",
          date: appointmentDate.toLocaleString("es-EC", {
            timeZone: "America/Guayaquil"
          }),
          reason,
          calendarLink
        });

        await sendEmail(
          email,
          "Cita Agendada - PetHealth",
          html
        );
      }

    } catch (emailErr) {
      console.error("Error enviando email:", emailErr.message);
    }

    res.json(appointment);

  } catch (err) {
    console.error("🔥 Error SQL al crear cita:", err.message);
    res.status(500).json({ error: "Error del servidor al crear cita." });
  }
});


// ==========================================
// 3. CANCELAR CITA
// ==========================================
router.delete("/:id", authorization, async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(
      "UPDATE appointments SET status = 'cancelled', reminder_sent = true WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    res.json("Cita cancelada correctamente");

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al cancelar");
  }
});


// ==========================================
// 4. FINALIZAR CITA
// ==========================================
router.put("/finish/:id", authorization, async (req, res) => {
  try {

    const { id } = req.params;
    const { requires_review, next_review_date } = req.body;

    if (requires_review === true && !next_review_date) {
      return res.status(400).json({
        error: "Debe indicar la fecha de la próxima revisión"
      });
    }

    const updated = await pool.query(
      `
      UPDATE appointments
      SET
        requires_review = $1,
        next_review_date = $2,
        status = 'completed',
        reminder_sent = true
      WHERE id = $3 AND user_id = $4
      RETURNING *
      `,
      [requires_review, next_review_date || null, id, req.user.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(updated.rows[0]);

  } catch (err) {
    console.error("Error al finalizar cita:", err.message);
    res.status(500).json({ error: "Error al finalizar la cita" });
  }
});


module.exports = router;
