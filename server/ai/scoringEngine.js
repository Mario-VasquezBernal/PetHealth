// ============================================
// Motor de scoring dinámico
// ============================================

function lifestyleScore({ exercise, diet, vetVisits }) {
  let score = 0;

  if (exercise === 'high') score += 25;
  if (exercise === 'medium') score += 15;
  if (exercise === 'low') score += 5;

  if (diet === 'good') score += 25;
  if (diet === 'average') score += 15;
  if (diet === 'poor') score += 5;

  if (vetVisits === 'regular') score += 25;
  if (vetVisits === 'sometimes') score += 15;
  if (vetVisits === 'never') score += 5;

  return score; // máximo 75
}

function scoreModifier(score) {
  if (score >= 60) return 0.75;
  if (score >= 40) return 0.90;
  if (score >= 25) return 1.05;
  return 1.25;
}

module.exports = {
  lifestyleScore,
  scoreModifier
};
