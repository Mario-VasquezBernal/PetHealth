// ============================================
// Motor de Cadenas de Markov
// ============================================

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
  return vector.map(v => v / sum);
}

function nextState(stateVector, transitionMatrix) {
  const next = multiplyVectorMatrix(stateVector, transitionMatrix);
  return normalize(next);
}

function predict(initialState, matrix, steps) {
  let current = initialState;

  for (let i = 0; i < steps; i++) {
    current = nextState(current, matrix);
  }

  return current;
}

module.exports = {
  nextState,
  predict
};
