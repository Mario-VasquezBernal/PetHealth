const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// ==============================
// Helper validaciones (con logs)
// ==============================
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Clinic validation error:', errors.array());
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
};

// ==============================
// GET clínicas del usuario
// ==============================
router.get('/', authorization, async (req, res) => {
  try {
    // Si no hay user, responde vacío (más tolerante para frontend)
    if (!req.user?.id) {
      return res.json({ clinics: [] });
    }

    const result = await pool.query(
      'SELECT * FROM clinics WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );

    res.json({ clinics: result.rows });
  } catch (error) {
    console.error('❌ Error obteniendo clínicas:', error);
    res.status(500).json({ error: 'Error al obtener clínicas' });
  }
});

// ==============================
// CREATE clínica
// ==============================
router.post(
  '/',
  [
    authorization,

    body('name')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

    body('address')
      .trim()
      .notEmpty().withMessage('La dirección es obligatoria'),

    body('city')
      .trim()
      .notEmpty().withMessage('La ciudad es obligatoria'),

    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),

    body('latitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida'),

    body('longitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida'),
  ],
  async (req, res) => {
    try {
      if (handleValidation(req, res)) return;
      if (!req.user?.id) return res.status(401).json({ error: 'No autorizado' });

      let { name, address, city, phone, latitude, longitude } = req.body;

      // Normalizar lat/long
      if (!latitude || !longitude) {
        latitude = null;
        longitude = null;
      }

      const result = await pool.query(
        `INSERT INTO clinics (name, address, city, phone, latitude, longitude, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          name,
          address,
          city,
          phone || null,
          latitude,
          longitude,
          req.user.id,
        ]
      );

      res.status(201).json({ clinic: result.rows[0] });
    } catch (error) {
      console.error('❌ Error creando clínica:', error);
      res.status(500).json({ error: 'Error al crear clínica' });
    }
  }
);

// ==============================
// UPDATE clínica
// ==============================
router.put(
  '/:id',
  [
    authorization,

    body('name')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

    body('address')
      .trim()
      .notEmpty().withMessage('La dirección es obligatoria'),

    body('city')
      .trim()
      .notEmpty().withMessage('La ciudad es obligatoria'),

    body('phone')
      .optional({ checkFalsy: true })
      .matches(/^[0-9]{10}$/).withMessage('El teléfono debe tener 10 dígitos'),
  ],
  async (req, res) => {
    try {
      if (handleValidation(req, res)) return;
      if (!req.user?.id) return res.status(401).json({ error: 'No autorizado' });

      const { id } = req.params;
      const { name, address, city, phone } = req.body;

      const checkOwnership = await pool.query(
        'SELECT id FROM clinics WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (checkOwnership.rows.length === 0) {
        return res.status(404).json({ error: 'Clínica no encontrada o no autorizada' });
      }

      const result = await pool.query(
        `UPDATE clinics
         SET name = $1, address = $2, city = $3, phone = $4
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [name, address, city, phone || null, id, req.user.id]
      );

      res.json({ clinic: result.rows[0] });
    } catch (error) {
      console.error('❌ Error actualizando clínica:', error);
      res.status(500).json({ error: 'Error al actualizar clínica' });
    }
  }
);

// ==============================
// DELETE clínica
// ==============================
router.delete('/:id', authorization, async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM clinics WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clínica no encontrada o no autorizada' });
    }

    res.json({ message: 'Clínica eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando clínica:', error);
    res.status(500).json({ error: 'Error al eliminar clínica' });
  }
});

module.exports = router;
