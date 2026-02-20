import { useState } from 'react';
import axios from 'axios';
import { normalizeSpecies, getSpeciesProfile } from '../speciesProfiles';
import {
  AlertTriangle, Heart, Activity, Shield,
  TrendingUp, TrendingDown, LineChart, Clock, Syringe
} from 'lucide-react';

const severityConfig = {
  high:   { bg: 'bg-red-100',    border: 'border-red-400',    text: 'text-red-800',    badge: 'bg-red-500',    label: 'Alto' },
  medium: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', badge: 'bg-orange-500', label: 'Moderado' },
  low:    { bg: 'bg-green-100',  border: 'border-green-400',  text: 'text-green-800',  badge: 'bg-green-500',  label: 'Bajo' }
};

// Barra de probabilidad animada
const ProbBar = ({ value, color = 'indigo' }) => (
  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
    <div
      className={`bg-${color}-500 h-3 rounded-full transition-all duration-700`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

// Chip de riesgo con semáforo
const RiskChip = ({ label, probability, severity, icon: Icon }) => {
  const cfg = severityConfig[severity] || severityConfig.low;
  const barColor = severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green';
  return (
    <div className={`${cfg.bg} ${cfg.border} border-2 rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${cfg.text}`} />}
          <span className={`font-semibold ${cfg.text} text-sm`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${cfg.text}`}>{probability}%</span>
          <span className={`${cfg.badge} text-white text-xs px-2 py-1 rounded-full`}>{cfg.label}</span>
        </div>
      </div>
      <ProbBar value={probability} color={barColor} />
    </div>
  );
};

const HealthAIPredictor = ({ petId, pet }) => {
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('risks');
  const [lifestyle, setLifestyle] = useState({
    exercise: 'medium',
    diet: 'average',
    vetVisits: 'sometimes'
  });

  const normalizedSpecies = pet ? normalizeSpecies(pet) : 'other';
  const speciesProfile    = getSpeciesProfile(normalizedSpecies);

  const predict = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/health-prediction`,
        { pet_id: petId, species: normalizedSpecies, lifestyle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.prediction);
      setActiveTab('risks');
    } catch (err) {
      console.error(err);
      alert('Error generando predicción IA');
    }
    setLoading(false);
  };

  const urgencyColors = {
    critical: 'bg-red-600',
    high:     'bg-orange-500',
    medium:   'bg-yellow-500',
    low:      'bg-green-500'
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="text-xl font-bold text-primary-900">
            Predicción IA de Salud — {speciesProfile.label}
          </h3>
          <p className="text-xs text-gray-500">Motor bayesiano + Markov + Regresión lineal</p>
        </div>
      </div>

      {/* Controles de estilo de vida */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Ejercicio</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={lifestyle.exercise}
            onChange={e => setLifestyle({ ...lifestyle, exercise: e.target.value })}
          >
            <option value="low">Bajo</option>
            <option value="medium">Medio</option>
            <option value="high">Alto</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Dieta</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={lifestyle.diet}
            onChange={e => setLifestyle({ ...lifestyle, diet: e.target.value })}
          >
            <option value="poor">Mala</option>
            <option value="average">Normal</option>
            <option value="good">Buena</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Visitas al vet</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={lifestyle.vetVisits}
            onChange={e => setLifestyle({ ...lifestyle, vetVisits: e.target.value })}
          >
            <option value="never">Nunca</option>
            <option value="sometimes">A veces</option>
            <option value="regular">Regular</option>
          </select>
        </div>
      </div>

      <button
        onClick={predict}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
      >
        {loading ? '⏳ Calculando predicción...' : '🔬 Generar Predicción IA'}
      </button>

      {/* Resultados */}
      {result && (
        <div className="space-y-4">

          {/* Score de urgencia */}
          <div className={`${urgencyColors[result.consultUrgency?.level] || 'bg-gray-400'} text-white rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-lg">Score de Urgencia</span>
              </div>
              <span className="text-3xl font-bold">{result.consultUrgency?.score}/100</span>
            </div>
            <p className="text-sm mt-1 opacity-90">{result.consultUrgency?.message}</p>
            {result.consultUrgency?.daysToVisit && (
              <p className="text-xs mt-1 opacity-80">
                📅 Consulta recomendada en los próximos {result.consultUrgency.daysToVisit} días
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { id: 'risks',  label: '🧬 Riesgos' },
              { id: 'weight', label: '⚖️ Peso' },
              { id: 'markov', label: '📈 Proyección' },
              { id: 'vaccines', label: '💉 Vacunas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Riesgos */}
          {activeTab === 'risks' && (
            <div className="space-y-3">
              <RiskChip
                label="Obesidad"
                probability={result.obesity?.probability ?? 0}
                severity={result.obesity?.severity ?? 'low'}
                icon={TrendingUp}
              />
              <RiskChip
                label="Riesgo Renal"
                probability={result.renalRisk?.probability ?? 0}
                severity={result.renalRisk?.severity ?? 'low'}
                icon={Activity}
              />
              <RiskChip
                label="Displasia de Cadera"
                probability={result.hipDysplasiaRisk?.probability ?? 0}
                severity={result.hipDysplasiaRisk?.severity ?? 'low'}
                icon={AlertTriangle}
              />
              <RiskChip
                label="Riesgo Cardíaco"
                probability={result.cardiacRisk?.probability ?? 0}
                severity={result.cardiacRisk?.severity ?? 'low'}
                icon={Heart}
              />
              <RiskChip
                label="Diabetes (2 años)"
                probability={result.diabetes_2y?.probability ?? 0}
                severity={
                  (result.diabetes_2y?.probability ?? 0) > 60 ? 'high' :
                  (result.diabetes_2y?.probability ?? 0) > 35 ? 'medium' : 'low'
                }
                icon={AlertTriangle}
              />

              {/* Patrones crónicos de síntomas */}
              {result.symptomPatterns?.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <p className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Patrones Crónicos Detectados
                  </p>
                  {result.symptomPatterns.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-purple-100 last:border-0">
                      <span className="text-sm text-purple-800 capitalize">{p.system}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">{p.consultCount} consultas</span>
                        <span className="font-bold text-purple-900">{Math.round(p.chronicityRisk * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Peso */}
          {activeTab === 'weight' && (
            <div className="space-y-3">
              {result.weightPrediction?.available ? (
                <>
                  {/* Alerta de velocidad */}
                  {result.weightPrediction.rapidChangeAlert?.active && (
                    <div className={`rounded-xl p-4 flex items-start gap-3 ${
                      result.weightPrediction.rapidChangeAlert.severity === 'critical'
                        ? 'bg-red-100 border-2 border-red-400'
                        : 'bg-amber-100 border-2 border-amber-400'
                    }`}>
                      <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900 font-medium">
                        {result.weightPrediction.rapidChangeAlert.message}
                      </p>
                    </div>
                  )}

                  {/* Tendencia */}
                  <div className={`rounded-xl p-4 flex items-center gap-3 ${
                    result.weightPrediction.trend === 'gaining'
                      ? 'bg-orange-50 border-2 border-orange-300'
                      : result.weightPrediction.trend === 'losing'
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-green-50 border-2 border-green-300'
                  }`}>
                    {result.weightPrediction.trend === 'gaining'
                      ? <TrendingUp className="w-6 h-6 text-orange-600" />
                      : result.weightPrediction.trend === 'losing'
                        ? <TrendingDown className="w-6 h-6 text-blue-600" />
                        : <LineChart className="w-6 h-6 text-green-600" />}
                    <div>
                      <p className="font-bold text-gray-900">
                        {result.weightPrediction.trend === 'gaining'
                          ? `Aumentando ${result.weightPrediction.kgPerMonth > 0 ? '+' : ''}${result.weightPrediction.kgPerMonth} kg/mes`
                          : result.weightPrediction.trend === 'losing'
                            ? `Disminuyendo ${result.weightPrediction.kgPerMonth} kg/mes`
                            : 'Peso estable'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Basado en {result.weightPrediction.dataPoints} registros
                        {result.weightPrediction.anomaliesRemoved > 0 &&
                          ` · ${result.weightPrediction.anomaliesRemoved} anomalía(s) excluida(s)`}
                      </p>
                    </div>
                  </div>

                  {/* Proyecciones */}
                  {[
                    { label: 'En 30 días',  data: result.weightPrediction.projections?.days30,  color: 'blue' },
                    { label: 'En 60 días',  data: result.weightPrediction.projections?.days60,  color: 'purple' },
                    { label: 'En 90 días',  data: result.weightPrediction.projections?.days90,  color: 'orange' }
                  ].map(({ label, data, color }) => data && (
                    <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-${color}-900`}>{label}</span>
                        <span className={`text-2xl font-bold text-${color}-900`}>
                          {data.predicted} kg
                        </span>
                      </div>
                      <p className={`text-xs text-${color}-700 mt-1`}>
                        IC {result.weightPrediction.confidenceLevel}: {data.low} – {data.high} kg
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {result.weightPrediction?.reason || 'Sin datos suficientes de peso'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    El veterinario debe registrar el peso en cada consulta
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Proyección Markov */}
          {activeTab === 'markov' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-blue-800">
                  <strong>Cadena de Markov:</strong> Distribución probabilística del estado de salud proyectado a 3 años.
                  Etapa de vida: <strong>{result.markov_projection?.lifeStage}</strong>
                </p>
              </div>
              {result.markov_projection?.projection?.map((step) => (
                <div key={step.year} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-3">
                    {step.year === 0 ? 'Estado actual' : `Año ${step.year}`}
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      → Estado dominante: <span className="font-semibold text-indigo-700">{step.dominantState}</span>
                    </span>
                  </p>
                  <div className="space-y-2">
                    {[
                      { key: 'healthy',    label: 'Saludable',   color: 'green' },
                      { key: 'overweight', label: 'Sobrepeso',   color: 'orange' },
                      { key: 'sick',       label: 'Enfermo',     color: 'red' }
                    ].map(({ key, label, color }) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{label}</span>
                          <span className="font-bold">{Math.round((step.distribution[key] || 0) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${color}-500 h-2 rounded-full transition-all duration-700`}
                            style={{ width: `${Math.round((step.distribution[key] || 0) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Vacunas */}
          {activeTab === 'vaccines' && (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 ${
                result.vaccinationRisk?.hasOverdueVaccines
                  ? 'bg-red-50 border-2 border-red-300'
                  : 'bg-green-50 border-2 border-green-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Syringe className={`w-5 h-5 ${result.vaccinationRisk?.hasOverdueVaccines ? 'text-red-600' : 'text-green-600'}`} />
                    <span className={`font-bold ${result.vaccinationRisk?.hasOverdueVaccines ? 'text-red-900' : 'text-green-900'}`}>
                      Riesgo por Vacunación
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${result.vaccinationRisk?.hasOverdueVaccines ? 'text-red-900' : 'text-green-900'}`}>
                    {result.vaccinationRisk?.probability ?? 0}%
                  </span>
                </div>
                <ProbBar
                  value={result.vaccinationRisk?.probability ?? 0}
                  color={result.vaccinationRisk?.hasOverdueVaccines ? 'red' : 'green'}
                />
              </div>

              {result.vaccinationRisk?.hasOverdueVaccines ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-900 mb-2">⚠️ Vacunas vencidas detectadas:</p>
                  <ul className="space-y-1">
                    {result.vaccinationRisk.criticalVaccines.map((v, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Shield className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Vacunas al día ✓</p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
            <p className="text-xs text-gray-600">
              <strong>Importante:</strong> Este análisis es una herramienta estadística orientativa basada en Teorema de Bayes,
              Cadenas de Markov y Regresión Lineal. No reemplaza el diagnóstico de un veterinario.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthAIPredictor;
