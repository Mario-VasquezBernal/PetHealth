// ============================================
// Motor Bayesiano — P(H|E) = P(H) * ΠP(Ei|H) / norm
// ============================================

function calculatePosterior(prior, likelihoods) {
  if (!prior || prior <= 0) return 0;
  let numerator = prior;
  for (const l of likelihoods) {
    numerator *= l;
  }
  const denominator = numerator + (1 - prior);
  const posterior = numerator / denominator;
  return Math.min(0.99, Math.max(0.01, posterior));
}

// Obesidad/Diabetes
function bayesObesityRisk({ prior, evidence }) {
  const likelihoods = [];
  if (evidence.overweight)        likelihoods.push(0.72);
  if (evidence.oldAge)            likelihoods.push(0.58);
  if (evidence.rapidWeightGain)   likelihoods.push(0.80);
  if (evidence.neutered)          likelihoods.push(0.55);
  if (evidence.poorDiet)          likelihoods.push(0.65);
  if (evidence.lowExercise)       likelihoods.push(0.60);
  return calculatePosterior(prior, likelihoods);
}

// Enfermedad renal crónica (ERC) — especialmente gatos
function bayesRenalRisk({ prior, evidence }) {
  const likelihoods = [];
  if (evidence.isCat)             likelihoods.push(0.70);
  if (evidence.seniorAge)         likelihoods.push(0.65);
  if (evidence.weightLoss)        likelihoods.push(0.62);
  if (evidence.irregularVetVisit) likelihoods.push(0.55);
  return calculatePosterior(prior, likelihoods);
}

// Displasia de cadera — perros grandes
function bayesHipDysplasiaRisk({ prior, evidence }) {
  const likelihoods = [];
  if (evidence.largeDog)          likelihoods.push(0.68);
  if (evidence.adultAge)          likelihoods.push(0.55);
  if (evidence.overweight)        likelihoods.push(0.60);
  if (evidence.lowExercise)       likelihoods.push(0.50);
  return calculatePosterior(prior, likelihoods);
}

// Enfermedad cardíaca — razas braquicéfalas y seniors
function bayesCardiacRisk({ prior, evidence }) {
  const likelihoods = [];
  if (evidence.brachycephalic)    likelihoods.push(0.72);
  if (evidence.seniorAge)         likelihoods.push(0.60);
  if (evidence.overweight)        likelihoods.push(0.65);
  if (evidence.neutered)          likelihoods.push(0.50);
  return calculatePosterior(prior, likelihoods);
}

// Riesgo por vacunación vencida
function bayesVaccinationRisk({ prior, evidence }) {
  const likelihoods = [];
  if (evidence.overdueRabies)     likelihoods.push(0.85);
  if (evidence.overdueParvo)      likelihoods.push(0.80);
  if (evidence.overdueDistemper)  likelihoods.push(0.75);
  if (evidence.outdoorAccess)     likelihoods.push(0.60);
  return calculatePosterior(prior, likelihoods);
}

module.exports = {
  calculatePosterior,
  bayesObesityRisk,
  bayesRenalRisk,
  bayesHipDysplasiaRisk,
  bayesCardiacRisk,
  bayesVaccinationRisk
};
