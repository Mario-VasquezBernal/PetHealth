const pool = require("../db");
const sendEmail = require("./emailService");

// Función para enviar recordatorios de citas
const sendAppointmentReminders = async () => {
  try {
    console.log("🔔 Verificando citas para recordatorios...");
    
    // Obtener citas para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const query = `
      SELECT 
        a.id, 
        a.appointment_date, 
        a.appointment_time,
        a.reason,
        u.name as owner_name,
        u.email as owner_email,
        p.name as pet_name,
        v.name as vet_name
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN pets p ON a.pet_id = p.id
      LEFT JOIN vets v ON a.vet_id = v.id
      WHERE a.appointment_date >= $1 
        AND a.appointment_date < $2
        AND a.status != 'cancelled'
    `;
    
    const appointments = await pool.query(query, [tomorrow, dayAfter]);
    
    for (const apt of appointments.rows) {
      const subject = `🐾 Recordatorio: Cita veterinaria mañana`;
      const message = `
Hola ${apt.owner_name},

Te recordamos que mañana ${apt.appointment_date.toLocaleDateString()} a las ${apt.appointment_time} tienes una cita para ${apt.pet_name}.

📋 Motivo: ${apt.reason}
${apt.vet_name ? `👨‍⚕️ Veterinario: ${apt.vet_name}` : ''}

Por favor, llega 10 minutos antes.

---
PetHealth - Cuidando a tu mejor amigo 🐾
      `.trim();
      
      await sendEmail(apt.owner_email, subject, message);
      console.log(`✅ Recordatorio enviado a ${apt.owner_email} para ${apt.pet_name}`);
    }
    
    console.log(`🔔 Recordatorios procesados: ${appointments.rows.length}`);
  } catch (err) {
    console.error("❌ Error enviando recordatorios:", err.message);
  }
};

// Función para recordatorios de vacunas
const sendVaccineReminders = async () => {
  try {
    console.log("💉 Verificando vacunas próximas a vencer...");
    
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    
    const query = `
      SELECT 
        m.id,
        m.treatment,
        m.date,
        m.notes,
        u.name as owner_name,
        u.email as owner_email,
        p.name as pet_name
      FROM medical_records m
      JOIN pets p ON m.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE m.treatment ILIKE '%vacuna%'
        AND m.date >= $1
        AND m.date <= $2
      ORDER BY m.date ASC
    `;
    
    const vaccines = await pool.query(query, [today, in30Days]);
    
    for (const vaccine of vaccines.rows) {
      const daysUntil = Math.ceil((vaccine.date - today) / (1000 * 60 * 60 * 24));
      
      const subject = `💉 Recordatorio: Vacuna de ${vaccine.pet_name} en ${daysUntil} días`;
      const message = `
Hola ${vaccine.owner_name},

Te recordamos que ${vaccine.pet_name} tiene una vacuna programada:

💉 Tratamiento: ${vaccine.treatment}
📅 Fecha: ${vaccine.date.toLocaleDateString()}
${vaccine.notes ? `📝 Notas: ${vaccine.notes}` : ''}

Faltan ${daysUntil} días. No olvides agendar tu cita.

---
PetHealth - Cuidando a tu mejor amigo 🐾
      `.trim();
      
      await sendEmail(vaccine.owner_email, subject, message);
      console.log(`✅ Recordatorio de vacuna enviado a ${vaccine.owner_email}`);
    }
    
    console.log(`💉 Recordatorios de vacunas procesados: ${vaccines.rows.length}`);
  } catch (err) {
    console.error("❌ Error enviando recordatorios de vacunas:", err.message);
  }
};

// Función para recordatorios de tareas
const sendTaskReminders = async () => {
  try {
    console.log("📋 Verificando tareas pendientes...");
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        u.name as owner_name,
        u.email as owner_email,
        p.name as pet_name
      FROM tasks t
      JOIN pets p ON t.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.due_date::date = $1
        AND t.completed = false
    `;
    
    const tasks = await pool.query(query, [tomorrow]);
    
    for (const task of tasks.rows) {
      const subject = `📋 Recordatorio: Tarea de ${task.pet_name} para mañana`;
      const message = `
Hola ${task.owner_name},

Tienes una tarea pendiente para ${task.pet_name} mañana:

📌 ${task.title}
${task.description ? `📝 ${task.description}` : ''}
📅 Vence: ${task.due_date.toLocaleDateString()}

No olvides completarla a tiempo.

---
PetHealth - Cuidando a tu mejor amigo 🐾
      `.trim();
      
      await sendEmail(task.owner_email, subject, message);
      console.log(`✅ Recordatorio de tarea enviado a ${task.owner_email}`);
    }
    
    console.log(`📋 Recordatorios de tareas procesados: ${tasks.rows.length}`);
  } catch (err) {
    console.error("❌ Error enviando recordatorios de tareas:", err.message);
  }
};

module.exports = {
  sendAppointmentReminders,
  sendVaccineReminders,
  sendTaskReminders
};
