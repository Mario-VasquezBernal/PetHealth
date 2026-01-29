const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    const authHeader =
  req.headers.authorization || req.headers.Authorization;
 // "Bearer <token>"

    if (!authHeader) {
      return res.status(401).json({ error: "No autorizado - Token no proporcionado" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado - Formato Bearer inválido" });
    }

    const jwtToken = authHeader.slice(7).trim();

    const secret = process.env.jwtSecret;
    if (!secret) {
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    const payload = jwt.verify(jwtToken, secret);

    const userId =
      payload?.user?.id ||
      payload?.user_id ||
      payload?.userId ||
      payload?.id ||
      payload?.sub ||
      payload?.user;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Token inválido: user id faltante" });
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: `Error de autenticación: ${err.message}` });
  }
};
