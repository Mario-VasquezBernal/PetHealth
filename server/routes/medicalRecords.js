const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');

// ========================================
// 1️⃣ CREAR registro médico (público con token QR)
// ========================================
router.post('/create', async (req, res) => {
    const { 
        token,
        petId,
        diagnosis,
        treatment,
        notes,
        next_visit,
        measured_weight // ✅ AGREGAR ESTE CAMPO
    } = req.body;

    try {
        console.log('📝 Recibiendo registro médico:', { token, petId, diagnosis, measured_weight }); // ✅ Agregar peso al log

        // ✅ Validar que el token QR es válido
        const qrToken = await pool.query(
            'SELECT * FROM qr_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (qrToken.rows.length === 0) {
            console.error('❌ Token QR inválido o expirado');
            return res.status(403).json({ error: 'Token QR inválido o expirado' });
        }

        console.log('✅ Token válido');

        // ✅ Verificar que el petId coincide con el token
        if (qrToken.rows[0].pet_id !== petId) {
            console.error('❌ Token no corresponde a esta mascota');
            return res.status(403).json({ error: 'Token no corresponde a esta mascota' });
        }

        console.log('✅ Pet ID coincide');

        // ✅ Crear registro médico CON EL CAMPO measured_weight
        const recordResult = await pool.query(
            `INSERT INTO medical_records 
             (pet_id, diagnosis, notes, reason, measured_weight)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                petId, 
                diagnosis, 
                notes || null,
                treatment || null,
                measured_weight ? parseFloat(measured_weight) : null // ✅ AGREGAR PESO
            ]
        );

        const record = recordResult.rows[0];
        console.log('✅ Registro médico creado:', record.id);

        // ✅✅ ACTUALIZAR EL PESO DE LA MASCOTA
        if (measured_weight && parseFloat(measured_weight) > 0) {
            console.log('🔄 Actualizando peso de la mascota a:', measured_weight, 'kg');
            
            const updateResult = await pool.query(
                'UPDATE pets SET weight = $1 WHERE id = $2 RETURNING *',
                [parseFloat(measured_weight), petId]
            );
            
            if (updateResult.rows.length > 0) {
                console.log('✅✅ Peso actualizado exitosamente en la tabla pets');
                console.log('✅ Nuevo peso:', updateResult.rows[0].weight);
            } else {
                console.error('❌ No se encontró la mascota para actualizar');
            }
        } else {
            console.log('⚠️ No se proporcionó peso o es 0');
        }

        res.status(201).json({
            success: true,
            message: 'Registro médico creado exitosamente',
            record
        });

    } catch (error) {
        console.error('❌ Error creando registro médico:', error.message);
        res.status(500).json({ error: 'Error al guardar registro médico: ' + error.message });
    }
});

// ========================================
// 2️⃣ OBTENER historial médico de una mascota
// ========================================
router.get('/pet/:petId', authorization, async (req, res) => {
    const { petId } = req.params;
    const userId = req.user;

    try {
        // Verificar propiedad de la mascota
        const petCheck = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND user_id = $2',
            [petId, userId]
        );

        if (petCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Obtener registros médicos
        const records = await pool.query(
            `SELECT 
                mr.*,
                v.name as vet_name,
                c.name as clinic_name
             FROM medical_records mr
             LEFT JOIN veterinarians v ON mr.vet_id = v.id
             LEFT JOIN clinics c ON mr.clinic_id = c.id
             WHERE mr.pet_id = $1
             ORDER BY mr.visit_date DESC`,
            [petId]
        );

        res.json({
            success: true,
            records: records.rows
        });

    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error al obtener historial médico' });
    }
});

module.exports = router;
