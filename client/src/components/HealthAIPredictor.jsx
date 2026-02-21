import { useState, useEffect } from 'react';
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

const ProbBar = ({ value, color = 'indigo' }) => (
  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
    <div
      className={`bg-${color}-500 h-3 rounded-full transition-all duration-700`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

const RiskChip = ({ label, probability, severity, icon: Icon }) => {
  const cfg      = severityConfig[severity] || severityConfig.low;
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
  const [result, setResult]                   = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [activeTab, setActiveTab]             = useState('risks');
  const [lifestyle, setLifestyle]             = useState({
    exercise: 'medium',
    diet: 'average',
    vetVisits: 'sometimes'
  });
  const [vaccines, setVaccines]               = useState([]);
  const [vaccinesLoading, setVaccinesLoading] = useState(false);
  const [vaccinesError, setVaccinesError]     = useState(null);

  const API_URL           = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const normalizedSpecies = pet ? normalizeSpecies(pet) : 'other';
  const speciesProfile    = getSpeciesProfile(normalizedSpecies);
  const now               = new Date();

  // ── Cargar vacunas reales del pet
  useEffect(() => {
    const fetchVaccines = async () => {
      if (!petId) return;
      setVaccinesLoading(true);
      setVaccinesError(null);
      try {
        const token = localStorage.getItem('token');
        const res   = await axios.get(`${API_URL}/ai/pet/${petId}/vaccines`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVaccines(res.data.vaccines || []);
      } catch (err) {
        console.error('Error cargando vacunas', err);
        setVaccinesError('No se pudo cargar el calendario de vacunas.');
      } finally {
        setVaccinesLoading(false);
      }
    };
    fetchVaccines();
  }, [API_URL, petId]);

  // ── Parsear vacunas con lógica correcta
  const parsedVaccines = vaccines.map(v => {
    const next     = v.next_due_date || v.next_date;
    const last     = v.applied_date  || v.last_dose_date || v.last_date;
    const nextDate = next ? new Date(next) : null;
    const lastDate = last ? new Date(last) : null;

    // Solo es "vencida" si fue aplicada alguna vez Y ya pasó la próxima dosis
    const isOverdue    = !!(lastDate && nextDate && nextDate < now);
    // Nunca aplicada: no tiene applied_date pero la fecha programada ya pasó
    const neverApplied = !lastDate && nextDate && nextDate < now;

    return {
      id: v.id,
      name: v.vaccine_name || v.name,
      lastDate,
      nextDate,
      isOverdue,
      neverApplied
    };
  });

  const overdueVaccines  = parsedVaccines.filter(v => v.isOverdue);
  const neverAppliedList = parsedVaccines.filter(v => v.neverApplied);

  // 🔴 ELIMINADO: upcomingVaccines sin uso para evitar no-unused-vars
  // const upcomingVaccines = parsedVaccines
  //   .filter(v => v.nextDate && !v.isOverdue && !v.neverApplied)
  //   .sort((a, b) => a.nextDate - b.nextDate);

  const hasIssues = overdueVaccines.length > 0 || neverAppliedList.length > 0;

  // Riesgo por vacunación usando vencidas + nunca aplicadas
  const vaccinationProbability = (() => {
    if (parsedVaccines.length === 0) return 0;
    const ratio = (overdueVaccines.length + neverAppliedList.length) / parsedVaccines.length;
    return Math.round(30 + 70 * ratio);
  })();

  const predict = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.post(
        `${API_URL}/ai/health-prediction`,
        {
          pet_id:    petId,
          species:   normalizedSpecies,
          lifestyle,
          vaccines:  vaccines.map(v => ({
            id:        v.id,
            name:      v.vaccine_name || v.name,
            last_date: v.applied_date || v.last_date,
            next_date: v.next_due_date || v.next_date
          }))
        },
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
              { id: 'risks',    label: '🧬 Riesgos' },
              { id: 'weight',   label: '⚖️ Peso' },
              { id: 'markov',   label: '📈 Proyección' },
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
              {result.symptomPatterns?.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <p className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Patrones Crónicos Detectados
                  </p>
                  {result.symptomPatterns.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 border-b border-purple-100 last:border-0"
                    >
                      <span className="text-sm text-purple-800 capitalize">{p.system}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">{p.consultCount} consultas</span>
                        <span className="font-bold text-purple-900">
                          {Math.round(p.chronicityRisk * 100)}%
                        </span>
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
                  {result.weightPrediction.rapidChangeAlert?.active && (
                    <div
                      className={`rounded-xl p-4 flex items-start gap-3 ${
                        result.weightPrediction.rapidChangeAlert.severity === 'critical'
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-orange-100 border border-orange-300'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-red-800">
                          Cambio de peso acelerado detectado
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {result.weightPrediction.rapidChangeAlert.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-blue-900 text-sm">Proyección de peso (12 meses)</p>
                    </div>
                    <p className="text-xs text-blue-800 mb-2">
                      Peso actual estimado:{' '}
                      <span className="font-semibold">
                        {result.weightPrediction.currentWeightKg} kg
                      </span>
                    </p>
                    <p className="text-xs text-blue-800 mb-3">
                      Peso proyectado a 12 meses:{' '}
                      <span className="font-semibold">
                        {result.weightPrediction.projectedWeightKg} kg
                      </span>{' '}
                      ({result.weightPrediction.trendLabel})
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-blue-700">
                      <LineChart className="w-3 h-3" />
                      <span>{result.weightPrediction.comment}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500">
                  No hay suficientes datos de peso histórico para generar una proyección.
                </div>
              )}
            </div>
          )}

          {/* Tab: Proyección Markov */}
          {activeTab === 'markov' && (
            <div className="space-y-3">
              {result.markovProjection?.states?.length ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart className="w-4 h-4 text-indigo-700" />
                    <p className="font-semibold text-indigo-900 text-sm">
                      Proyección de estados de salud (Markov)
                    </p>
                  </div>
                  <p className="text-[11px] text-indigo-800 mb-3">
                    Estados simulados a 24 meses, usando cadenas de Markov discretas con la
                    historia clínica registrada.
                  </p>
                  <ul className="space-y-1">
                    {result.markovProjection.states.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-[11px] text-indigo-900"
                      >
                        <span className="capitalize">{s.label}</span>
                        <span className="font-semibold">{Math.round(s.probability * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  No hay suficientes datos para una proyección Markov fiable.
                </p>
              )}
            </div>
          )}

          {/* Tab: Vacunas */}
          {activeTab === 'vaccines' && (
            <div className="space-y-3">
              {vaccinesLoading && (
                <p className="text-xs text-gray-500">Cargando calendario de vacunas…</p>
              )}
              {vaccinesError && (
                <p className="text-xs text-red-600">{vaccinesError}</p>
              )}

              {!vaccinesLoading && !vaccinesError && (
                <>
                  {/* Lista de vacunas */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Syringe className="w-4 h-4 text-indigo-700" />
                      <p className="font-semibold text-indigo-900 text-sm">
                        Calendario de vacunas registrado
                      </p>
                    </div>

                    {parsedVaccines.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No hay vacunas registradas en la historia de esta mascota.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {parsedVaccines.map(v => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">{v.name}</p>
                              <p className="text-[11px] text-gray-500">
                                Última dosis:{' '}
                                {v.lastDate
                                  ? v.lastDate.toLocaleDateString('es-ES')
                                  : 'No registrada'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-gray-500">Próxima dosis</p>
                              <p className="text-xs font-semibold text-gray-800">
                                {v.nextDate
                                  ? v.nextDate.toLocaleDateString('es-ES')
                                  : 'No registrada'}
                              </p>

                              {/* Badge según estado */}
                              {v.isOverdue && (
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold uppercase">
                                  Vencida
                                </span>
                              )}
                              {v.neverApplied && (
                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase">
                                  Aplicar vacuna
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bloque de resumen de problemas de vacunación */}
                  {hasIssues ? (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                      {overdueVaccines.length > 0 && (
                        <>
                          <p className="font-semibold text-red-900 mb-2 text-sm">
                            ⚠️ Vacunas vencidas
                          </p>
                          <ul className="space-y-1 mb-3">
                            {overdueVaccines.map(v => (
                              <li
                                key={v.id}
                                className="flex items-center gap-2 text-xs text-red-800"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                {v.name}{' '}
                                {v.nextDate && (
                                  <span className="text-[11px] text-red-600">
                                    (vencida desde {v.nextDate.toLocaleDateString('es-ES')})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {neverAppliedList.length > 0 && (
                        <>
                          <p className="font-semibold text-orange-900 mb-2 text-sm">
                            💉 Vacunas nunca aplicadas
                          </p>
                          <ul className="space-y-1">
                            {neverAppliedList.map(v => (
                              <li
                                key={v.id}
                                className="flex items-center gap-2 text-xs text-orange-800"
                              >
                                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                                {v.name}{' '}
                                {v.nextDate && (
                                  <span className="text-[11px] text-orange-600">
                                    (fecha programada: {v.nextDate.toLocaleDateString('es-ES')})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-center py-3">
                      <Shield className="w-10 h-10 text-green-400 mx-auto mb-2" />
                      <p className="text-green-700 font-medium text-sm">
                        Vacunas al día según el calendario registrado ✓
                      </p>
                    </div>
                  )}

                  {/* Riesgo por vacunación */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-1">
                      Riesgo asociado al estado de vacunación (modelo bayesiano + regresión):
                    </p>
                    <RiskChip
                      label="Riesgo por Vacunación"
                      probability={vaccinationProbability}
                      severity={
                        vaccinationProbability > 70
                          ? 'high'
                          : vaccinationProbability > 40
                          ? 'medium'
                          : 'low'
                      }
                      icon={Syringe}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthAIPredictor;
