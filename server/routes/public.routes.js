// ============================================
// SERVER/ROUTES/PUBLIC.ROUTES.JS
// ============================================
const router = require('express').Router();
const pool = require('../db'); 

// 1. GET: Lista de Clínicas (ESTA ES LA RUTA QUE TE FALTABA PARA EL ERROR 404)
router.get('/clinics', async (req, res) => {
  try {
    // Solo necesitamos ID y Nombre para el selector
    const result = await pool.query('SELECT id, name FROM clinics ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error cargando clínicas:', error);
    res.status(500).json({ message: 'Error cargando clínicas' });
  }
});

// 2. GET: Veterinarios por Clínica (Para el filtro del QR)
router.get('/veterinarians/by-clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    let query = '';
    let params = [];

    if (clinicId === 'independent') {
      query = `SELECT id, name, specialty FROM veterinarians WHERE clinic_id IS NULL ORDER BY name ASC`;
    } else {
      query = `SELECT id, name, specialty FROM veterinarians WHERE clinic_id = $1 ORDER BY name ASC`;
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
      'SELECT id, name, breed, birth_date, weight, gender, photo_url, allergies, is_sterilized FROM pets WHERE id = $1',
      [id]
    );

    if (petQuery.rows.length === 0) return res.status(404).json({ message: 'Mascota no encontrada' });

    const historyQuery = await pool.query(
      'SELECT * FROM medical_records WHERE pet_id = $1 ORDER BY visit_date DESC',
      [id]
    );

    res.json({ pet: petQuery.rows[0], records: historyQuery.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// 4. POST: Guardar Consulta (Lógica de Mapas)
router.post('/medical-records', async (req, res) => {
  console.log("📝 Payload recibido:", req.body); 

  try {
    const { 
      pet_id, clinic_id, clinic_name, veterinarian_name, 
      diagnosis, treatment, recorded_weight, notes, next_visit,
      visit_type, temperature, heart_rate 
    } = req.body;

    let lat = null;
    let lng = null;
    let mapUrl = null;

    // Recuperar coordenadas si hay ID de clínica
    if (clinic_id && clinic_id !== 'independent' && clinic_id !== 'other') {
      const clinicData = await pool.query('SELECT latitude, longitude, google_maps_url FROM clinics WHERE id = $1', [clinic_id]);
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

    const newRecord = await pool.query(
      `INSERT INTO medical_records (
        pet_id, clinic_name, veterinarian_name, diagnosis, treatment, 
        recorded_weight, notes, next_visit_date, visit_type, temperature, heart_rate, 
        clinic_lat, clinic_lng, clinic_map_url, visit_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) RETURNING *`,
      [
        pet_id, clinic_name, veterinarian_name, diagnosis, treatment, 
        validWeight, notes, validNextVisit, 
        visit_type || 'Consulta General', validTemp, validHeartRate,
        lat, lng, mapUrl 
      ]
    );

    if (validWeight) {
      await pool.query('UPDATE pets SET weight = $1 WHERE id = $2', [validWeight, pet_id]);
    }

    res.json(newRecord.rows[0]);

  } catch (error) {
    console.error("🔥 ERROR SQL:", error.message); 
    res.status(500).json({ message: 'Error en base de datos: ' + error.message });
  }
});

module.exports = router;