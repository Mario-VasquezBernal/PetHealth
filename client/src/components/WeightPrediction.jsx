import { useState, useEffect } from 'react';
import { getMedicalRecords } from '../dataManager';
import { TrendingUp, TrendingDown, AlertTriangle, LineChart, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

const WeightPrediction = ({ petId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState([]);

  useEffect(() => {
    loadWeightHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const loadWeightHistory = async () => {
    try {
      setLoading(true);
      const data = await getMedicalRecords(petId);
      
      // Filtrar solo registros con peso
      const records = data.records || [];
      const weightsWithDates = records
        .filter(r => r.measured_weight && r.measured_weight > 0)
        .map(r => ({
          weight: parseFloat(r.measured_weight),
          date: new Date(r.visit_date)
        }))
        .sort((a, b) => a.date - b.date);

      setWeightHistory(weightsWithDates);

      // Si hay al menos 2 mediciones, calcular predicción
      if (weightsWithDates.length >= 2) {
        calculatePrediction(weightsWithDates);
      }
    } catch (error) {
      console.error('Error al cargar historial de peso:', error);
      toast.error('Error al cargar datos de peso');
    } finally {
      setLoading(false);
    }
  };

  // 📊 REGRESIÓN LINEAL POR MÍNIMOS CUADRADOS
  const calculatePrediction = (data) => {
    const n = data.length;
    
    // Convertir fechas a días desde la primera medición
    const firstDate = data[0].date.getTime();
    const points = data.map(item => ({
      x: (item.date.getTime() - firstDate) / (1000 * 60 * 60 * 24),
      y: item.weight
    }));

    // Calcular sumas para regresión lineal: y = mx + b
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumX2 += point.x * point.x;
    });

    // Calcular pendiente (m) e intercepto (b)
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Calcular desviación estándar
    const predictions = points.map(p => m * p.x + b);
    const errors = points.map((p, i) => p.y - predictions[i]);
    const variance = errors.reduce((sum, err) => sum + err * err, 0) / n;
    const stdDev = Math.sqrt(variance);

    // Días actuales desde la primera medición
    const today = new Date();
    const daysFromStart = (today.getTime() - firstDate) / (1000 * 60 * 60 * 24);

    // Predicciones futuras
    const predictions3m = m * (daysFromStart + 90) + b;
    const predictions6m = m * (daysFromStart + 180) + b;
    const predictions12m = m * (daysFromStart + 365) + b;

    // Tendencia
    const trend = m > 0.01 ? 'increasing' : m < -0.01 ? 'decreasing' : 'stable';
    const changePerMonth = m * 30;

    setPrediction({
      slope: m,
      intercept: b,
      stdDev: stdDev,
      trend: trend,
      changePerMonth: changePerMonth,
      predictions: {
        threeMonths: Math.max(0, predictions3m),
        sixMonths: Math.max(0, predictions6m),
        twelveMonths: Math.max(0, predictions12m)
      },
      confidence: {
        threeMonths: {
          lower: Math.max(0, predictions3m - stdDev),
          upper: predictions3m + stdDev
        },
        sixMonths: {
          lower: Math.max(0, predictions6m - stdDev),
          upper: predictions6m + stdDev
        },
        twelveMonths: {
          lower: Math.max(0, predictions12m - stdDev),
          upper: predictions12m + stdDev
        }
      }
    });
  };

  const getTrendIcon = () => {
    if (!prediction) return null;
    
    switch (prediction.trend) {
      case 'increasing':
        return <TrendingUp className="w-6 h-6 text-orange-600" />;
      case 'decreasing':
        return <TrendingDown className="w-6 h-6 text-blue-600" />;
      default:
        return <LineChart className="w-6 h-6 text-green-600" />;
    }
  };

  const getTrendText = () => {
    if (!prediction) return '';
    
    const change = Math.abs(prediction.changePerMonth).toFixed(2);
    switch (prediction.trend) {
      case 'increasing':
        return `Aumentando ~${change} kg/mes`;
      case 'decreasing':
        return `Disminuyendo ~${change} kg/mes`;
      default:
        return 'Peso estable';
    }
  };

  const getTrendColor = () => {
    if (!prediction) return 'gray';
    
    switch (prediction.trend) {
      case 'increasing':
        return 'orange';
      case 'decreasing':
        return 'blue';
      default:
        return 'green';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-primary-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-primary-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (weightHistory.length < 2) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <LineChart className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-bold text-primary-900">Predicción de Peso</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <p className="text-primary-600">
            Se necesitan al menos 2 registros de peso para realizar predicciones.
          </p>
          <p className="text-primary-500 text-sm mt-2">
            Los veterinarios pueden registrar el peso en cada consulta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LineChart className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-bold text-primary-900">Predicción de Peso (Regresión Lineal)</h3>
      </div>

      {/* Tendencia actual */}
      <div className={`bg-${getTrendColor()}-50 border-2 border-${getTrendColor()}-200 rounded-xl p-4 mb-6`}>
        <div className="flex items-center gap-3">
          {getTrendIcon()}
          <div>
            <p className={`font-bold text-${getTrendColor()}-900 text-lg`}>{getTrendText()}</p>
            <p className={`text-${getTrendColor()}-700 text-sm`}>
              Basado en {weightHistory.length} mediciones
            </p>
          </div>
        </div>
      </div>

      {/* Datos estadísticos */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          📊 Modelo Estadístico
        </h4>
        <div className="text-sm text-purple-800 space-y-1">
          <p>• <strong>Método:</strong> Regresión Lineal (Mínimos Cuadrados)</p>
          <p>• <strong>Ecuación:</strong> Peso = {prediction.slope.toFixed(4)} × días + {prediction.intercept.toFixed(2)}</p>
          <p>• <strong>Desviación estándar:</strong> ±{prediction.stdDev.toFixed(2)} kg</p>
          <p>• <strong>Muestras:</strong> {weightHistory.length} registros</p>
        </div>
      </div>

      {/* Predicciones */}
      <div className="space-y-4">
        <h4 className="font-bold text-primary-900 mb-3">Proyecciones Futuras</h4>

        {/* 3 meses */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">En 3 meses</span>
            </div>
            <span className="text-2xl font-bold text-blue-900">
              {prediction.predictions.threeMonths.toFixed(1)} kg
            </span>
          </div>
          <p className="text-xs text-blue-700">
            IC 95%: {prediction.confidence.threeMonths.lower.toFixed(1)} - {prediction.confidence.threeMonths.upper.toFixed(1)} kg
          </p>
        </div>

        {/* 6 meses */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">En 6 meses</span>
            </div>
            <span className="text-2xl font-bold text-purple-900">
              {prediction.predictions.sixMonths.toFixed(1)} kg
            </span>
          </div>
          <p className="text-xs text-purple-700">
            IC 95%: {prediction.confidence.sixMonths.lower.toFixed(1)} - {prediction.confidence.sixMonths.upper.toFixed(1)} kg
          </p>
        </div>

        {/* 12 meses */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-900">En 12 meses</span>
            </div>
            <span className="text-2xl font-bold text-orange-900">
              {prediction.predictions.twelveMonths.toFixed(1)} kg
            </span>
          </div>
          <p className="text-xs text-orange-700">
            IC 95%: {prediction.confidence.twelveMonths.lower.toFixed(1)} - {prediction.confidence.twelveMonths.upper.toFixed(1)} kg
          </p>
        </div>
      </div>

      {/* Advertencia */}
      <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
        <p className="text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Nota:</strong> Estas predicciones son estimaciones estadísticas basadas en datos históricos. 
            Consulta con tu veterinario para una evaluación profesional del peso ideal.
          </span>
        </p>
      </div>
    </div>
  );
};

export default WeightPrediction;
