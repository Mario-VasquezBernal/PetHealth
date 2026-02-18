const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService");

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
        -- Datos Mascota
        p.name as pet_name,
        p.photo_url as pet_image,
        -- Datos Veterinario
        v.id as vet_id,
        COALESCE(v.name, 'Doctor no asignado') as vet_name,
        v.average_rating,
        -- Datos Clínica
        COALESCE(c.name, 'Atención Independiente / Domicilio') as clinic_name,
        COALESCE(c.address, 'Ubicación coordinada con doctor') as clinic_address,
        -- Reseña
        r.id as review_id
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN veterinarians v ON a.vet_id = v.id 
      LEFT JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN veterinarian_ratings r ON a.id = r.appointment_id
      WHERE a.user_id = $1 AND a.status != 'cancelled'  -- ✅ FIX
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
    const now = new Date();

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
          status
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled') 
       RETURNING *`,
      [req.user.id, pet_id, finalVetId, clinic_id, appointmentDate, reason]
    );

    // Enviar Email (opcional al crear la cita)
    try {
      const userResult = await pool.query(
        "SELECT email, full_name FROM users WHERE id = $1",
        [req.user.id]
      );

      const { email, full_name } = userResult.rows[0] || {};

      if (email) {
        const subject = "Cita Agendada - PetHealth";
        const message = `Hola ${full_name || ""}, tu cita ha sido registrada para el ${appointmentDate.toLocaleString("es-EC", {
          timeZone: "America/Guayaquil"
        })
        }. Motivo: ${reason || "Control general"}.`;

        sendEmail(email, subject, message)
          .catch(e => console.error("Error enviando email:", e.message));
      }

    } catch (emailErr) {
      console.error("Error enviando email:", emailErr.message);
    }

    res.json(newAppointment.rows[0]);

  } catch (err) {
    console.error("🔥 Error SQL al crear cita:", err.message);
    res.status(500).json({ error: "Error del servidor al crear cita. Revisa la consola del servidor." });
  }
});


// ==========================================
// 3. CANCELAR CITA (DELETE)
// ==========================================
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE appointments SET status = 'cancelled' WHERE id = $1 AND user_id = $2", // ✅ FIX
      [id, req.user.id]
    );

    res.json("Cita cancelada correctamente");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error al cancelar");
  }
});


// ==========================================
// 4. FINALIZAR CITA (DOCTOR)
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
        status = 'completed'   -- ✅ FIX
      WHERE id = $3
      RETURNING *
      `,
      [requires_review, next_review_date || null, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Enviar correo solo si requiere revisión
    if (requires_review && next_review_date) {

      const info = await pool.query(
        `
        SELECT
          u.email,
          u.full_name,
          p.name AS pet_name
        FROM appointments a
        JOIN users u ON u.id = a.user_id
        JOIN pets p ON p.id = a.pet_id
        WHERE a.id = $1
        `,
        [id]
      );

      const data = info.rows[0];

      if (data?.email) {

        const subject = "Confirmación de próxima revisión - PetHealth";

        const message = `
Hola ${data.full_name || ""},

El médico ha indicado que la consulta de tu mascota ${data.pet_name}
requiere una nueva revisión.

📅 Fecha de la próxima revisión:
${new Date(next_review_date).toLocaleString("es-EC", {
  timeZone: "America/Guayaquil"
})}

Puedes ver el detalle ingresando a la aplicación.

PetHealth
        `;

        try {
          await sendEmail(
            data.email,
            subject,
            message
          );
        } catch (mailErr) {
          console.error("Error enviando correo de revisión:", mailErr.message);
        }
      }
    }

    res.json(updated.rows[0]);

  } catch (err) {
    console.error("Error al finalizar cita:", err.message);
    res.status(500).json({ error: "Error al finalizar la cita" });
  }
});


module.exports = router;
