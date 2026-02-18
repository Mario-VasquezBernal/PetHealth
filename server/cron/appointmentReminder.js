const cron = require("node-cron");
const pool = require("../db");
const sendEmail = require("../utils/emailService");

function startAppointmentReminderCron() {

  cron.schedule("*/10 * * * *", async () => {

    try {

      console.log("⏰ Buscando citas para recordatorio...");

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
        WHERE a.status = 'scheduled'
          AND a.reminder_sent = false
          AND a.date BETWEEN (NOW() + INTERVAL '23 hours')
                          AND (NOW() + INTERVAL '25 hours')
      `);

      for (const row of result.rows) {

        const subject = "Recordatorio de cita - PetHealth";

        const message = `
Hola ${row.full_name || ""},

Este es un recordatorio de la cita para tu mascota ${row.pet_name}.

📅 Fecha:
${new Date(row.date).toLocaleString("es-EC", {
  timeZone: "America/Guayaquil"
})}

PetHealth 🐾
        `;

        await sendEmail(row.email, subject, message);

        await pool.query(
          "UPDATE appointments SET reminder_sent = true WHERE id = $1",
          [row.id]
        );

        console.log("✅ Recordatorio enviado:", row.id);
      }

    } catch (err) {
      console.error("❌ Error en cron:", err.message);
    }

  });

  console.log("🚀 Cron de recordatorios iniciado");
}

module.exports = startAppointmentReminderCron;
