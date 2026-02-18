// ============================================
// routes/medical-records.js - ACTUALIZADO
// ============================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorization = require('../middleware/authorization');
const sendEmail = require('../utils/emailService'); // ⭐ NUEVO

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
        city,  // ✅ NUEVO CAMPO
        // ✅ CAMPOS EXISTENTES
        vet_id,
        clinic_id,
        visit_reason,
        examination_findings,
        follow_up_date,
        visit_type
    } = req.body;

    try {
        console.log('📝 Creando registro médico:', { 
            token: token?.substring(0, 10) + '...', 
            diagnosis, 
            measured_weight,
            city,
            vet_id,
            clinic_id 
        });

        // ✅ Validar token QR
        const qrToken = await pool.query(
            'SELECT * FROM qr_tokens WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (qrToken.rows.length === 0) {
            console.error('❌ Token QR inválido o expirado');
            return res.status(403).json({ error: 'Token QR inválido o expirado' });
        }

        const petId = qrToken.rows[0].pet_id;
        console.log('✅ Token válido para mascota ID:', petId);

        // ⭐ NUEVO — obtener dueño
        const ownerQuery = await pool.query(
            'SELECT user_id FROM pets WHERE id = $1',
            [petId]
        );
        const ownerId = ownerQuery.rows[0].user_id;

        // ✅ Obtener coordenadas de la clínica si existe
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
                console.log('📍 Coordenadas de clínica obtenidas:', { location_lat, location_lng });
            }
        }

        // ✅ Crear registro médico CON TODOS LOS CAMPOS + CITY
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
        console.log('✅ Registro médico creado con ID:', record.id);

        // ========================================
        // ⭐ NUEVO — Crear cita solo si hay follow_up_date
        // ========================================
        let appointmentCreated = false;

        if (follow_up_date) {

            const appointmentDate = new Date(follow_up_date);

            // Evitar duplicados
            const existing = await pool.query(
                `SELECT id FROM appointments 
                 WHERE pet_id = $1 
                 AND date::date = $2::date`,
                [petId, appointmentDate]
            );

            if (existing.rows.length === 0) {

                await pool.query(
                    `INSERT INTO appointments
                    (user_id, pet_id, vet_id, clinic_id, date, reason, status)
                    VALUES ($1,$2,$3,$4,$5,$6,'scheduled')`,
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
                console.log("✅ Cita creada correctamente");

            } else {
                console.log("⚠️ Ya existía cita para esa fecha");
            }
        }

        // ========================================
        // ✅ Actualizar peso de la mascota
        // ========================================
        if (measured_weight && parseFloat(measured_weight) > 0) {
            console.log('🔄 Actualizando peso de la mascota a:', measured_weight, 'kg');
            
            const updateResult = await pool.query(
                'UPDATE pets SET weight = $1 WHERE id = $2 RETURNING weight',
                [parseFloat(measured_weight), petId]
            );
            
            if (updateResult.rows.length > 0) {
                console.log('✅ Peso actualizado en tabla pets:', updateResult.rows[0].weight, 'kg');
            }
        }

        // ========================================
        // ⭐ NUEVO — Email obligatorio
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
                } else {
                    message += `\nNo se requiere una revisión adicional por el momento.\n`;
                }

                await sendEmail(
                    email,
                    "Registro Médico - PetHealth",
                    message
                );

                console.log("📧 Email enviado al propietario");
            }

        } catch (mailErr) {
            console.error("⚠️ Error enviando email:", mailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Registro médico creado exitosamente',
            record,
            appointmentCreated // ⭐ NUEVO
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
    const userId = req.user.id;

    try {
        // Verificar propiedad de la mascota
        const petCheck = await pool.query(
            'SELECT id FROM pets WHERE id = $1 AND user_id = $2',
            [petId, userId]
        );

        if (petCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // ✅ Incluir city en el SELECT
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
