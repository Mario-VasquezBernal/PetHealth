const nodemailer = require('nodemailer');

// --- PASOS OBLIGATORIOS PARA GMAIL ---
// 1. Necesitas una "Contraseña de Aplicación" generada por Google.
// 2. Ve a la sección de Seguridad de tu cuenta de Google (debe tener verificación en 2 pasos activa).
// 3. Genera una contraseña y úsala en el campo 'pass'.
// ------------------------------------

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Usar TLS
  auth: {
    user: "mariovasquezbernal@gmail.com", 
    pass: "bzpp abrr imph nkrj" // ⚠️ ¡REEMPLAZAR!
  },
  tls: {
    rejectUnauthorized: false 
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: '"PetHealth Admin" <mariovasquezbernal@gmail.com>', 
      to: to,
      subject: subject,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${to}: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
  }
};

module.exports = sendEmail;