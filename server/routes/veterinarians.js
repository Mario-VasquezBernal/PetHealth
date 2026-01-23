const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// Obtener todos los veterinarios
router.get('/', authorization, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM veterinarians ORDER BY name ASC'
        );
        res.json({ veterinarians: result.rows });
    } catch (error) {
        console.error('Error obteniendo veterinarios:', error);
        res.status(500).json({ error: 'Error al obtener veterinarios' });
    }
});

// Crear veterinario CON VALIDACIONES
router.post('/', [
    authorization,
    // Validaciones
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener mínimo 3 caracteres'),
    
    body('specialty')
        .optional({ checkFalsy: true })
        .trim(),
    
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener 10 dígitos numéricos'),
    
    body('email')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
], async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { name, specialty, phone, email } = req.body;

        const result = await pool.query(
            `INSERT INTO veterinarians (name, specialty, phone, email)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, specialty || null, phone || null, email || null]
        );

        res.status(201).json({ veterinarian: result.rows[0] });
    } catch (error) {
        console.error('Error creando veterinario:', error);
        res.status(500).json({ error: 'Error al crear veterinario' });
    }
});

// Actualizar veterinario CON VALIDACIONES
router.put('/:id', [
    authorization,
    // Validaciones
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener mínimo 3 caracteres'),
    
    body('specialty')
        .optional({ checkFalsy: true })
        .trim(),
    
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{10}$/)
        .withMessage('El teléfono debe tener 10 dígitos numéricos'),
    
    body('email')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail()
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
        const { name, specialty, phone, email } = req.body;

        const result = await pool.query(
            `UPDATE veterinarians 
             SET name = $1, specialty = $2, phone = $3, email = $4
             WHERE id = $5 RETURNING *`,
            [name, specialty, phone, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Veterinario no encontrado' });
        }

        res.json({ veterinarian: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando veterinario:', error);
        res.status(500).json({ error: 'Error al actualizar veterinario' });
    }
});

// Eliminar veterinario
router.delete('/:id', authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM veterinarians WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Veterinario no encontrado' });
        }

        res.json({ message: 'Veterinario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando veterinario:', error);
        res.status(500).json({ error: 'Error al eliminar veterinario' });
    }
});

module.exports = router;
