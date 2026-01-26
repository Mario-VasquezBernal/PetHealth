const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// GET: Obtener todas las calificaciones de un veterinario
router.get('/veterinarian/:vetId', async (req, res) => {
  try {
    const { vetId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name as user_name,
        a.date as appointment_date
      FROM veterinarian_ratings r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      WHERE r.veterinarian_id = $1
      ORDER BY r.created_at DESC`,
      [vetId]
    );
    
    // Calcular estadísticas
    const avgResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        ROUND(AVG(rating)::numeric, 2) as average,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating
      FROM veterinarian_ratings
      WHERE veterinarian_id = $1`,
      [vetId]
    );
    
    res.json({
      ratings: result.rows,
      statistics: avgResult.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// GET: Obtener mis propias calificaciones
router.get('/my-reviews', authorization, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        v.name as veterinarian_name,
        v.specialty,
        a.date as appointment_date
      FROM veterinarian_ratings r
      JOIN veterinarians v ON r.veterinarian_id = v.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ reviews: result.rows });
  } catch (error) {
    console.error('Error obteniendo mis calificaciones:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

// POST: Crear una nueva calificación
router.post('/', [
  authorization,
  body('veterinarian_id')
    .notEmpty()
    .withMessage('ID del veterinario es requerido')
    .isUUID()
    .withMessage('ID inválido'),
  body('appointment_id')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('ID de cita inválido'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser entre 1 y 5'),
  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres')
    .custom(value => {
      if (value && (value.includes('http://') || value.includes('https://'))) {
        throw new Error('Los enlaces no están permitidos en comentarios');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    const { veterinarian_id, appointment_id, rating, comment } = req.body;
    const user_id = req.user.id;
    
    // Verificar que el veterinario existe
    const vetCheck = await pool.query(
      'SELECT id FROM veterinarians WHERE id = $1',
      [veterinarian_id]
    );
    if (vetCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Veterinario no encontrado' });
    }
    
    // Si hay appointment_id, verificar que pertenece al usuario
    if (appointment_id) {
      const appointCheck = await pool.query(
        'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
        [appointment_id, user_id]
      );
      if (appointCheck.rows.length === 0) {
        return res.status(403).json({ error: 'No autorizado para calificar esta cita' });
      }
    }
    
    // Verificar que no exista una calificación previa para esta cita
    if (appointment_id) {
      const existingRating = await pool.query(
        'SELECT id FROM veterinarian_ratings WHERE appointment_id = $1 AND user_id = $2',
        [appointment_id, user_id]
      );
      if (existingRating.rows.length > 0) {
        return res.status(409).json({ error: 'Ya has calificado esta cita' });
      }
    }
    
    // Crear la calificación
    const result = await pool.query(
      `INSERT INTO veterinarian_ratings (veterinarian_id, user_id, appointment_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [veterinarian_id, user_id, appointment_id || null, rating, comment || null]
    );
    
    res.status(201).json({ rating: result.rows[0] });
  } catch (error) {
    console.error('Error creando calificación:', error);
    res.status(500).json({ error: 'Error al crear calificación' });
  }
});

// PUT: Actualizar una calificación (solo el autor)
router.put('/:id', [
  authorization,
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser entre 1 y 5'),
  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres')
    .custom(value => {
      if (value && (value.includes('http://') || value.includes('https://'))) {
        throw new Error('Los enlaces no están permitidos en comentarios');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;
    
    // Verificar que la calificación pertenece al usuario
    const ratingCheck = await pool.query(
      'SELECT id, created_at FROM veterinarian_ratings WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (ratingCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para editar esta calificación' });
    }
    
    // Verificar que no haya pasado más de 7 días desde la creación
    const createdAt = new Date(ratingCheck.rows[0].created_at);
    const daysElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysElapsed > 7) {
      return res.status(403).json({ error: 'No puedes editar una calificación después de 7 días' });
    }
    
    // Actualizar la calificación
    const result = await pool.query(
      `UPDATE veterinarian_ratings
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [rating || null, comment || null, id, user_id]
    );
    
    res.json({ rating: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando calificación:', error);
    res.status(500).json({ error: 'Error al actualizar calificación' });
  }
});

// DELETE: Eliminar una calificación (solo el autor)
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Verificar que la calificación pertenece al usuario y eliminarla
    const result = await pool.query(
      'DELETE FROM veterinarian_ratings WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para eliminar esta calificación' });
    }
    
    res.json({ message: 'Calificación eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando calificación:', error);
    res.status(500).json({ error: 'Error al eliminar calificación' });
  }
});

module.exports = router;
