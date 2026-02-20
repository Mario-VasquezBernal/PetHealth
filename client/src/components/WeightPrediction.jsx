import { useState, useEffect } from 'react';
import { getMedicalRecords } from '../dataManager';
import { TrendingUp, TrendingDown, AlertTriangle, LineChart, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { normalizeSpecies, getSpeciesProfile } from '../speciesProfiles';

// Este componente puede usarse standalone (sin pasar prediction)
// o recibir `prediction` ya calculado desde HealthAIPredictor
const WeightPrediction = ({ petId, pet, prediction: externalPrediction }) => {
  const [prediction, setPrediction]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [weightHistory, setWeightHistory] = useState([]);

  const normalizedSpecies = pet ? normalizeSpecies(pet) : 'other';
  const profile           = getSpeciesProfile(normalizedSpecies);

  useEffect(() => {
    // Si ya viene prediction del padre (HealthAIPredictor), úsala directamente
    if (externalPrediction) {
      setPrediction(externalPrediction);
      setLoading(false);
      return;
    }
    loadWeightHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId, externalPrediction]);

  const loadWeightHistory = async () => {
    try {
      setLoading(true);
      if (!profile.supportsWeightModel) {
        setWeightHistory([]);
        setPrediction(null);
        setLoading(false);
        return;
      }
      const data    = await getMedicalRecords(petId);
      const records = data.records || [];
      const weightsWithDates = records
        .filter(r => r.measured_weight && r.measured_weight > 0)
        .map(r => ({ weight: parseFloat(r.measured_weight), date: new Date(r.visit_date) }))
        .sort((a, b) => a.date - b.date);

      setWeightHistory(weightsWithDates);
      if (weightsWithDates.length >= 2) {
        calculateLocalPrediction(weightsWithDates);
      } else {
        setPrediction(null);
      }
    } catch (error) {
      console.error('Error al cargar historial de peso:', error);
      toast.error('Error al cargar datos de peso');
    } finally {
      setLoading(false);
    }
  };

  // Fallback: regresión local (igual que antes) si no hay prediction del backend
  const calculateLocalPrediction = (data) => {
    const n          = data.length;
    const firstDate  = data[0].date.getTime();
    const points     = data.map(item => ({
      x: (item.date.getTime() - firstDate) / (1000 * 60 * 60 * 24),
      y: item.weight
    }));
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x; });
    const m   = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b   = (sumY - m * sumX) / n;
    const preds    = points.map(p => m * p.x + b);
    const errors   = points.map((p, i) => p.y - preds[i]);
    const variance = errors.reduce((s, e) => s + e * e, 0) / n;
    const stdDev   = Math.sqrt(variance);
    const today    = new Date();
    const daysFromStart = (today.getTime() - firstDate) / (1000 * 60 * 60 * 24);

    const proj3m  = m * (daysFromStart + 90)  + b;
    const proj6m  = m * (daysFromStart + 180) + b;
    const proj12m = m * (daysFromStart + 365) + b;
    const trend   = m > 0.01 ? 'gaining' : m < -0.01 ? 'losing' : 'stable';

    // Alerta de velocidad: >10% del peso actual en 30 días
    const lastWeight      = data[data.length - 1].weight;
    const kgPerMonth      = m * 30;
    const changePercent   = lastWeight > 0 ? Math.abs(kgPerMonth / lastWeight) * 100 : 0;
    const rapidChangeAlert = changePercent > 10
      ? {
          active: true,
          message: `Cambio de ${kgPerMonth > 0 ? '+' : ''}${kgPerMonth.toFixed(2)} kg/mes (${changePercent.toFixed(1)}% del peso actual). Consulta veterinaria recomendada.`,
          severity: changePercent > 20 ? 'critical' : 'warning'
        }
      : { active: false };

    setPrediction({
      available: true,
      trend,
      kgPerMonth: +kgPerMonth.toFixed(3),
      dataPoints: n,
      anomaliesRemoved: 0,
      confidenceLevel: '95%',
      rapidChangeAlert,
      projections: {
        days30: { predicted: +Math.max(0, m * (daysFromStart + 30)  + b).toFixed(2), low: +Math.max(0, m * (daysFromStart + 30)  + b - 1.96 * stdDev).toFixed(2), high: +(m * (daysFromStart + 30)  + b + 1.96 * stdDev).toFixed(2) },
        days60: { predicted: +Math.max(0, proj3m - (proj3m - (m * (daysFromStart + 30) + b))).toFixed(2), low: +Math.max(0, proj3m - 1.96 * stdDev).toFixed(2), high: +(proj3m  + 1.96 * stdDev).toFixed(2) },
        days90: { predicted: +Math.max(0, proj3m).toFixed(2),  low: +Math.max(0, proj3m  - 1.96 * stdDev).toFixed(2), high: +(proj3m  + 1.96 * stdDev).toFixed(2) }
      },
      // campos extra para compatibilidad con el display antiguo
      slope: m, intercept: b, stdDev,
      predictions: {
        threeMonths:  Math.max(0, proj3m),
        sixMonths:    Math.max(0, proj6m),
        twelveMonths: Math.max(0, proj12m)
      },
      confidence: {
        threeMonths:  { lower: Math.max(0, proj3m  - stdDev), upper: proj3m  + stdDev },
        sixMonths:    { lower: Math.max(0, proj6m  - stdDev), upper: proj6m  + stdDev },
        twelveMonths: { lower: Math.max(0, proj12m - stdDev), upper: proj12m + stdDev }
      }
    });
  };

  const getTrendIcon = () => {
    if (!prediction) return null;
    if (prediction.trend === 'gaining' || prediction.trend === 'increasing')
      return <TrendingUp className="w-6 h-6 text-orange-600" />;
    if (prediction.trend === 'losing' || prediction.trend === 'decreasing')
      return <TrendingDown className="w-6 h-6 text-blue-600" />;
    return <LineChart className="w-6 h-6 text-green-600" />;
  };

  const getTrendText = () => {
    if (!prediction) return '';
    const change = Math.abs(prediction.kgPerMonth ?? prediction.changePerMonth ?? 0).toFixed(2);
    if (prediction.trend === 'gaining' || prediction.trend === 'increasing') return `Aumentando ~${change} kg/mes`;
    if (prediction.trend === 'losing'  || prediction.trend === 'decreasing') return `Disminuyendo ~${change} kg/mes`;
    return 'Peso estable';
  };

  const getTrendColor = () => {
    if (!prediction) return 'gray';
    if (prediction.trend === 'gaining' || prediction.trend === 'increasing') return 'orange';
    if (prediction.trend === 'losing'  || prediction.trend === 'decreasing') return 'blue';
    return 'green';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-primary-200 rounded w-1/3 mb-4" />
          <div className="h-20 bg-primary-100 rounded" />
        </div>
      </div>
    );
  }

  if (!profile.supportsWeightModel) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <LineChart className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-bold text-primary-900">Predicción de Peso</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p className="text-primary-600">La predicción de peso no está disponible para esta especie.</p>
        </div>
      </div>
    );
  }

  const dataCount = externalPrediction ? externalPrediction.dataPoints : weightHistory.length;
  if (!prediction || prediction.available === false || dataCount < 2) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <LineChart className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-bold text-primary-900">Predicción de Peso</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <p className="text-primary-600">
            {prediction?.reason || 'Se necesitan al menos 2 registros de peso para realizar predicciones.'}
          </p>
          <p className="text-primary-500 text-sm mt-2">
            Los veterinarios pueden registrar el peso en cada consulta.
          </p>
        </div>
      </div>
    );
  }

  const trendColor = getTrendColor();

  // Proyecciones — soporta tanto la forma nueva (days30/60/90) como la antigua (threeMonths/etc.)
  const p3m  = prediction.projections?.days90  || { predicted: prediction.predictions?.threeMonths,  low: prediction.confidence?.threeMonths?.lower,  high: prediction.confidence?.threeMonths?.upper };
  const p6m  = prediction.projections?.days60  || { predicted: prediction.predictions?.sixMonths,    low: prediction.confidence?.sixMonths?.lower,    high: prediction.confidence?.sixMonths?.upper };
  const p12m = prediction.projections?.days30  || { predicted: prediction.predictions?.twelveMonths, low: prediction.confidence?.twelveMonths?.lower,  high: prediction.confidence?.twelveMonths?.upper };

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LineChart className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-bold text-primary-900">Predicción de Peso (Regresión Lineal)</h3>
      </div>

      {/* Alerta de velocidad */}
      {prediction.rapidChangeAlert?.active && (
        <div className={`rounded-xl p-3 mb-4 flex items-start gap-2 ${
          prediction.rapidChangeAlert.severity === 'critical'
            ? 'bg-red-100 border-2 border-red-400'
            : 'bg-amber-100 border-2 border-amber-400'
        }`}>
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">{prediction.rapidChangeAlert.message}</p>
        </div>
      )}

      {/* Tendencia */}
      <div className={`bg-${trendColor}-50 border-2 border-${trendColor}-200 rounded-xl p-4 mb-6`}>
        <div className="flex items-center gap-3">
          {getTrendIcon()}
          <div>
            <p className={`font-bold text-${trendColor}-900 text-lg`}>{getTrendText()}</p>
            <p className={`text-${trendColor}-700 text-sm`}>
              Basado en {prediction.dataPoints || dataCount} mediciones
              {prediction.anomaliesRemoved > 0 && ` · ${prediction.anomaliesRemoved} anomalía(s) excluida(s)`}
            </p>
          </div>
        </div>
      </div>

      {/* Modelo estadístico */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-purple-900 mb-2">📊 Modelo Estadístico</h4>
        <div className="text-sm text-purple-800 space-y-1">
          <p>• <strong>Método:</strong> Regresión Lineal (Mínimos Cuadrados)</p>
          {prediction.slope != null && (
            <p>• <strong>Ecuación:</strong> Peso = {prediction.slope.toFixed(4)} × días + {prediction.intercept?.toFixed(2)}</p>
          )}
          {prediction.stdDev != null && (
            <p>• <strong>Desviación estándar:</strong> ±{prediction.stdDev.toFixed(2)} kg</p>
          )}
          <p>• <strong>Confianza:</strong> {prediction.confidenceLevel}</p>
          <p>• <strong>Muestras:</strong> {prediction.dataPoints || dataCount} registros</p>
        </div>
      </div>

      {/* Proyecciones */}
      <div className="space-y-4">
        <h4 className="font-bold text-primary-900 mb-3">Proyecciones Futuras</h4>
        {[
          { label: 'En 3 meses',  data: p3m,  color: 'blue' },
          { label: 'En 6 meses',  data: p6m,  color: 'purple' },
          { label: 'En 12 meses', data: p12m, color: 'orange' }
        ].map(({ label, data, color }) => data?.predicted != null && (
          <div key={label} className={`bg-gradient-to-r from-${color}-50 to-${color}-100 rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className={`w-5 h-5 text-${color}-600`} />
                <span className={`font-semibold text-${color}-900`}>{label}</span>
              </div>
              <span className={`text-2xl font-bold text-${color}-900`}>
                {(+data.predicted).toFixed(1)} kg
              </span>
            </div>
            <p className={`text-xs text-${color}-700`}>
              IC {prediction.confidenceLevel}: {(+data.low).toFixed(1)} – {(+data.high).toFixed(1)} kg
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
        <p className="text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Nota:</strong> Predicciones estadísticas basadas en datos históricos.
            Consulta con tu veterinario para evaluación profesional del peso ideal.
          </span>
        </p>
      </div>
    </div>
  );
};

export default WeightPrediction;
