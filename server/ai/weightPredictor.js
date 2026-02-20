// ============================================
// Motor de Predicción de Peso
// Regresión lineal ponderada sobre historial
// ============================================

/**
 * Regresión lineal simple sobre puntos (x, y).
 * Retorna { slope, intercept }
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;

  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = (n * sumX2 - sumX * sumX);
  if (denom === 0) return null;

  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Calcula el error estándar de la regresión para el intervalo de confianza.
 */
function standardError(points, slope, intercept) {
  const n = points.length;
  if (n < 3) return null;
  const residuals = points.map(p => Math.pow(p.y - (slope * p.x + intercept), 2));
  const sse = residuals.reduce((a, b) => a + b, 0);
  return Math.sqrt(sse / (n - 2));
}

/**
 * Detecta anomalías en los registros de peso (errores de digitación).
 * Retorna solo los puntos válidos.
 */
function filterAnomalies(points) {
  if (points.length < 3) return points;
  const weights = points.map(p => p.y);
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
  const std  = Math.sqrt(weights.reduce((s, w) => s + Math.pow(w - mean, 2), 0) / weights.length);
  // Excluir puntos a más de 2.5 desviaciones estándar
  const filtered = points.filter(p => Math.abs(p.y - mean) <= 2.5 * std);
  return filtered.length >= 2 ? filtered : points;
}

/**
 * Predicción principal de peso.
 * @param {Array} weightHistory - [{ date: '2024-01-01', weight: 8.2 }, ...]
 * @param {number} currentWeight - peso actual
 * @returns {Object} predicción completa
 */
function predictWeight(weightHistory, currentWeight) {
  if (!weightHistory || weightHistory.length === 0) {
    return {
      available: false,
      reason: 'Sin historial de pesos registrado',
      currentWeight
    };
  }

  // Convertir fechas a días desde el primer registro
  const sorted = [...weightHistory]
    .filter(r => r.weight != null && !isNaN(r.weight))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length < 2) {
    return {
      available: false,
      reason: 'Se necesitan al menos 2 registros de peso',
      currentWeight
    };
  }

  const t0 = new Date(sorted[0].date).getTime();
  const points = sorted.map(r => ({
    x: (new Date(r.date).getTime() - t0) / (1000 * 60 * 60 * 24), // días
    y: Number(r.weight)
  }));

  const clean = filterAnomalies(points);
  const anomaliesRemoved = points.length - clean.length;

  const reg = linearRegression(clean);
  if (!reg) {
    return { available: false, reason: 'No se pudo calcular regresión', currentWeight };
  }

  const { slope, intercept } = reg;
  const se = standardError(clean, slope, intercept) || 0;
  const Z  = 1.96; // 95% confianza

  // Último día conocido
  const lastX = clean[clean.length - 1].x;

  function project(daysAhead) {
    const x    = lastX + daysAhead;
    const pred = +(slope * x + intercept).toFixed(2);
    return {
      predicted: Math.max(0.1, pred),
      low:  Math.max(0.1, +(pred - Z * se).toFixed(2)),
      high: +(pred + Z * se).toFixed(2)
    };
  }

  const kgPerMonth  = +(slope * 30).toFixed(3);
  const kgPerDay    = +slope.toFixed(4);

  // Alerta de velocidad de cambio (>10% en 30 días)
  const changePercent = currentWeight > 0
    ? Math.abs(kgPerMonth / currentWeight) * 100
    : 0;

  const rapidChangeAlert = changePercent > 10
    ? {
        active: true,
        message: `Cambio de ${kgPerMonth > 0 ? '+' : ''}${kgPerMonth} kg/mes (${changePercent.toFixed(1)}% del peso actual). Consulta veterinaria recomendada.`,
        severity: changePercent > 20 ? 'critical' : 'warning'
      }
    : { active: false };

  const trend =
    Math.abs(kgPerMonth) < 0.05 ? 'stable' :
    kgPerMonth > 0 ? 'gaining' : 'losing';

  return {
    available: true,
    currentWeight,
    trend,
    kgPerMonth,
    kgPerDay,
    projections: {
      days30:  project(30),
      days60:  project(60),
      days90:  project(90)
    },
    confidenceLevel: '95%',
    dataPoints: clean.length,
    anomaliesRemoved,
    rapidChangeAlert
  };
}

module.exports = { predictWeight };
