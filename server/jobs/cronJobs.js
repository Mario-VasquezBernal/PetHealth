const cron = require("node-cron");
const {
  sendAppointmentReminders,
  sendVaccineReminders,
  sendTaskReminders
} = require("../utils/notificationService");

const initCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Ejecutando job: Recordatorios de citas");
    await sendAppointmentReminders();
  });

  cron.schedule("0 10 * * 1", async () => {
    console.log("⏰ Ejecutando job: Recordatorios de vacunas");
    await sendVaccineReminders();
  });

  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Ejecutando job: Recordatorios de tareas");
    await sendTaskReminders();
  });

  console.log("✅ Cron jobs inicializados correctamente");
};

module.exports = initCronJobs;
