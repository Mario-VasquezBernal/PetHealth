function calculateLifestyleScore(lifestyle) {
  let score = 0;

  if (lifestyle.exercise === "low") score += 20;
  if (lifestyle.exercise === "medium") score += 10;

  if (lifestyle.diet === "poor") score += 25;
  if (lifestyle.diet === "average") score += 10;

  if (lifestyle.vetVisits === "never") score += 20;
  if (lifestyle.vetVisits === "sometimes") score += 10;

  return Math.min(score, 75);
}

function predictHealth(pet, lifestyle) {
  if (!pet) {
    throw new Error("Pet data missing");
  }

  const weight = Number(pet.weight || 0);
  const age = Number(pet.age || 0);

  // 1️⃣ Probabilidad obesidad
  let obesityProbability = 30;

  if (weight > 30) obesityProbability += 25;
  if (age > 7) obesityProbability += 15;

  obesityProbability = Math.min(obesityProbability, 95);

  // 2️⃣ Estilo de vida
  const lifestyleScore = calculateLifestyleScore(lifestyle);

  // 3️⃣ Bayes simplificado → diabetes en 2 años
  let diabetes2y = obesityProbability * 0.5 + lifestyleScore * 0.6;
  diabetes2y = Math.min(Math.round(diabetes2y), 95);

  // 4️⃣ Cadena de Markov simple
  const markovStates = [];

  let currentState = "healthy";
  if (obesityProbability > 60) currentState = "overweight";

  markovStates.push({ year: 0, state: currentState });

  for (let i = 1; i <= 2; i++) {
    if (currentState === "healthy" && obesityProbability > 50) {
      currentState = "overweight";
    } else if (currentState === "overweight" && diabetes2y > 50) {
      currentState = "diabetes";
    }

    markovStates.push({ year: i, state: currentState });
  }

  return {
    obesity: {
      probability: obesityProbability,
      severity:
        obesityProbability > 70 ? "high" :
        obesityProbability > 40 ? "medium" : "low"
    },
    diabetes_2y: {
      probability: diabetes2y,
      explanation: "Basado en obesidad + estilo de vida (modelo bayesiano simplificado)"
    },
    markov_projection: {
      states: markovStates
    },
    lifestyleScore
  };
}

module.exports = { predictHealth };
