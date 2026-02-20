// ============================================
// Orquestador Principal de Predicción de Salud
// Conecta: Bayes + Markov + Scoring + Peso
// ============================================
const {
  bayesObesityRisk,
  bayesRenalRisk,
  bayesHipDysplasiaRisk,
  bayesCardiacRisk,
  bayesVaccinationRisk
} = require('./bayesEngine');

const { predictMarkov }          = require('./markovEngine');
const { lifestyleRiskFactors, lifestylePriorModifier } = require('./scoringEngine');
const { predictWeight }          = require('./weightPredictor');

// ---- Perfiles de especie (sin cambio vs tu código actual) ----
const speciesProfiles = {
  dog: {
    obesityWeightThreshold: 30,
    obesityAgeThreshold:    7,
    // Priors base de riesgo por condición (probabilidad a priori)
    priors: { obesity: 0.28, renal: 0.10, hipDysplasia: 0.22, cardiac: 0.12, vaccination: 0.15 },
    brachycephalicBreeds: ['bulldog', 'pug', 'boston terrier', 'shih tzu', 'boxer']
  },
  cat: {
    obesityWeightThreshold: 6,
    obesityAgeThreshold:    8,
    priors: { obesity: 0.25, renal: 0.35, hipDysplasia: 0.05, cardiac: 0.15, vaccination: 0.20 },
    brachycephalicBreeds: ['persa', 'exotic shorthair', 'himalayo']
  },
  other: {
    obesityWeightThreshold: null,
    obesityAgeThreshold:    null,
    priors: { obesity: 0.20, renal: 0.10, hipDysplasia: 0.05, cardiac: 0.08, vaccination: 0.15 },
    brachycephalicBreeds: []
  }
};

// ---- Normalización de especie (idéntica a tu versión actual) ----
function normalizeSpeciesBackend(pet) {
  if (!pet) return 'other';
  if (pet.species_code) return String(pet.species_code).toLowerCase();
  if (pet.species)      return String(pet.species).toLowerCase();
  if (pet.type) {
    const t = String(pet.type).toLowerCase();
    if (t === 'perro') return 'dog';
    if (t === 'gato')  return 'cat';
  }
  return 'other';
}

// ---- Analiza vacunaciones vencidas ----
function analyzeVaccinations(vaccinations = []) {
  const today = new Date();
  const overdue = { rabies: false, parvo: false, distemper: false };
  for (const v of vaccinations) {
    if (!v.next_due_date) continue;
    const due = new Date(v.next_due_date);
    if (due < today) {
      const name = (v.vaccine_name || '').toLowerCase();
      if (name.includes('rabia') || name.includes('rabies'))      overdue.rabies = true;
      if (name.includes('parvo'))                                 overdue.parvo = true;
      if (name.includes('moquillo') || name.includes('distemper')) overdue.distemper = true;
    }
  }
  return overdue;
}

// ---- Analiza patrones de síntomas crónicos ----
function analyzeSymptomPatterns(medicalRecords = []) {
  const systems = { digestive: 0, respiratory: 0, dermatological: 0, renal: 0 };
  const keywords = {
    digestive:      ['vomit', 'diarr', 'digest', 'gastro', 'intestin', 'estomag'],
    respiratory:    ['tos', 'respir', 'pulmon', 'bronq', 'nasal', 'estornud'],
    dermatological: ['piel', 'derma', 'alerg', 'picaz', 'rasca', 'ecze'],
    renal:          ['renal', 'riñon', 'urin', 'nefr', 'orina']
  };

  // Solo últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const record of medicalRecords) {
    if (record.visit_date && new Date(record.visit_date) < sixMonthsAgo) continue;
    const text = [record.diagnosis, record.notes, record.treatment]
      .filter(Boolean).join(' ').toLowerCase();
    for (const [system, words] of Object.entries(keywords)) {
      if (words.some(w => text.includes(w))) systems[system]++;
    }
  }

  const detected = Object.entries(systems)
    .filter(([, count]) => count >= 2)
    .map(([system, count]) => ({
      system,
      consultCount: count,
      chronicityRisk: Math.min(0.99, 0.30 + count * 0.15)
    }));

  return detected;
}

