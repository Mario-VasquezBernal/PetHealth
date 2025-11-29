const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService"); // Importar servicio de email

// 1. REGISTRO (Ruta: /auth/register)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address, city, country } = req.body;
    
    // Verificar si el usuario ya existe
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length > 0) return res.status(401).send("El usuario ya existe");

    // Encriptar contraseña
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // Insertar datos completos en la DB
    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, city, country) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, email, bcryptPassword, phone, address, city, country]
    );

    // Enviar correo de bienvenida (En segundo plano)
    const subject = "Bienvenido a PetHealth 🐾";
    const message = `Hola ${name},\n\nGracias por registrarte.\nTu cuenta en PetHealth está activa.\n\nSaludos,\nAdmin PetHealth`;
    sendEmail(email, subject, message);

    // Generar y devolver el token
    const token = jwtGenerator(newUser.rows[0].id);
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 2. LOGIN (Ruta: /auth/login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) return res.status(401).json("Credenciales incorrectas");

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(401).json("Credenciales incorrectas");

    const token = jwtGenerator(user.rows[0].id);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 3. OBTENER PERFIL (Ruta: /auth/profile)
router.get("/profile", authorization, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT full_name as name, email, phone, address, city, country FROM users WHERE id = $1", 
      [req.user]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 4. ACTUALIZAR PERFIL (Ruta: /auth/profile)
router.put("/profile", authorization, async (req, res) => {
  try {
    const { name, phone, address, city, country } = req.body;
    const update = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, city = $4, country = $5 
       WHERE id = $6 
       RETURNING full_name as name, email, phone, address, city, country`,
      [name, phone, address, city, country, req.user]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// 5. VERIFICAR TOKEN
router.get("/is-verify", authorization, async (req, res) => {
  try { res.json(true); } 
  catch (err) { res.status(500).send("Error del servidor"); }
});

module.exports = router; // <--- LÍNEA OBLIGATORIA