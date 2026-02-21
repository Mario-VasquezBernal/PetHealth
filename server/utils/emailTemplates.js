function appointmentTemplate({ name, petName, date, reason, calendarLink, vetName, clinicName }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Veterinaria - PetHealth</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#16a34a; padding:30px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px;">🐾 PetHealth</h1>
              <p style="margin:8px 0 0 0; color:#dcfce7; font-size:15px;">Confirmación de Cita Veterinaria</p>
            </td>
          </tr>

          <!-- SALUDO -->
          <tr>
            <td style="padding:30px 30px 0 30px;">
              <p style="margin:0; font-size:17px; color:#1e293b;">Hola <strong>${name || 'Cliente'}</strong>,</p>
              <p style="margin:12px 0 0 0; font-size:15px; color:#475569; line-height:1.6;">
                Tu cita veterinaria ha sido <strong style="color:#16a34a;">agendada y confirmada</strong>.
                Te compartimos todos los detalles a continuación.
              </p>
            </td>
          </tr>

          <!-- DETALLES -->
          <tr>
            <td style="padding:20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4; border-radius:10px; border-left:5px solid #16a34a;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px 0; font-size:16px; font-weight:bold; color:#15803d;">📋 Detalles de la Cita</p>
                    <p style="margin:8px 0; font-size:15px; color:#334155;">🐶 <strong>Mascota:</strong> ${petName}</p>
                    <p style="margin:8px 0; font-size:15px; color:#334155;">📅 <strong>Fecha y hora:</strong> ${date}</p>
                    <p style="margin:8px 0; font-size:15px; color:#334155;">📋 <strong>Motivo:</strong> ${reason || 'Consulta general'}</p>
                    ${vetName ? `<p style="margin:8px 0; font-size:15px; color:#334155;">👨‍⚕️ <strong>Veterinario:</strong> ${vetName}</p>` : ''}
                    ${clinicName ? `<p style="margin:8px 0; font-size:15px; color:#334155;">🏥 <strong>Clínica:</strong> ${clinicName}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- RECOMENDACIONES -->
          <tr>
            <td style="padding:0 30px 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border-radius:10px; border-left:5px solid #f59e0b;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px 0; font-size:15px; font-weight:bold; color:#92400e;">📌 Recuerda para tu visita</p>
                    <p style="margin:6px 0; font-size:14px; color:#78350f;">✔ Llega <strong>10 minutos antes</strong> de tu cita</p>
                    <p style="margin:6px 0; font-size:14px; color:#78350f;">✔ En PetHealth tienes el historial médico completo de tu mascota disponible</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BOTÓN CALENDAR -->
          ${calendarLink ? `
          <tr>
            <td style="padding:0 30px 25px 30px; text-align:center;">
              <a href="${calendarLink}"
                 style="display:inline-block; background-color:#16a34a; color:#ffffff;
                        padding:14px 32px; border-radius:8px; text-decoration:none;
                        font-size:15px; font-weight:bold;">
                📅 Agregar al Calendario
              </a>
            </td>
          </tr>` : ''}

          <!-- MENSAJE FINAL -->
          <tr>
            <td style="padding:0 30px 25px 30px;">
              <p style="margin:0; font-size:15px; color:#475569; text-align:center;">
                Gracias por confiar en <strong style="color:#16a34a;">PetHealth</strong> para el cuidado de tu mascota. 🐾
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px 0; font-size:12px; color:#94a3b8;">Este es un mensaje automático, por favor no respondas a este correo.</p>
              <p style="margin:0; font-size:12px; color:#94a3b8;">
                ¿Tienes dudas? Ingresa a
                <a href="https://pet-health-kappa.vercel.app" style="color:#16a34a; text-decoration:none; font-weight:bold;">pet-health-kappa.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

module.exports = appointmentTemplate;
