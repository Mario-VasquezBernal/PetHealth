const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(user_id) {
  const payload = {
    user: user_id
  };

  // "jwtSecret" es tu firma secreta. 
  // En un proyecto real, esto debe estar en un archivo .env
  // Por ahora usamos un string por defecto si no existe la variable
  return jwt.sign(payload, process.env.jwtSecret || "mi_secreto_super_seguro", { expiresIn: "1hr" });
}

module.exports = jwtGenerator;