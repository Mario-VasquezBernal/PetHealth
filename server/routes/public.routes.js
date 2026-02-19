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
    let query = '';
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



// 3. GET: Datos de Mascota
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



// 4. POST: Guardar Consulta + crear cita + email
router.post('/medical-records', async (req, res) => {

  console.log("📝 Payload recibido:", req.body);

  try {
    // ✅ CAMBIO: Se recibe 'token' QR para resolver pet_id, clinic_name y veterinarian_name
    // El frontend (VetQRAccess) ya no envía pet_id directamente
    const {
      token: qrToken,
      clinic_id,
      diagnosis,
      treatment,
      recorded_weight,
      notes,
      next_visit,
      visit_type,
      temperature,
      heart_rate
    } = req.body;

    // ✅ CAMBIO: Resolver pet_id, vet_name y clinic_name desde el token QR
    let pet_id = req.body.pet_id || null;
    let clinic_name = req.body.clinic_name || null;
    let veterinarian_name = req.body.veterinarian_name || null;

    // ✅ CAMBIO: Declarar IDs reales del token para usarlos en el INSERT de la cita
    let resolved_vet_id = null;
    let resolved_clinic_id = null;

    if (qrToken && !pet_id) {
      const tokenResult = await pool.query(
        // ✅ CAMBIO: Agregar qt.vet_id y qt.clinic_id al SELECT del token
        `SELECT qt.pet_id, qt.vet_id, qt.clinic_id,
                v.name AS vet_name, c.name AS clinic_name
         FROM qr_tokens qt
         LEFT JOIN veterinarians v ON v.id = qt.vet_id
         LEFT JOIN clinics c ON c.id = qt.clinic_id
         WHERE qt.token = $1 AND qt.expires_at > NOW()`,
        [qrToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({ message: 'Token QR inválido o expirado' });
      }

      pet_id            = tokenResult.rows[0].pet_id;
      resolved_vet_id    = tokenResult.rows[0].vet_id;    // ✅ CAMBIO: ID real del vet
      resolved_clinic_id = tokenResult.rows[0].clinic_id; // ✅ CAMBIO: ID real de la clínica
      veterinarian_name = tokenResult.rows[0].vet_name || veterinarian_name;
      clinic_name       = tokenResult.rows[0].clinic_name || clinic_name;
    }

    if (!pet_id) {
      return res.status(400).json({ message: 'pet_id requerido' });
    }

    let lat = null;
    let lng = null;
    let mapUrl = null;

    // Coordenadas de clínica
    if (clinic_id && clinic_id !== 'independent' && clinic_id !== 'other') {
      const clinicData = await pool.query(
        `SELECT latitude, longitude, google_maps_url
         FROM clinics WHERE id = $1`,
        [clinic_id]
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

    const validNextVisit = next_visit === "" ? null : next_visit;
    const validWeight = recorded_weight ? parseFloat(recorded_weight) : null;
    const validTemp = temperature ? parseFloat(temperature) : null;
    const validHeartRate = heart_rate ? parseInt(heart_rate) : null;

    // =============================
    // CREAR REGISTRO MÉDICO
    // =============================
    const newRecord = await pool.query(
      `
      INSERT INTO medical_records (
        pet_id,
        clinic_name,
        veterinarian_name,
        diagnosis,
        treatment,
        recorded_weight,
        notes,
        next_visit_date,
        visit_type,
        temperature,
        heart_rate,
        clinic_lat,
        clinic_lng,
        clinic_map_url,
        visit_date
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()
      )
      RETURNING *
      `,
      [
        pet_id,
        clinic_name,
        veterinarian_name,
        diagnosis,
        treatment,
        validWeight,
        notes,
        validNextVisit,
        visit_type || 'Consulta General',
        validTemp,
        validHeartRate,
        lat,
        lng,
        mapUrl
      ]
    );

    const record = newRecord.rows[0];

    // Actualizar peso mascota
    if (validWeight) {
      await pool.query(
        'UPDATE pets SET weight = $1 WHERE id = $2',
        [validWeight, pet_id]
      );
    }

    // =============================
    // OBTENER DUEÑO
    // =============================
    const ownerResult = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.full_name,
        p.name AS pet_name
      FROM pets p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
      `,
      [pet_id]
    );

    const owner = ownerResult.rows[0];

    let appointmentDate = null;
    let appointmentId = null;

    // =============================
    // CREAR CITA
    // =============================
    if (validNextVisit && owner) {

      appointmentDate = new Date(validNextVisit);

      // Ignorar canceladas al buscar duplicados
      const existing = await pool.query(
        `SELECT id FROM appointments
         WHERE pet_id = $1
         AND date::date = $2::date
         AND status != 'cancelled'`,
        [pet_id, appointmentDate]
      );

      if (existing.rows.length === 0) {

        const appointmentResult = await pool.query(
          `
          INSERT INTO appointments
            (user_id, pet_id, vet_id, clinic_id, date, reason, status)
          VALUES
            ($1, $2, $3, $4, $5, $6, 'scheduled')
          RETURNING id
          `,
          [
            owner.id,
            pet_id,
            resolved_vet_id || null,                                       // ✅ CAMBIO: vet real del token QR (antes era NULL fijo)
            resolved_clinic_id || (clinic_id === 'independent' ? null : clinic_id), // ✅ CAMBIO: clinic real del token QR
            appointmentDate,
            'Revisión programada por el veterinario'
          ]
        );

        appointmentId = appointmentResult.rows[0].id;
        console.log("📅 Cita creada correctamente:", appointmentId);

      } else {
        appointmentId = existing.rows[0].id;
        console.log("⚠️ Ya existía cita:", appointmentId);
      }
    }

    // =============================
    // EMAIL
    // =============================
    if (sendEmail && owner?.email) {

      let message = `
Hola ${owner.full_name || ''},

Se ha registrado una consulta médica para tu mascota ${owner.pet_name}.
`;

      if (appointmentDate) {
        message += `


📅 Próxima revisión programada:
${appointmentDate.toLocaleString()}
`;
      } else {
        message += `


No se requiere una revisión adicional por el momento.
`;
      }

      try {
        await sendEmail(
          owner.email,
          'Registro médico - PetHealth',
          message
        );
        console.log("📧 Correo enviado correctamente");
      } catch (mailErr) {
        console.error('Error enviando correo:', mailErr.message);
      }
    }

    // =============================
    // RESPUESTA FINAL
    // =============================
    res.json({
      ...record,
      appointment_id: appointmentId
    });

  } catch (error) {
    console.error("🔥 ERROR SQL:", error.message);
    res.status(500).json({ message: 'Error en base de datos: ' + error.message });
  }
});

module.exports = router;
