// ============================================
// AUTH.JS - RUTAS DE AUTENTICACIÓN
// ============================================

const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtGenerator = require("../utils/jwtGenerator");
const authorization = require("../middleware/authorization");
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const { body, validationResult } = require('express-validator');

// ✅ NUEVO (solo esto)
//const admin = require("../config/firebase");

// ========================================
// 1. REGISTRO CON VALIDACIONES
// ========================================
router.post("/register", [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener mínimo 6 caracteres'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre completo es obligatorio')
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener mínimo 3 caracteres'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('El teléfono debe tener 10 dígitos numéricos'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('city')
    .optional({ checkFalsy: true })
    .trim(),
  body('country')
    .optional({ checkFalsy: true })
    .trim()
], async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg 
      });
    }

    const { name, email, password, phone, address, city, country } = req.body;
    
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (user.rows.length > 0) {
      return res.status(401).json({ message: "El usuario ya existe" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, city, country) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, email, bcryptPassword, phone || null, address || null, city || null, country || null]
    );

    const token = jwtGenerator(newUser.rows[0].id);
    
    return res.json({ 
      token,
      message: "Usuario registrado exitosamente" 
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

// ========================================
// 2. LOGIN
// ========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwtGenerator(user.rows[0].id);
    
    return res.json({ token });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error del servidor" });
  }
});


// ========================================
// ✅ LOGIN CON GOOGLE (FIREBASE)
// ========================================
router.post("/google", async (req, res) => {
  try {

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Token de Google requerido" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const email = decodedToken.email;
    const fullName = decodedToken.name || decodedToken.email;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    let userRow;

    if (user.rows.length === 0) {

      const newUser = await pool.query(
        `INSERT INTO users (full_name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          fullName,
          email,
          crypto.randomBytes(32).toString("hex")
        ]
      );

      userRow = newUser.rows[0];

    } else {
      userRow = user.rows[0];
    }

    const token = jwtGenerator(userRow.id);

    return res.json({ token });

  } catch (error) {
    console.error("❌ Google login error:", error.message);
    return res.status(401).json({ message: "Token de Google inválido" });
  }
});


// ========================================
// 3. OBTENER PERFIL
// ========================================
router.get("/profile", authorization, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT full_name as name, email, phone, address, city, country FROM users WHERE id = $1", 
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    return res.json(user.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

// ========================================
// 4. ACTUALIZAR PERFIL
// ========================================
router.put("/profile", authorization, async (req, res) => {
  try {
    const { name, phone, address, city, country } = req.body;
    
    const update = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, city = $4, country = $5 
       WHERE id = $6 
       RETURNING full_name as name, email, phone, address, city, country`,
      [name, phone, address, city, country, req.user.id]
    );
    
    return res.json(update.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error del servidor" });
  }
});

// ========================================
// 5. OBTENER MASCOTAS
// ========================================
router.get("/pets", authorization, async (req, res) => {
  try {
    const pets = await pool.query(
      "SELECT * FROM pets WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    
    return res.json(pets.rows);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error al obtener mascotas" });
  }
});

// ========================================
// 6. OBTENER UNA MASCOTA POR ID
// ========================================
router.get("/pets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pet = await pool.query(
      "SELECT * FROM pets WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    
    if (pet.rows.length === 0) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }
    
    return res.json(pet.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error al obtener mascota" });
  }
});

// ========================================
// 7. CREAR MASCOTA
// ========================================
router.post("/pets", authorization, async (req, res) => {
  try {
    const { name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized } = req.body;
    
    const newPet = await pool.query(
      `INSERT INTO pets (user_id, name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized]
    );
    
    return res.json(newPet.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error al crear mascota" });
  }
});

// ========================================
// 8. ACTUALIZAR MASCOTA
// ========================================
router.put("/pets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized } = req.body;
    
    const updatePet = await pool.query(
      `UPDATE pets 
       SET name = $1, species = $2, breed = $3, birth_date = $4, gender = $5, 
           weight = $6, photo_url = $7, allergies = $8, is_sterilized = $9
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized, id, req.user.id]
    );
    
    if (updatePet.rows.length === 0) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }
    
    return res.json(updatePet.rows[0]);
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error al actualizar mascota" });
  }
});

// ========================================
// 9. ELIMINAR MASCOTA
// ========================================
router.delete("/pets/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletePet = await pool.query(
      "DELETE FROM pets WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );
    
    if (deletePet.rows.length === 0) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }
    
    return res.json({ message: "Mascota eliminada exitosamente" });
    
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Error al eliminar mascota" });
  }
});

// ========================================
// 10. VERIFICAR TOKEN
// ========================================
router.get("/is-verify", authorization, async (req, res) => {
  try { 
    return res.json(true); 
  } catch (err) { 
    return res.status(500).json({ message: "Error del servidor" }); 
  }
});

// ========================================
// RECUPERACIÓN DE CONTRASEÑA
// ========================================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔑 Solicitud de recuperación para:', email);

    const user = await pool.query(
      "SELECT id, full_name, email FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({ 
        message: "Si el email existe, recibirás un link de recuperación" 
      });
    }

    const userId = user.rows[0].id;
    const userName = user.rows[0].full_name;

    const resetToken = jwt.sign(
      { userId: userId, purpose: 'password-reset' },
      process.env.jwtSecret,
      { expiresIn: "1h" }
    );

    const frontendURL = process.env.FRONTEND_URL || "https://pet-health-s659.vercel.app";
    const resetLink = `${frontendURL}/reset-password?token=${resetToken}`;

    const subject = "🔐 Recupera tu contraseña - PetHealth";
    const message = `Hola ${userName},\n\nRecibimos una solicitud para restablecer tu contraseña en PetHealth.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n${resetLink}\n\n⚠️ Este enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, puedes ignorar este correo.\n\n¡Gracias por usar PetHealth! 🐾`;

    const emailResult = await sendEmail(email, subject, message);

    if (emailResult.success) {
      console.log('✅ Email de recuperación enviado a:', email);
    } else {
      console.error('❌ Error al enviar email:', emailResult.error);
    }

    res.json({ 
      message: "Si el email existe, recibirás un link de recuperación" 
    });

  } catch (err) {
    console.error('❌ Error en forgot-password:', err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔄 Intento de reseteo de contraseña');

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token y contraseña son requeridos" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.jwtSecret);
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    if (payload.purpose !== 'password-reset') {
      return res.status(401).json({ error: "Token inválido" });
    }

    const userId = payload.userId;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, userId]
    );

    console.log('✅ Contraseña actualizada para usuario:', userId);

    const user = await pool.query(
      "SELECT full_name, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length > 0) {
      const confirmSubject = "✅ Tu contraseña ha sido actualizada - PetHealth";
      const confirmMessage = `Hola ${user.rows[0].full_name},\n\nTu contraseña de PetHealth ha sido actualizada exitosamente.\n\nSi no realizaste este cambio, contacta a soporte inmediatamente.\n\n¡Gracias por usar PetHealth! 🐾`;
      
      await sendEmail(user.rows[0].email, confirmSubject, confirmMessage);
    }

    res.json({ message: "Contraseña actualizada exitosamente" });

  } catch (err) {
    console.error('❌ Error en reset-password:', err.message);
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
