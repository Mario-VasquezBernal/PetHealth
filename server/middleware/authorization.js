const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // 1. Obtener el token del encabezado (header) llamado 'token'
    const jwtToken = req.header("token");
    console.log("Token recibido:", jwtToken);

    if (!jwtToken) {
      return res.status(403).json("No autorizado (Falta token)");
    }

    // 2. Verificar si el token es real usando nuestra firma secreta
    const payload = jwt.verify(jwtToken, process.env.jwtSecret || "mi_secreto_super_seguro");

    // 3. Si es válido, guardamos el ID del usuario en la petición
    // Esto es crucial: req.user ahora tendrá el UUID del usuario real
    req.user = payload.user;
    
    next(); // Dejar pasar a la siguiente ruta
  } catch (err) {
    console.error(err.message);
    return res.status(403).json("No autorizado (Token inválido)");
  }
};