// ============================================
// SERVER/ROUTES/VETERINARIANS.JS
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// =======================================================
// 1. RUTAS PÚBLICAS / DIRECTORIO (Para usuarios normales)
// =======================================================

// GET: Directorio completo (Ranking)
router.get('/directory/all', authorization, async (req, res) => {
  try {
    // Usamos ::text para evitar errores de tipo UUID vs INTEGER en el JOIN
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.name, 
        v.specialty, 
        v.phone,
        v.email,
        v.clinic_id,  
        c.name as clinic_name,
        c.latitude,
        c.longitude,
        COALESCE(v.average_rating, 0) as average_rating,
        COALESCE(v.total_ratings, 0) as total_ratings
      FROM veterinarians v
      LEFT JOIN clinics c ON v.clinic_id::text = c.id::text 
      ORDER BY average_rating DESC, total_ratings DESC
    `);
    
    // Enviamos el objeto exacto que espera el frontend
    res.json({ veterinarians: result.rows });
    
  } catch (error) {
    console.error('Error cargando directorio:', error);
    res.status(500).json({ error: 'Error al cargar directorio' });
  }
});

// GET: Perfil detallado
router.get('/directory/profile/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;

    // Datos del Doctor (Casting ::text por seguridad)
    const vetInfo = await pool.query(`
      SELECT v.*, c.name as clinic_name, c.address as clinic_address
      FROM veterinarians v
      LEFT JOIN clinics c ON v.clinic_id::text = c.id::text
      WHERE v.id = $1
    `, [id]);

    if (vetInfo.rows.length === 0) return res.status(404).json({ message: 'Doctor no encontrado' });

    // Reseñas
    const reviews = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as user_name
      FROM veterinarian_ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.veterinarian_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({ veterinarian: vetInfo.rows[0], reviews: reviews.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cargando perfil' });
  }
});


// =======================================================
// 2. RUTAS DE GESTIÓN (ADMIN)
// =======================================================

// GET: Mis veterinarios (Gestión)
router.get('/', authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, 
       c.name as clinic_name,
       COALESCE(v.average_rating, 0) as average_rating,
       COALESCE(v.total_ratings, 0) as total_ratings
       FROM veterinarians v
       LEFT JOIN clinics c ON v.clinic_id::text = c.id::text
       WHERE v.user_id = $1
       ORDER BY v.name ASC`,
      [req.user.id]
    );

    res.json({ veterinarians: result.rows });
  } catch (error) {
    console.error('Error obteniendo veterinarios:', error);
    res.status(500).json({ error: 'Error al obtener veterinarios' });
  }
});

// GET: Veterinario por ID
router.get('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const vetResult = await pool.query(
      `SELECT v.*, c.name as clinic_name 
       FROM veterinarians v 
       LEFT JOIN clinics c ON v.clinic_id::text = c.id::text 
       WHERE v.id = $1 AND v.user_id = $2`,
      [id, req.user.id]
    );
    if (vetResult.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ veterinarian: vetResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error servidor' });
  }
});

// CREATE: Crear veterinario
router.post('/', [
  authorization,
  body('name').trim().notEmpty().withMessage('Nombre obligatorio'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, specialty, phone, email, clinic_id } = req.body;
    
    const finalClinicId = (clinic_id === 'independent' || !clinic_id) ? null : clinic_id;

    const result = await pool.query(
      `INSERT INTO veterinarians (name, specialty, phone, email, clinic_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, specialty || null, phone || null, email || null, finalClinicId, req.user.id]
    );

    res.status(201).json({ veterinarian: result.rows[0] });
  } catch (error) {
    console.error('Error creando:', error);
    res.status(500).json({ error: 'Error al crear' });
  }
});

// UPDATE: Editar
router.put('/:id', [
  authorization,
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, phone, email, clinic_id } = req.body;
    
    const check = await pool.query('SELECT id FROM veterinarians WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'No autorizado' });

    const finalClinicId = (clinic_id === 'independent' || !clinic_id) ? null : clinic_id;

    const result = await pool.query(
      `UPDATE veterinarians SET name = $1, specialty = $2, phone = $3, email = $4, clinic_id = $5 
       WHERE id = $6 RETURNING *`,
      [name, specialty, phone, email, finalClinicId, id]
    );
    res.json({ veterinarian: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// DELETE: Eliminar
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM veterinarians WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});
// GET: conteo de consultas por veterinario
router.get('/consult-counts', authorization, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT veterinarian_name, COUNT(*) as count
      FROM medical_records
      WHERE veterinarian_name IS NOT NULL
      GROUP BY veterinarian_name
    `);

    // Cruzar con IDs reales
    const vets = await pool.query(`SELECT id, name FROM veterinarians`);
    const counts = vets.rows.map(v => ({
      vet_id: v.id,
      count:  result.rows.find(r =>
        r.veterinarian_name?.toLowerCase() === v.name?.toLowerCase()
      )?.count || 0
    }));

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error contando consultas' });
  }
});

module.exports = router;