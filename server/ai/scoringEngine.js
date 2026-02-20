// ============================================
// Motor de scoring — produce likelihoods (0-1)
// para alimentar directamente al bayesEngine
// ============================================

/**
 * Convierte estilo de vida en likelihoods de riesgo (0-1).
 * Alto riesgo = valor cercano a 1.
 */
function lifestyleRiskFactors({ exercise, diet, vetVisits }) {
  return {
    lowExercise:      exercise === 'low',
    poorDiet:         diet === 'poor',
    irregularVetVisit: vetVisits === 'never' || vetVisits === 'sometimes',
    // Factores protectores (reducen prior si están presentes)
    goodExercise:     exercise === 'high',
    goodDiet:         diet === 'good',
    regularVetVisit:  vetVisits === 'regular'
  };
}

/**
 * Retorna un modificador de prior bayesiano según estilo de vida.
 * Estilo de vida bueno baja el prior, malo lo sube.
 */
function lifestylePriorModifier({ exercise, diet, vetVisits }) {
  let modifier = 1.0;
  // Factores que suben el prior
  if (exercise === 'low')       modifier += 0.10;
  if (diet === 'poor')          modifier += 0.12;
  if (vetVisits === 'never')    modifier += 0.10;
  if (vetVisits === 'sometimes') modifier += 0.05;
  // Factores protectores que bajan el prior
  if (exercise === 'high')      modifier -= 0.10;
  if (diet === 'good')          modifier -= 0.08;
  if (vetVisits === 'regular')  modifier -= 0.08;

  return Math.max(0.5, Math.min(1.5, modifier));
}

module.exports = {
  lifestyleRiskFactors,
  lifestylePriorModifier
};
