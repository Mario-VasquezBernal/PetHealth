// ============================================
// SERVER/ROUTES/CLINICS.JS
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');

// ==================================================
// 1. RUTAS DE DIRECTORIO Y RANKING
// ==================================================

// GET: Ranking de Clínicas
router.get('/directory/ranking', async (req, res) => {
  try {
    // CORRECCIÓN: Eliminamos "c.email" de la lista para que no falle
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.address, 
        c.phone,
        -- Calculamos promedio y total
        COALESCE(AVG(r.rating), 0)::NUMERIC(2,1) as average_rating,
        COUNT(r.id) as total_ratings
      FROM clinics c
      LEFT JOIN clinic_ratings r ON c.id::text = r.clinic_id::text
      GROUP BY c.id
      ORDER BY average_rating DESC, total_ratings DESC
    `);
    
    res.json({ clinics: result.rows });
  } catch (error) {
    console.error('Error cargando ranking de clínicas:', error);
    res.status(500).json({ error: 'Error al cargar directorio' });
  }
});

// GET: Obtener todas las clínicas (Lista simple)
router.get('/', async (req, res) => {
  try {
    const allClinics = await pool.query('SELECT * FROM clinics ORDER BY name ASC');
    res.json({ clinics: allClinics.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo clínicas' });
  }
});

// ==================================================
// 2. RUTAS DE RESEÑAS
// ==================================================

// POST: Calificar clínica
router.post('/:id/rate', authorization, async (req, res) => {
  try {
    const { id } = req.params; 
    const { rating, comment } = req.body;

    const check = await pool.query(
      'SELECT id FROM clinic_ratings WHERE clinic_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE clinic_ratings SET rating = $1, comment = $2, created_at = NOW() WHERE id = $3',
        [rating, comment, check.rows[0].id]
      );
      return res.json({ message: 'Calificación actualizada' });
    }

    await pool.query(
      'INSERT INTO clinic_ratings (clinic_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, rating, comment]
    );

    res.json({ message: 'Calificación guardada' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calificar clínica' });
  }
});

// GET: Ver reseñas
router.get('/:id/reviews', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.full_name as user_name 
      FROM clinic_ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.clinic_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reseñas' });
  }
});
// ==================================================
// 3. RUTAS DE GESTIÓN (CRUD ADMIN)
// ==================================================
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM clinics WHERE id = $1', [id]);
    res.json({ message: 'Clínica eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

router.put('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, phone, latitude, longitude } = req.body;

    const validLat = latitude  && !isNaN(parseFloat(latitude))  ? parseFloat(latitude)  : null;
    const validLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    await pool.query(
      `UPDATE clinics
       SET name = $1, address = $2, city = $3, phone = $4,
           latitude = $5, longitude = $6
       WHERE id = $7`,
      [name, address, city || null, phone, validLat, validLng, id]
    );
    res.json({ message: 'Clínica actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.post('/', authorization, async (req, res) => {
  try {
    const { name, address, city, phone, latitude, longitude } = req.body;

    const validLat = latitude  && !isNaN(parseFloat(latitude))  ? parseFloat(latitude)  : null;
    const validLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    const newClinic = await pool.query(
      `INSERT INTO clinics (name, address, city, phone, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, address, city || null, phone, validLat, validLng]
    );
    res.json(newClinic.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear' });
  }
});

module.exports = router;
