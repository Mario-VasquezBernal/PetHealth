const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');

// Obtener todas las clínicas
router.get('/', authorization, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM clinics ORDER BY name ASC'
        );
        res.json({ clinics: result.rows });
    } catch (error) {
        console.error('Error obteniendo clínicas:', error);
        res.status(500).json({ error: 'Error al obtener clínicas' });
    }
});

// Crear clínica
router.post('/', authorization, async (req, res) => {
    try {
        const { name, address, city, phone, latitude, longitude } = req.body;

        const result = await pool.query(
            `INSERT INTO clinics (name, address, city, phone, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, address, city || null, phone || null, latitude || null, longitude || null]
        );

        res.status(201).json({ clinic: result.rows[0] });
    } catch (error) {
        console.error('Error creando clínica:', error);
        res.status(500).json({ error: 'Error al crear clínica' });
    }
});

// Actualizar clínica
router.put('/:id', authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, city, phone, latitude, longitude } = req.body;

        const result = await pool.query(
            `UPDATE clinics 
             SET name = $1, address = $2, city = $3, phone = $4, latitude = $5, longitude = $6
             WHERE id = $7 RETURNING *`,
            [name, address, city, phone, latitude, longitude, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clínica no encontrada' });
        }

        res.json({ clinic: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando clínica:', error);
        res.status(500).json({ error: 'Error al actualizar clínica' });
    }
});

// Eliminar clínica
router.delete('/:id', authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM clinics WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clínica no encontrada' });
        }

        res.json({ message: 'Clínica eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando clínica:', error);
        res.status(500).json({ error: 'Error al eliminar clínica' });
    }
});

module.exports = router;
