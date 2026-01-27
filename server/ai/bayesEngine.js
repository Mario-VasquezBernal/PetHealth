// ============================================
// Motor Bayesiano Formal
// P(H|E) = (P(H) * Π P(Ei|H)) / Normalización
// ============================================

function calculatePosterior(prior, likelihoods) {
  if (!prior || prior <= 0) return 0;

  let numerator = prior;

  for (const l of likelihoods) {
    numerator *= l;
  }

  // Normalización simple (evita valores >1)
  const denominator = numerator + (1 - prior);

  const posterior = numerator / denominator;

  return Math.min(0.99, Math.max(0.01, posterior));
}

function bayesDiagnosis({ prior, evidence }) {
  const likelihoods = [];

  if (evidence.obesity) likelihoods.push(0.65);
  if (evidence.oldAge) likelihoods.push(0.55);
  if (evidence.heavyWeight) likelihoods.push(0.60);
  if (evidence.neutered) likelihoods.push(0.52);

  return calculatePosterior(prior, likelihoods);
}

module.exports = {
  calculatePosterior,
  bayesDiagnosis
};
