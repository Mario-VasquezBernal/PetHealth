// ============================================
// Motor Cadenas de Markov con matrices reales
// Estados: [healthy, overweight, sick]
// ============================================

// Matrices de transición por especie + etapa de vida
const TRANSITION_MATRICES = {
  dog: {
    puppy: [
      [0.85, 0.12, 0.03],
      [0.25, 0.60, 0.15],
      [0.15, 0.30, 0.55]
    ],
    adult: [
      [0.75, 0.20, 0.05],
      [0.15, 0.55, 0.30],
      [0.10, 0.25, 0.65]
    ],
    senior: [
      [0.60, 0.25, 0.15],
      [0.10, 0.45, 0.45],
      [0.05, 0.15, 0.80]
    ]
  },
  cat: {
    puppy: [
      [0.88, 0.09, 0.03],
      [0.20, 0.65, 0.15],
      [0.12, 0.28, 0.60]
    ],
    adult: [
      [0.78, 0.15, 0.07],
      [0.12, 0.58, 0.30],
      [0.08, 0.20, 0.72]
    ],
    senior: [
      [0.55, 0.20, 0.25],
      [0.08, 0.42, 0.50],
      [0.04, 0.12, 0.84]
    ]
  },
  other: {
    puppy:  [[0.85, 0.10, 0.05],[0.20, 0.60, 0.20],[0.10, 0.25, 0.65]],
    adult:  [[0.75, 0.18, 0.07],[0.15, 0.55, 0.30],[0.08, 0.22, 0.70]],
    senior: [[0.60, 0.20, 0.20],[0.10, 0.45, 0.45],[0.05, 0.15, 0.80]]
  }
};

const STATE_LABELS = ['healthy', 'overweight', 'sick'];

function getLifeStage(age, species) {
  if (species === 'cat') {
    if (age < 2) return 'puppy';
    if (age < 10) return 'adult';
    return 'senior';
  }
  // dog y other
  if (age < 2) return 'puppy';
  if (age < 7) return 'adult';
  return 'senior';
}

function multiplyVectorMatrix(vector, matrix) {
  const result = new Array(vector.length).fill(0);
  for (let j = 0; j < matrix.length; j++) {
    for (let i = 0; i < vector.length; i++) {
      result[j] += vector[i] * matrix[i][j];
    }
  }
  return result;
}

function normalize(vector) {
  const sum = vector.reduce((a, b) => a + b, 0);
  return sum === 0 ? vector : vector.map(v => v / sum);
}

function nextState(stateVector, transitionMatrix) {
  return normalize(multiplyVectorMatrix(stateVector, transitionMatrix));
}

/**
 * Proyecta el estado de salud a N años.
 * @param {number[]} initialVector - ej: [0.8, 0.15, 0.05] (healthy, overweight, sick)
 * @param {string} species - 'dog' | 'cat' | 'other'
 * @param {number} age - edad actual en años
 * @param {number} years - cuántos años proyectar
 * @returns {Array} - proyección año a año con distribución probabilística
 */
function predictMarkov(initialVector, species, age, years = 3) {
  const stage = getLifeStage(age, species);
  const matrix = (TRANSITION_MATRICES[species] || TRANSITION_MATRICES.other)[stage];

  const projection = [
    {
      year: 0,
      distribution: {
        healthy: +initialVector[0].toFixed(3),
        overweight: +initialVector[1].toFixed(3),
        sick: +initialVector[2].toFixed(3)
      },
      dominantState: STATE_LABELS[initialVector.indexOf(Math.max(...initialVector))]
    }
  ];

  let current = initialVector;
  for (let i = 1; i <= years; i++) {
    current = nextState(current, matrix);
    projection.push({
      year: i,
      distribution: {
        healthy: +current[0].toFixed(3),
        overweight: +current[1].toFixed(3),
        sick: +current[2].toFixed(3)
      },
      dominantState: STATE_LABELS[current.indexOf(Math.max(...current))]
    });
  }

  return { lifeStage: stage, projection };
}

module.exports = {
  predictMarkov,
  nextState,
  getLifeStage
};
