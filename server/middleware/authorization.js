const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization"); // "Bearer <token>"

    if (!authHeader) {
      return res.status(403).json({ error: "No autorizado - Token no proporcionado" });
    }

    const jwtToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

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

    if (!userId) {
      return res.status(403).json({ error: "Token inválido: user id faltante" });
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    return res.status(403).json({ error: `Error de autenticación: ${err.message}` });
  }
};
