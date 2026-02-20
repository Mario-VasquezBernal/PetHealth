// ============================================
// SERVER/ROUTES/PUBLIC.ROUTES.JS
// ============================================
const router = require('express').Router();
const pool = require('../db');
const sendEmail = require('../utils/emailService');


// 1. GET: Lista de Clínicas
router.get('/clinics', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM clinics ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error cargando clínicas:', error);
    res.status(500).json({ message: 'Error cargando clínicas' });
  }
});


// 2. GET: Veterinarios por Clínica
router.get('/veterinarians/by-clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    let query  = '';
    let params = [];

    if (clinicId === 'independent') {
      query = `
        SELECT id, name, specialty
        FROM veterinarians
        WHERE clinic_id IS NULL
        ORDER BY name ASC
      `;
    } else {
      query = `
        SELECT id, name, specialty
        FROM veterinarians
        WHERE clinic_id = $1
        ORDER BY name ASC
      `;
      params = [clinicId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error filtrando doctores:', error);
    res.status(500).json({ message: 'Error cargando doctores' });
  }
});


// 3. GET: Datos de Mascota (historial público)
router.get('/pets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const petQuery = await pool.query(
      `SELECT id, name, breed, birth_date, weight, gender, photo_url, allergies, is_sterilized
       FROM pets WHERE id = $1`,
      [id]
    );

    if (petQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Mascota no encontrada' });
    }

    const historyQuery = await pool.query(
      'SELECT * FROM medical_records WHERE pet_id = $1 ORDER BY visit_date DESC',
      [id]
    );

    res.json({ pet: petQuery.rows[0], records: historyQuery.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// 4. POST: Guardar Consulta + vacuna + cita + email
router.post('/medical-records', async (req, res) => {

  console.log("📝 Payload recibido:", req.body);

  try {
    const {
      token: qrToken,
      diagnosis,
      treatment,
      recorded_weight,
      notes,
      next_visit,
      visit_type,
      temperature,
      heart_rate,
      // ── NUEVOS: datos de vacuna
      vaccine_name,
      vaccine_applied_date,
      vaccine_next_due_date,
      vaccine_notes,
      // fallback del frontend
      clinic_name:       frontendClinicName,
      veterinarian_name: frontendVetName,
    } = req.body;

    let pet_id             = req.body.pet_id || null;
    let clinic_name        = frontendClinicName || null;
    let veterinarian_name  = frontendVetName    || null;
    let resolved_vet_id    = null;
    let resolved_clinic_id = null;

    // ── RESOLVER DATOS DESDE EL TOKEN QR
    if (qrToken) {
      const tokenResult = await pool.query(
        `SELECT
           qt.pet_id,
           qt.vet_id,
           qt.clinic_id,
           v.name    AS vet_name,
           c.name    AS clinic_name,
           c.address AS clinic_address
         FROM qr_tokens qt
         LEFT JOIN veterinarians v ON v.id = qt.vet_id
         LEFT JOIN clinics       c ON c.id = qt.clinic_id
         WHERE qt.token = $1 AND qt.expires_at > NOW()`,
        [qrToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({ message: 'Token QR inválido o expirado' });
      }

      const t            = tokenResult.rows[0];
      pet_id             = t.pet_id;
      resolved_vet_id    = t.vet_id;
      resolved_clinic_id = t.clinic_id;
      veterinarian_name  = t.vet_name    || veterinarian_name;
      clinic_name        = t.clinic_name || clinic_name;

      console.log("🔍 resolved_vet_id:",    resolved_vet_id);
      console.log("🔍 resolved_clinic_id:", resolved_clinic_id);
    }

    if (!pet_id) {
      return res.status(400).json({ message: 'pet_id requerido' });
    }

    // ── COORDENADAS DE CLÍNICA
    let lat    = null;
    let lng    = null;
    let mapUrl = null;

    if (resolved_clinic_id) {
      const clinicData = await pool.query(
        `SELECT latitude, longitude, google_maps_url FROM clinics WHERE id = $1`,
        [resolved_clinic_id]
      );
      if (clinicData.rows.length > 0) {
        lat = clinicData.rows[0].latitude;
        lng = clinicData.rows[0].longitude;
        if (lat && lng) {
          mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        } else {
          mapUrl = clinicData.rows[0].google_maps_url;
        }
      }
    }

    const validNextVisit = (next_visit && next_visit !== '') ? next_visit : null;
    const validWeight    = (recorded_weight !== null && recorded_weight !== '' && recorded_weight !== undefined)
                           ? parseFloat(recorded_weight) : null;
    const validTemp      = temperature ? parseFloat(temperature) : null;
    const validHeartRate = heart_rate  ? parseInt(heart_rate)    : null;

    // ── CREAR REGISTRO MÉDICO
    // NOTA: measured_weight alimenta el motor IA, recorded_weight es para compatibilidad
    const newRecord = await pool.query(
      `INSERT INTO medical_records (
        pet_id, clinic_name, veterinarian_name,
        diagnosis, treatment, recorded_weight, measured_weight,
        notes, next_visit_date, visit_type,
        temperature, heart_rate,
        clinic_lat, clinic_lng, clinic_map_url,
        visit_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
      RETURNING *`,
      [
        pet_id,
        clinic_name,
        veterinarian_name,
        diagnosis,
        treatment,
        validWeight,       // $6 — se usa para recorded_weight Y measured_weight
        notes         || null,
        validNextVisit,
        visit_type    || 'Consulta General',
        validTemp,
        validHeartRate,
        lat,
        lng,
        mapUrl
      ]
    );

    const record = newRecord.rows[0];

    // ── ACTUALIZAR PESO EN pets
    if (validWeight !== null) {
      await pool.query(
        'UPDATE pets SET weight = $1 WHERE id = $2',
        [validWeight, pet_id]
      );
    }

    // ── GUARDAR VACUNA (si el veterinario la registró)
    let vaccinationRecord = null;
    if (vaccine_name && vaccine_name.trim() !== '') {
      try {
        const validAppliedDate  = vaccine_applied_date  || new Date().toISOString().split('T')[0];
        const validNextDueDate  = vaccine_next_due_date || null;

        const vacResult = await pool.query(
          `INSERT INTO vaccinations (
            pet_id, vaccine_name, applied_date,
            next_due_date, veterinarian, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            pet_id,
            vaccine_name.trim(),
            validAppliedDate,
            validNextDueDate,
            veterinarian_name || null,
            vaccine_notes     || null
          ]
        );
        vaccinationRecord = vacResult.rows[0];
        console.log("💉 Vacuna registrada:", vaccine_name);
      } catch (vacErr) {
        // No detener el flujo si falla la vacuna
        console.error('⚠️ Error guardando vacuna:', vacErr.message);
      }
    }

    // ── OBTENER DUEÑO
    const ownerResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, p.name AS pet_name
       FROM pets p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [pet_id]
    );

    const owner = ownerResult.rows[0];
    let appointmentDate = null;
    let appointmentId   = null;

    // ── CREAR CITA
    if (validNextVisit && owner) {
      appointmentDate = new Date(validNextVisit);

      const existing = await pool.query(
        `SELECT id FROM appointments
         WHERE pet_id = $1
         AND date::date = $2::date
         AND status != 'cancelled'`,
        [pet_id, appointmentDate]
      );

      if (existing.rows.length === 0) {
        const appointmentResult = await pool.query(
          `INSERT INTO appointments
             (user_id, pet_id, vet_id, clinic_id, date, reason, status)
           VALUES ($1,$2,$3,$4,$5,$6,'scheduled')
           RETURNING id`,
          [
            owner.id,
            pet_id,
            resolved_vet_id    || null,
            resolved_clinic_id || null,
            appointmentDate,
            'Revisión programada por el veterinario'
          ]
        );
        appointmentId = appointmentResult.rows[0].id;
        console.log("📅 Cita creada:", appointmentId);
      } else {
        appointmentId = existing.rows[0].id;
        console.log("⚠️ Ya existía cita:", appointmentId);
      }
    }

    // ── EMAIL
    if (sendEmail && owner?.email) {
      let message = `Hola ${owner.full_name || ''},\n\nSe ha registrado una consulta médica para tu mascota ${owner.pet_name}.\n`;
      if (validWeight) message += `\n⚖️ Peso registrado: ${validWeight} kg`;
      if (vaccinationRecord) message += `\n💉 Vacuna aplicada: ${vaccine_name}${vaccine_next_due_date ? ` (próxima dosis: ${vaccine_next_due_date})` : ''}`;
      if (appointmentDate)   message += `\n📅 Próxima revisión: ${appointmentDate.toLocaleString()}`;
      else                   message += `\nNo se requiere revisión adicional por el momento.`;

      try {
        await sendEmail(owner.email, 'Registro médico - PetHealth', message);
        console.log("📧 Correo enviado");
      } catch (mailErr) {
        console.error('Error enviando correo:', mailErr.message);
      }
    }

    // ── RESPUESTA FINAL
    res.json({
      ...record,
      appointment_id:    appointmentId,
      vaccination_saved: vaccinationRecord ? true : false,
      vaccination:       vaccinationRecord || null
    });

  } catch (error) {
    console.error("🔥 ERROR SQL:", error.message);
    res.status(500).json({ message: 'Error en base de datos: ' + error.message });
  }
});


module.exports = router;
