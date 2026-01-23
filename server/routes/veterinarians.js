const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const { body, validationResult } = require('express-validator');

// Obtener veterinarios DEL USUARIO ACTUAL
router.get('/', authorization, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM veterinarians WHERE user_id = $1 ORDER BY name ASC',
            [req.user]
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { name, specialty, phone, email } = req.body;

        const result = await pool.query(
            `INSERT INTO veterinarians (name, specialty, phone, email, user_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, specialty || null, phone || null, email || null, req.user.id]
        );

        res.status(201).json({ veterinarian: result.rows[0] });
    } catch (error) {
        console.error('Error creando veterinario:', error);
        res.status(500).json({ error: 'Error al crear veterinario' });
    }
});

// Actualizar veterinario (SOLO SI ES DEL USUARIO)
router.put('/:id', [
    authorization,
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }

        const { id } = req.params;
        const { name, specialty, phone, email } = req.body;

        // Verificar que el veterinario pertenezca al usuario
        const checkOwnership = await pool.query(
            'SELECT * FROM veterinarians WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ error: 'Veterinario no encontrado o no autorizado' });
        }

        const result = await pool.query(
            `UPDATE veterinarians 
             SET name = $1, specialty = $2, phone = $3, email = $4
             WHERE id = $5 AND user_id = $6 RETURNING *`,
            [name, specialty, phone, email, id, req.user.id]
        );

        res.json({ veterinarian: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando veterinario:', error);
        res.status(500).json({ error: 'Error al actualizar veterinario' });
    }
});

// Eliminar veterinario (SOLO SI ES DEL USUARIO)
router.delete('/:id', authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM veterinarians WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Veterinario no encontrado o no autorizado' });
        }

        res.json({ message: 'Veterinario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando veterinario:', error);
        res.status(500).json({ error: 'Error al eliminar veterinario' });
    }
});

module.exports = router;
