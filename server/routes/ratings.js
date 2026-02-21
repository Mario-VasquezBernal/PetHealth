const express    = require('express');
const router     = express.Router();
const pool       = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// ============================================
// GET: Calificaciones de un veterinario (público)
// ============================================
router.get('/veterinarian/:vetId', async (req, res) => {
  try {
    const { vetId } = req.params;

    const result = await pool.query(
      `SELECT
         r.id, r.rating, r.comment, r.created_at,
         u.full_name AS user_name
       FROM veterinarian_ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.veterinarian_id = $1
       ORDER BY r.created_at DESC`,
      [vetId]
    );

    const stats = await pool.query(
      `SELECT
         COUNT(*)                        AS total,
         ROUND(AVG(rating)::numeric, 2)  AS average,
         MIN(rating)                     AS min_rating,
         MAX(rating)                     AS max_rating
       FROM veterinarian_ratings
       WHERE veterinarian_id = $1`,
      [vetId]
    );

    res.json({ ratings: result.rows, statistics: stats.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// ============================================
// GET: Mis reseñas (usuario autenticado)
// ============================================
router.get('/my-reviews', authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id, r.rating, r.comment, r.created_at,
         v.name AS veterinarian_name, v.specialty
       FROM veterinarian_ratings r
       JOIN veterinarians v ON r.veterinarian_id = v.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ reviews: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// ============================================
// POST: Crear calificación de veterinario
// ✅ Solo si tuvo consulta real con ese vet
// ✅ Una sola vez — no se puede editar
// ============================================
router.post('/', [
  authorization,
  body('veterinarian_id').notEmpty().isUUID().withMessage('ID del veterinario inválido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Calificación debe ser entre 1 y 5'),
  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres')
    .custom(value => {
      if (value && (value.includes('http://') || value.includes('https://'))) {
        throw new Error('No se permiten enlaces en comentarios');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { veterinarian_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // 1. Verificar que el veterinario existe
    const vetCheck = await pool.query(
      'SELECT id, name FROM veterinarians WHERE id = $1',
      [veterinarian_id]
    );
    if (vetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veterinario no encontrado' });
    }

    // 2. ✅ Verificar que tuvo una consulta real con este vet
    const vetName = vetCheck.rows[0].name;
   // ✅ Verificar consulta real con este vet
const hasConsulted = await pool.query(`
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE user_id = $1
    AND vet_id = $2
    AND status = 'completed'
  ) AS can_rate
`, [user_id, veterinarian_id]);

if (!hasConsulted.rows[0].can_rate) {
  return res.status(403).json({
    error: 'Solo puedes calificar veterinarios con quienes hayas tenido una cita completada.'
  });
}


    // 3. ✅ Verificar que no haya calificado antes — no se permite editar
    const existing = await pool.query(
      'SELECT id FROM veterinarian_ratings WHERE veterinarian_id=$1 AND user_id=$2',
      [veterinarian_id, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya calificaste a este veterinario. Las reseñas no se pueden editar.'
      });
    }

    // 4. Guardar
   // 4. Guardar (appointment_id siempre NULL — no lo usamos)
const result = await pool.query(
  `INSERT INTO veterinarian_ratings 
     (veterinarian_id, user_id, appointment_id, rating, comment)
   VALUES ($1, $2, NULL, $3, $4) RETURNING *`,
  [veterinarian_id, user_id, rating, comment || null]
);


    res.status(201).json({ rating: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear calificación' });
  }
});

// ============================================
// PUT: BLOQUEADO — las reseñas no se editan
// ============================================
router.put('/:id', authorization, (req, res) => {
  return res.status(403).json({
    error: 'Las reseñas no pueden ser editadas una vez enviadas.'
  });
});

// ============================================
// DELETE: Eliminar reseña (solo el autor)
// ============================================
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id }    = req.params;
    const user_id   = req.user.id;

    const result = await pool.query(
      'DELETE FROM veterinarian_ratings WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para eliminar esta reseña' });
    }

    res.json({ message: 'Reseña eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar reseña' });
  }
});

module.exports = router;
