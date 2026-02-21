const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`📧 Enviando correo a: ${to} con SendGrid`);
    console.log(`📝 Asunto: ${subject}`);

    const msg = {
      to: to,
      from: 'pethealth482@gmail.com',
      subject: subject,
      html: htmlContent,   // ← CLAVE: html no text
    };

    const response = await sgMail.send(msg);

    console.log(`✅ Correo enviado exitosamente a ${to}`);
    console.log(`📬 Status: ${response[0].statusCode}`);

    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error("❌ Error enviando correo:", error.message);
    if (error.response) {
      console.error("❌ Response body:", JSON.stringify(error.response.body));
    }
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
