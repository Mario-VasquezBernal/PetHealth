// ============================================
// routes/medical-records.js - ACTUALIZADO
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const sendEmail = require('../utils/emailService');

// ========================================
// 1️⃣ CREAR registro médico (público con token QR)
// ========================================
router.post('/create', async (req, res) => {
    const { 
        token,
        diagnosis,
        treatment,
        notes,
        measured_weight,
        city,
        vet_id,
        clinic_id,
        visit_reason,
        examination_findings,
        follow_up_date,
        visit_type
    } = req.body;

    try {

        console.log('📝 Creando registro médico...');

        // Validar token QR
        const qrToken = await pool.query(
            'SELECT * FROM qr_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (qrToken.rows.length === 0) {
            return res.status(403).json({ error: 'Token QR inválido o expirado' });
        }

        const petId = qrToken.rows[0].pet_id;

        // Obtener dueño
        const ownerQuery = await pool.query(
            'SELECT user_id FROM pets WHERE id = $1',
            [petId]
        );

        const ownerId = ownerQuery.rows[0].user_id;

        // Coordenadas clínica
        let location_lat = null;
        let location_lng = null;

        if (clinic_id) {
            const clinicData = await pool.query(
                'SELECT latitude, longitude FROM clinics WHERE id = $1',
                [clinic_id]
            );

            if (clinicData.rows.length > 0) {
                location_lat = clinicData.rows[0].latitude;
                location_lng = clinicData.rows[0].longitude;
            }
        }

        // Crear registro médico
        const recordResult = await pool.query(
            `INSERT INTO medical_records 
             (pet_id, diagnosis, notes, reason, measured_weight, visit_date,
              vet_id, clinic_id, city, visit_reason, examination_findings, 
              follow_up_date, location_lat, location_lng, visit_type)
             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                petId, 
                diagnosis, 
                notes || null,
                treatment || null,
                measured_weight ? parseFloat(measured_weight) : null,
                vet_id || null,
                clinic_id || null,
                city || null,
                visit_reason || null,
                examination_findings || null,
                follow_up_date || null,
                location_lat,
                location_lng,
                visit_type || 'rutina'
            ]
        );

        const record = recordResult.rows[0];

        // ========================================
        // Crear cita si hay follow_up_date
        // ========================================
        let appointmentCreated = false;
        let appointmentId = null; // ⭐ IMPORTANTE

        if (follow_up_date) {

            const appointmentDate = new Date(follow_up_date);

            const existing = await pool.query(
                `SELECT id FROM appointments 
                 WHERE pet_id = $1 
                 AND date::date = $2::date`,
                [petId, appointmentDate]
            );

            if (existing.rows.length === 0) {

                const appointmentResult = await pool.query(
                    `INSERT INTO appointments
                    (user_id, pet_id, vet_id, clinic_id, date, reason, status)
                    VALUES ($1,$2,$3,$4,$5,$6,'scheduled')
                    RETURNING id`,
                    [
                        ownerId,
                        petId,
                        vet_id || null,
                        clinic_id || null,
                        appointmentDate,
                        'Revisión de seguimiento veterinario'
                    ]
                );

                appointmentCreated = true;
                appointmentId = appointmentResult.rows[0].id;

                console.log("✅ Cita creada correctamente:", appointmentId);

            } else {

                appointmentId = existing.rows[0].id;
                console.log("⚠️ Ya existía cita:", appointmentId);

            }
        }

        // ========================================
        // Actualizar peso mascota
        // ========================================
        if (measured_weight && parseFloat(measured_weight) > 0) {

            await pool.query(
                'UPDATE pets SET weight = $1 WHERE id = $2',
                [parseFloat(measured_weight), petId]
            );
        }

        // ========================================
        // Email
        // ========================================
        try {

            const owner = await pool.query(
                'SELECT email, full_name FROM users WHERE id = $1',
                [ownerId]
            );

            const email = owner.rows[0]?.email;
            const name = owner.rows[0]?.full_name || '';

            if (email) {

                let message = `Hola ${name},

Se ha registrado una nueva consulta médica para tu mascota.

Diagnóstico: ${diagnosis || 'No especificado'}
`;

                if (follow_up_date) {
                    message += `\n📅 Próxima revisión: ${new Date(follow_up_date).toLocaleString("es-EC", {
                        timeZone: "America/Guayaquil"
                    })}\n`;
                }

                await sendEmail(
                    email,
                    "Registro Médico - PetHealth",
                    message
                );
            }

        } catch (mailErr) {
            console.error("⚠️ Error enviando email:", mailErr.message);
        }

        // ========================================
        // RESPUESTA FINAL
        // ========================================
        res.status(201).json({
            success: true,
            message: 'Registro médico creado exitosamente',
            record,
            appointmentCreated,
            appointment_id: appointmentId // ⭐ CLAVE PARA EL QR
        });

    } catch (error) {
        console.error('❌ Error creando registro médico:', error.message);
        res.status(500).json({ error: 'Error al guardar registro médico: ' + error.message });
    }
});


// ========================================
// 2️⃣ OBTENER historial médico
// ========================================
router.get('/pet/:petId', authorization, async (req, res) => {

    const { petId } = req.params;
    const userId = req.user.id;

    try {

        const petCheck = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND user_id = $2',
            [petId, userId]
        );

        if (petCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const records = await pool.query(
            `SELECT 
                mr.*,
                v.name as vet_name,
                v.specialty as vet_specialty,
                c.name as clinic_name,
                c.address as clinic_address,
                c.city as clinic_city,
                c.phone as clinic_phone
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
        console.error('❌ Error obteniendo historial:', error.message);
        res.status(500).json({ error: 'Error al obtener historial médico' });
    }
});

module.exports = router;
