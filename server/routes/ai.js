const router      = require('express').Router();
const pool        = require('../db');
const authorization = require('../middleware/authorization');
const { predictHealth } = require('../ai/healthPredictor');

router.post('/health-prediction', authorization, async (req, res) => {
  try {
    const { pet_id, lifestyle, species } = req.body;

    if (!pet_id || !lifestyle) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // ── Datos base de la mascota (igual que antes)
    const petResult = await pool.query(
      `SELECT
         p.*,
         sc.code          AS species_code,
         sc.display_name  AS species_name,
         sc.ai_profile,
         EXTRACT(YEAR FROM AGE(p.birth_date)) AS age
       FROM pets p
       JOIN species_catalog sc ON sc.code = p.species_code
       WHERE p.id = $1 AND p.user_id = $2`,
      [pet_id, req.user.id]
    );

    if (petResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const pet = petResult.rows[0];
    if (species) pet.species = species;

    // ── Historial de pesos desde medical_records
    const weightResult = await pool.query(
      `SELECT
         visit_date  AS date,
         measured_weight AS weight
       FROM medical_records
       WHERE pet_id = $1
         AND measured_weight IS NOT NULL
       ORDER BY visit_date ASC`,
      [pet_id]
    );

    // ── Vacunaciones
    const vaccinationResult = await pool.query(
      `SELECT vaccine_name, next_due_date
       FROM vaccinations
       WHERE pet_id = $1`,
      [pet_id]
    );

    // ── Registros médicos para análisis de síntomas (últimos 6 meses)
    const medicalResult = await pool.query(
      `SELECT visit_date, diagnosis, notes, treatment
       FROM medical_records
       WHERE pet_id = $1
         AND visit_date >= NOW() - INTERVAL '6 months'
       ORDER BY visit_date DESC`,
      [pet_id]
    );

    const prediction = predictHealth(
      pet,
      lifestyle,
      weightResult.rows,
      vaccinationResult.rows,
      medicalResult.rows
    );

    res.json({
      success: true,
      pet_id,
      prediction
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando predicción IA' });
  }
});
// Antes del module.exports
router.get('/pet/:id/vaccines', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, pet_id, vaccine_name, applied_date, next_due_date, veterinarian, notes
       FROM vaccinations
       WHERE pet_id = $1
       ORDER BY next_due_date ASC NULLS LAST`,
      [id]
    );
    res.json({ vaccines: result.rows });
  } catch (err) {
    console.error('Error fetching vaccines', err);
    res.status(500).json({ error: 'Error fetching vaccines' });
  }
});

module.exports = router;
