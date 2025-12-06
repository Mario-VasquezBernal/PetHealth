const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const authorization = require('../middleware/authorization'); // ← IMPORTAR

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_super_seguro';

// ========================================
// 1️⃣ CREAR registro médico (público con token QR)
// ========================================
router.post('/create', async (req, res) => {
    const { 
        token, 
        vet_name,
        clinic_name,
        reason, 
        diagnosis, 
        measured_weight, 
        notes,
        treatments // Array de tratamientos
    } = req.body;

    try {
        // Validar token QR
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const sessionCheck = await pool.query(
            'SELECT * FROM qr_sessions WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Sesión expirada o inválida' });
        }

        const { pet_id } = decoded;

        // Buscar o crear veterinario (simplificado)
        let vetId = null;
        if (vet_name) {
            const vetResult = await pool.query(
                'INSERT INTO veterinarians (name, specialty) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
                [vet_name, 'General']
            );
            if (vetResult.rows.length > 0) {
                vetId = vetResult.rows[0].id;
            }
        }

        // Buscar o crear clínica
        let clinicId = null;
        if (clinic_name) {
            const clinicResult = await pool.query(
                'INSERT INTO clinics (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id',
                [clinic_name]
            );
            if (clinicResult.rows.length > 0) {
                clinicId = clinicResult.rows[0].id;
            }
        }

        // Crear registro médico
        const recordResult = await pool.query(
            `INSERT INTO medical_records 
             (pet_id, vet_id, clinic_id, reason, diagnosis, measured_weight, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [pet_id, vetId, clinicId, reason, diagnosis, measured_weight, notes]
        );

        const record = recordResult.rows[0];

        // Agregar tratamientos si existen
        if (treatments && treatments.length > 0) {
            for (const treatment of treatments) {
                await pool.query(
                    `INSERT INTO treatments (record_id, type, name, dosage, next_due_date)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        record.id,
                        treatment.type,
                        treatment.name,
                        treatment.dosage,
                        treatment.next_due_date
                    ]
                );
            }
        }

        // Marcar QR como usado (opcional)
        await pool.query(
            'UPDATE qr_sessions SET is_used = true WHERE token = $1',
            [token]
        );

        res.status(201).json({
            success: true,
            message: 'Registro médico creado exitosamente',
            record
        });

    } catch (error) {
        console.error('Error creando registro médico:', error);
        res.status(500).json({ error: 'Error al guardar registro médico' });
    }
});

// ========================================
// 2️⃣ OBTENER historial médico de una mascota
// ========================================
router.get('/pet/:petId', async (req, res) => {
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

        // Obtener registros médicos con tratamientos
        const records = await pool.query(
            `SELECT 
                mr.id, mr.visit_date, mr.reason, mr.diagnosis, 
                mr.measured_weight, mr.notes,
                v.name as vet_name, v.specialty as vet_specialty,
                c.name as clinic_name, c.address as clinic_address,
                json_agg(
                    json_build_object(
                        'type', t.type,
                        'name', t.name,
                        'dosage', t.dosage,
                        'next_due_date', t.next_due_date
                    )
                ) FILTER (WHERE t.id IS NOT NULL) as treatments
             FROM medical_records mr
             LEFT JOIN veterinarians v ON mr.vet_id = v.id
             LEFT JOIN clinics c ON mr.clinic_id = c.id
             LEFT JOIN treatments t ON t.record_id = mr.id
             WHERE mr.pet_id = $1
             GROUP BY mr.id, v.name, v.specialty, c.name, c.address
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