// ---- Función principal ----
function predictHealth(pet, lifestyle, weightHistory = [], vaccinations = [], medicalRecords = []) {
  if (!pet) throw new Error('Pet data missing');

  const weight     = Number(pet.weight || 0);
  const age        = Number(pet.age || 0);
  const aiProfile  = pet.ai_profile || {};
  const speciesKey = normalizeSpeciesBackend(pet);
  const profile    = speciesProfiles[speciesKey] || speciesProfiles.other;

  // ── 1. FACTORES DE ESTILO DE VIDA (scoring → likelihoods para Bayes)
  const riskFactors   = lifestyleRiskFactors(lifestyle);
  const priorModifier = lifestylePriorModifier(lifestyle);

  // ── 2. PRIOR BASE ajustado por catálogo de especie + estilo de vida
  const basePrior = aiProfile.baseRisk === 'high'   ? 0.45 :
                    aiProfile.baseRisk === 'medium'  ? 0.30 :
                    aiProfile.baseRisk === 'low'     ? 0.18 : 0.28;

  const adjustedPrior = Math.min(0.90, basePrior * priorModifier);

  // ── 3. BAYES — OBESIDAD
  const obesityProb = bayesObesityRisk({
    prior: profile.priors.obesity * priorModifier,
    evidence: {
      overweight:      profile.obesityWeightThreshold && weight > profile.obesityWeightThreshold,
      oldAge:          profile.obesityAgeThreshold && age > profile.obesityAgeThreshold,
      rapidWeightGain: false, // se actualizará desde weightPredictor
      neutered:        pet.is_sterilized || false,
      poorDiet:        riskFactors.poorDiet,
      lowExercise:     riskFactors.lowExercise
    }
  });

  // ── 4. BAYES — RENAL
  const renalProb = bayesRenalRisk({
    prior: profile.priors.renal,
    evidence: {
      isCat:             speciesKey === 'cat',
      seniorAge:         age > (speciesKey === 'cat' ? 10 : 8),
      weightLoss:        false, // se actualiza desde weightPredictor
      irregularVetVisit: riskFactors.irregularVetVisit
    }
  });

  // ── 5. BAYES — DISPLASIA DE CADERA
  const hipProb = bayesHipDysplasiaRisk({
    prior: profile.priors.hipDysplasia,
    evidence: {
      largeDog:    speciesKey === 'dog' && weight > 20,
      adultAge:    age >= 2 && age <= 8,
      overweight:  weight > (profile.obesityWeightThreshold || Infinity),
      lowExercise: riskFactors.lowExercise
    }
  });

  // ── 6. BAYES — CARDÍACA
  const breedName = (pet.breed || '').toLowerCase();
  const isBrachycephalic = profile.brachycephalicBreeds.some(b => breedName.includes(b));
  const cardiacProb = bayesCardiacRisk({
    prior: profile.priors.cardiac,
    evidence: {
      brachycephalic: isBrachycephalic,
      seniorAge:      age > (speciesKey === 'cat' ? 10 : 8),
      overweight:     weight > (profile.obesityWeightThreshold || Infinity),
      neutered:       pet.is_sterilized || false
    }
  });

  // ── 7. PREDICCIÓN DE PESO (regresión lineal)
  const weightPrediction = predictWeight(weightHistory, weight);

  // Actualizar evidencias bayesianas con datos reales del historial de peso
  let obesityProbFinal = obesityProb;
  let renalProbFinal   = renalProb;

  if (weightPrediction.available) {
    const isRapidGain = weightPrediction.rapidChangeAlert?.active &&
                        weightPrediction.kgPerMonth > 0;
    const isWeightLoss = weightPrediction.trend === 'losing' &&
                         Math.abs(weightPrediction.kgPerMonth) > 0.1;

    if (isRapidGain) {
      obesityProbFinal = bayesObesityRisk({
        prior: profile.priors.obesity * priorModifier,
        evidence: {
          overweight:      profile.obesityWeightThreshold && weight > profile.obesityWeightThreshold,
          oldAge:          profile.obesityAgeThreshold && age > profile.obesityAgeThreshold,
          rapidWeightGain: true,
          neutered:        pet.is_sterilized || false,
          poorDiet:        riskFactors.poorDiet,
          lowExercise:     riskFactors.lowExercise
        }
      });
    }

    if (isWeightLoss) {
      renalProbFinal = bayesRenalRisk({
        prior: profile.priors.renal,
        evidence: {
          isCat:             speciesKey === 'cat',
          seniorAge:         age > (speciesKey === 'cat' ? 10 : 8),
          weightLoss:        true,
          irregularVetVisit: riskFactors.irregularVetVisit
        }
      });
    }
  }

  // ── 8. VACUNACIONES
  const overdueVaccines = analyzeVaccinations(vaccinations);
  const vaccinationProb = bayesVaccinationRisk({
    prior: profile.priors.vaccination,
    evidence: {
      overdueRabies:    overdueVaccines.rabies,
      overdueParvo:     overdueVaccines.parvo,
      overdueDistemper: overdueVaccines.distemper,
      outdoorAccess:    true
    }
  });

  const criticalVaccines = Object.entries(overdueVaccines)
    .filter(([, v]) => v)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

  // ── 9. CADENA DE MARKOV — proyección de estado de salud
  const initialHealthy    = Math.max(0, 1 - obesityProbFinal - (renalProbFinal * 0.3));
  const initialOverweight = Math.min(obesityProbFinal, 1 - initialHealthy);
  const initialSick       = Math.max(0, 1 - initialHealthy - initialOverweight);

  const rawVector = [initialHealthy, initialOverweight, initialSick];
  const sum = rawVector.reduce((a, b) => a + b, 0);
  const initialVector = rawVector.map(v => +(v / sum).toFixed(3));

  const markovResult = predictMarkov(initialVector, speciesKey, age, 3);

  // ── 10. PATRONES DE SÍNTOMAS
  const symptomPatterns = analyzeSymptomPatterns(medicalRecords);

  // ── 11. SCORE DE URGENCIA DE CONSULTA (0-100)
  const urgencyScore = Math.min(100, Math.round(
  obesityProbFinal  * 30 +
  renalProbFinal    * 25 +
  cardiacProb       * 20 +
  vaccinationProb   * 15 +
  hipProb           * 10
));

  const urgencyLevel =
    urgencyScore >= 70 ? 'critical' :
    urgencyScore >= 45 ? 'high' :
    urgencyScore >= 25 ? 'medium' : 'low';

  const urgencyDays =
    urgencyScore >= 70 ? 7 :
    urgencyScore >= 45 ? 30 :
    urgencyScore >= 25 ? 90 : null;

  // ── RESPUESTA FINAL (compatible con el frontend actual) ----
  return {
    species: speciesKey,

    // Obesidad — mismo campo que antes, ahora Bayes real
    obesity: {
      probability:  Math.round(obesityProbFinal * 100),
      probabilityRaw: +obesityProbFinal.toFixed(3),
      severity:
        obesityProbFinal > 0.70 ? 'high' :
        obesityProbFinal > 0.40 ? 'medium' : 'low'
    },

    // Diabetes — estimada desde obesidad (compatible con campo anterior)
    diabetes_2y: {
      probability:  Math.round(obesityProbFinal * 0.60 * 100),
      explanation:  'Derivado del riesgo de obesidad con motor bayesiano'
    },

    // Nuevos campos de riesgo
    renalRisk: {
      probability:    Math.round(renalProbFinal * 100),
      probabilityRaw: +renalProbFinal.toFixed(3),
      severity:
        renalProbFinal > 0.60 ? 'high' :
        renalProbFinal > 0.35 ? 'medium' : 'low'
    },

    hipDysplasiaRisk: {
      probability:    Math.round(hipProb * 100),
      probabilityRaw: +hipProb.toFixed(3),
      severity: hipProb > 0.50 ? 'high' : hipProb > 0.30 ? 'medium' : 'low'
    },

    cardiacRisk: {
      probability:    Math.round(cardiacProb * 100),
      probabilityRaw: +cardiacProb.toFixed(3),
      severity: cardiacProb > 0.50 ? 'high' : cardiacProb > 0.30 ? 'medium' : 'low'
    },

    // Peso
    weightPrediction,

    // Vacunas
    vaccinationRisk: {
      probability:     Math.round(vaccinationProb * 100),
      probabilityRaw:  +vaccinationProb.toFixed(3),
      criticalVaccines,
      hasOverdueVaccines: criticalVaccines.length > 0
    },

    // Markov real con distribución probabilística
    markov_projection: markovResult,

    // Síntomas crónicos
    symptomPatterns,

    // Urgencia global
    consultUrgency: {
      score:      urgencyScore,
      level:      urgencyLevel,
      daysToVisit: urgencyDays,
      message:
        urgencyLevel === 'critical' ? 'Consulta veterinaria urgente recomendada en los próximos 7 días' :
        urgencyLevel === 'high'     ? 'Consulta recomendada en el próximo mes' :
        urgencyLevel === 'medium'   ? 'Próxima consulta en los próximos 3 meses' :
                                      'Estado general favorable, seguir calendario regular'
    },

    // Estilo de vida (score informativo para frontend)
    lifestyleScore: Math.round(
      (riskFactors.goodExercise ? 25 : riskFactors.lowExercise ? 5 : 15) +
      (riskFactors.goodDiet     ? 25 : riskFactors.poorDiet    ? 5 : 15) +
      (riskFactors.regularVetVisit ? 25 : riskFactors.irregularVetVisit ? 5 : 15)
    )
  };
}

module.exports = { predictHealth };
