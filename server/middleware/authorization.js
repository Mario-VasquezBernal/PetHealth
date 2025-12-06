const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({ error: "No autorizado - Token no proporcionado" });
    }

    // Remover "Bearer " del token si existe
    const jwtToken = token.replace("Bearer ", "");

    // Verificar token con la clave secreta
    const payload = jwt.verify(jwtToken, process.env.jwtSecret);

    // Guardar el ID del usuario en la petición
    req.user = payload.user;
    
    next();
    
  } catch (err) {
    console.error("Error de autenticación:", err.message);
    return res.status(403).json({ error: "No autorizado - Token inválido o expirado" });
  }
};
