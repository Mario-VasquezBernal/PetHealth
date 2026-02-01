const cron = require("node-cron");
const pool = require("../db");
const sendEmail = require("../utils/emailService");

function startAppointmentReminderCron() {

<<<<<<< HEAD
  // Cada 10 minutos
=======
  // Cada minuto (modo prueba)
>>>>>>> develop
  cron.schedule("*/10 * * * *", async () => {

    try {

      const result = await pool.query(`
        SELECT
          a.id,
          a.date,
          u.email,
          u.full_name,
          p.name AS pet_name
        FROM appointments a
        JOIN users u ON u.id = a.user_id
        JOIN pets p ON p.id = a.pet_id
        WHERE a.status = 'Pendiente'
          AND a.reminder_sent = false
<<<<<<< HEAD
          AND a.date BETWEEN NOW() + INTERVAL '23 hours 50 minutes'
                         AND NOW() + INTERVAL '24 hours 10 minutes'
=======
          AND a.date BETWEEN (NOW() + INTERVAL '23 hours 50 minutes')
               AND (NOW() + INTERVAL '24 hours 10 minutes')


>>>>>>> develop
      `);

      for (const row of result.rows) {

        const subject = "Recordatorio de cita - PetHealth";

        const message = `
Hola ${row.full_name || ""},

Este es un recordatorio de tu cita para tu mascota ${row.pet_name}.

📅 Fecha y hora:
${new Date(row.date).toLocaleString("es-EC", {
  timeZone: "America/Guayaquil"
})}

Te esperamos en PetHealth 🐾
        `;

        try {

          await sendEmail(row.email, subject, message);

          await pool.query(
            "UPDATE appointments SET reminder_sent = true WHERE id = $1",
            [row.id]
          );

        } catch (err) {
          console.error("Error enviando recordatorio:", err.message);
        }
      }

    } catch (err) {
      console.error("Error en cron de recordatorio:", err.message);
    }

  });

  console.log("⏰ Cron de recordatorios de citas iniciado");
}

module.exports = startAppointmentReminderCron;
