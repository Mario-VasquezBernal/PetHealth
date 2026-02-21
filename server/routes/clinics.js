const express    = require('express');
const router     = express.Router();
const pool       = require('../db');
const authorization = require('../middleware/authorization');

// ==================================================
// 1. DIRECTORIO Y RANKING (público)
// ==================================================

router.get('/directory/ranking', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.name, c.address, c.phone, c.city,
        c.latitude, c.longitude,
        COALESCE(AVG(r.rating), 0)::NUMERIC(2,1) AS average_rating,
        COUNT(r.id) AS total_ratings
      FROM clinics c
      LEFT JOIN clinic_ratings r ON c.id::text = r.clinic_id::text
      GROUP BY c.id
      ORDER BY average_rating DESC, total_ratings DESC
    `);
    res.json({ clinics: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar directorio' });
  }
});

// ==================================================
// 2. CRUD DE CLÍNICAS (solo del usuario autenticado)
// ==================================================

router.get('/', authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clinics WHERE user_id = $1 ORDER BY name ASC`,
      [req.user.id]
    );
    res.json({ clinics: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo clínicas' });
  }
});

router.post('/', authorization, async (req, res) => {
  try {
    const { name, address, city, phone, latitude, longitude } = req.body;
    const validLat = latitude  && !isNaN(parseFloat(latitude))  ? parseFloat(latitude)  : null;
    const validLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    const result = await pool.query(
      `INSERT INTO clinics (name, address, city, phone, latitude, longitude, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, address, city || null, phone, validLat, validLng, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear' });
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
       SET name=$1, address=$2, city=$3, phone=$4, latitude=$5, longitude=$6
       WHERE id=$7 AND user_id=$8`,
      [name, address, city || null, phone, validLat, validLng, id, req.user.id]
    );
    res.json({ message: 'Clínica actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM clinics WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    res.json({ message: 'Clínica eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// ==================================================
// 3. RESEÑAS DE CLÍNICAS
// ==================================================

// GET: Todas las reseñas de una clínica
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.full_name AS user_name
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

// GET: Reseña más reciente del usuario (para pre-cargar el modal)
// ✅ CAMBIO: ORDER BY created_at DESC LIMIT 1 → siempre la más reciente
router.get('/:id/my-review', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM clinic_ratings
       WHERE clinic_id=$1 AND user_id=$2
       ORDER BY created_at DESC LIMIT 1`,
      [id, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reseña' });
  }
});

// POST: Calificar clínica — siempre inserta (mantiene historial completo)
// ✅ CAMBIO: eliminado el UPDATE — ahora siempre hace INSERT
router.post('/:id/rate', authorization, async (req, res) => {
  try {
    const { id }              = req.params;
    const { rating, comment } = req.body;

    // 1. Verificar que la clínica existe
    const clinicData = await pool.query('SELECT name FROM clinics WHERE id=$1', [id]);
    if (clinicData.rows.length === 0)
      return res.status(404).json({ message: 'Clínica no encontrada' });

    // 2. ¿Ya tiene reseñas previas? → no re-verificar cita, solo insertar
    const existing = await pool.query(
      'SELECT id FROM clinic_ratings WHERE clinic_id=$1 AND user_id=$2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      // Primera reseña → verificar cita completada
      const hasConsulted = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM appointments
          WHERE user_id=$1 AND clinic_id=$2 AND status='completed'
        ) AS can_rate
      `, [req.user.id, id]);

      if (!hasConsulted.rows[0].can_rate)
        return res.status(403).json({
          message: 'Solo puedes calificar clínicas donde hayas tenido una cita completada.'
        });
    }

    // 3. Siempre insertar → historial
    await pool.query(
      'INSERT INTO clinic_ratings (clinic_id, user_id, rating, comment) VALUES ($1,$2,$3,$4)',
      [id, req.user.id, rating, comment]
    );

    res.json({
      message: existing.rows.length > 0
        ? 'Nueva reseña agregada al historial'
        : 'Calificación guardada correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calificar clínica' });
  }
});

module.exports = router;
