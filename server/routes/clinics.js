const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// Obtener clínicas DEL USUARIO ACTUAL
router.get('/', authorization, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM clinics WHERE user_id = $1 ORDER BY name ASC',
            [req.user.id]
        );
        res.json({ clinics: result.rows });
    } catch (error) {
        console.error('Error obteniendo clínicas:', error);
        res.status(500).json({ error: 'Error al obtener clínicas' });
    }
});

// Crear clínica CON VALIDACIONES
router.post('/', [
    authorization,
    // Validaciones
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 10 })
        .withMessage('El nombre debe tener mínimo 10 caracteres'),
    
    body('address')
        .trim()
        .notEmpty()
        .withMessage('La dirección es obligatoria'),
    
    body('city')
        .trim()
        .notEmpty()
        .withMessage('La ciudad es obligatoria')
        .isLength({ min: 2 })
        .withMessage('La ciudad debe tener mínimo 2 caracteres'),
    
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos'),
    
    body('latitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitud inválida (debe estar entre -90 y 90)'),
    
    body('longitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitud inválida (debe estar entre -180 y 180)')
], async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { name, address, city, phone, latitude, longitude } = req.body;

        // Validar que si hay una coordenada, existan ambas
        if ((latitude && !longitude) || (!latitude && longitude)) {
            return res.status(400).json({ 
                error: 'Debes proporcionar latitud y longitud juntas' 
            });
        }

        const result = await pool.query(
            `INSERT INTO clinics (name, address, city, phone, latitude, longitude, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, address, city, phone || null, latitude || null, longitude || null, req.user.id]
        );

        res.status(201).json({ clinic: result.rows[0] });
    } catch (error) {
        console.error('Error creando clínica:', error);
        res.status(500).json({ error: 'Error al crear clínica' });
    }
});

// Actualizar clínica (SOLO SI ES DEL USUARIO)
router.put('/:id', [
    authorization,
    // Validaciones
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 10 })
        .withMessage('El nombre debe tener mínimo 10 caracteres'),
    
    body('address')
        .trim()
        .notEmpty()
        .withMessage('La dirección es obligatoria'),
    
    body('city')
        .trim()
        .notEmpty()
        .withMessage('La ciudad es obligatoria')
        .isLength({ min: 2 })
        .withMessage('La ciudad debe tener mínimo 2 caracteres'),
    
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener exactamente 10 dígitos'),
    
    body('latitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitud inválida (debe estar entre -90 y 90)'),
    
    body('longitude')
        .optional({ checkFalsy: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitud inválida (debe estar entre -180 y 180)')
], async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { id } = req.params;
        const { name, address, city, phone, latitude, longitude } = req.body;

        // Validar que si hay una coordenada, existan ambas
        if ((latitude && !longitude) || (!latitude && longitude)) {
            return res.status(400).json({ 
                error: 'Debes proporcionar latitud y longitud juntas' 
            });
        }

        // Verificar que la clínica pertenezca al usuario
        const checkOwnership = await pool.query(
            'SELECT * FROM clinics WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ error: 'Clínica no encontrada o no autorizada' });
        }

        const result = await pool.query(
            `UPDATE clinics 
             SET name = $1, address = $2, city = $3, phone = $4, latitude = $5, longitude = $6
             WHERE id = $7 AND user_id = $8 RETURNING *`,
            [name, address, city, phone, latitude, longitude, id, req.user.id]
        );

        res.json({ clinic: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando clínica:', error);
        res.status(500).json({ error: 'Error al actualizar clínica' });
    }
});

// Eliminar clínica (SOLO SI ES DEL USUARIO)
router.delete('/:id', authorization, async (req, res) => {
    try {
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
        console.error('Error eliminando clínica:', error);
        res.status(500).json({ error: 'Error al eliminar clínica' });
    }
});

module.exports = router;
