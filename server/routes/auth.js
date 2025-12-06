const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const authorization = require("../middleware/authorization");

// ========================================
// 1. REGISTRO
// ========================================
router.post("/register", async (req, res) => {
  try {
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
      [name, email, bcryptPassword, phone, address, city, country]
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
// 3. OBTENER PERFIL
// ========================================
router.get("/profile", authorization, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT full_name as name, email, phone, address, city, country FROM users WHERE id = $1", 
      [req.user]
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
      [name, phone, address, city, country, req.user]
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
      [req.user]
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
      [id, req.user]
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
      [req.user, name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized]
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
      [name, species, breed, birth_date, gender, weight, photo_url, allergies, is_sterilized, id, req.user]
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
      [id, req.user]
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

module.exports = router;
