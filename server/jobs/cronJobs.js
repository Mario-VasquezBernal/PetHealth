const startAppointmentReminderCron = require("../cron/appointmentReminder");

const initCronJobs = () => {
  startAppointmentReminderCron();
  console.log("✅ Cron jobs inicializados correctamente (solo citas)");
};

module.exports = initCronJobs;
