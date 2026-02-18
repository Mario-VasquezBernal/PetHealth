function appointmentTemplate({ name, petName, date, reason, calendarLink }) {

  return `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">

      <div style="background:#16a34a; color:white; padding:20px; text-align:center;">
        <h2 style="margin:0;">PetHealth 🐾</h2>
        <p style="margin:0;">Confirmación de Cita</p>
      </div>

      <div style="padding:20px; color:#333;">
        <p>Hola <strong>${name || ""}</strong>,</p>

        <p>Tu mascota <strong>${petName}</strong> tiene una cita programada.</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:15px 0;">
          <p><strong>📅 Fecha:</strong> ${date}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
        </div>

        <div style="text-align:center; margin:20px 0;">
          <a href="${calendarLink}" 
             style="background:#16a34a; color:white; padding:12px 20px; 
                    border-radius:6px; text-decoration:none; font-weight:bold;">
            📅 Agregar a Google Calendar
          </a>
        </div>

        <p>Gracias por confiar en PetHealth.</p>

        <p style="color:#64748b; font-size:12px;">
          Este es un mensaje automático, no responder.
        </p>
      </div>

    </div>
  </div>
  `;
}

module.exports = appointmentTemplate;
