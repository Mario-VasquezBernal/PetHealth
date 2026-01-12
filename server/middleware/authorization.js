const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({ error: "No autorizado - Token no proporcionado" });
    }

    const jwtToken = token.replace("Bearer ", "");

    // ✅ SOLO usar jwtSecret (minúsculas)
    const secret = process.env.jwtSecret;
    
    console.log('🔐 JWT Secret existe:', !!secret);
    console.log('🔑 Primeros 10 chars del secret:', secret ? secret.substring(0, 10) : 'NO EXISTE');

    if (!secret) {
      console.error("❌ jwtSecret no está configurado en las variables de entorno");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    const payload = jwt.verify(jwtToken, secret);
    req.user = payload.user;
    
    console.log('✅ Token válido para usuario ID:', req.user);
    next();
    
  } catch (err) {
    console.error("❌ Error de autenticación:", err.message);
    return res.status(403).json({ error: `Error de autenticación: ${err.message}` });
  }
};
