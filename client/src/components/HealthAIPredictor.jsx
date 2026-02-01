import { useState } from 'react';
import axios from 'axios';
import { normalizeSpecies, getSpeciesProfile } from '../speciesProfiles';

const speciesEmoji = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  reptile: '🦎',
  other: '🐾'
};

const HealthAIPredictor = ({ petId, pet }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [lifestyle, setLifestyle] = useState({
    exercise: 'medium',
    diet: 'average',
    vetVisits: 'sometimes'
  });

  const normalizedSpecies = pet ? normalizeSpecies(pet) : 'other';
  const speciesProfile = getSpeciesProfile(normalizedSpecies);

  const predict = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/health-prediction`,
        {
          pet_id: petId,
          species: normalizedSpecies,
          lifestyle
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data.prediction);

    } catch (err) {
      console.error(err);
      alert('Error generando predicción IA');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border space-y-4">
      <h3 className="text-xl font-bold">
        🤖 Predicción IA de Salud — {speciesProfile.label}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <select onChange={e => setLifestyle({ ...lifestyle, exercise: e.target.value })}>
          <option value="low">Ejercicio bajo</option>
          <option value="medium">Ejercicio medio</option>
          <option value="high">Ejercicio alto</option>
        </select>

        <select onChange={e => setLifestyle({ ...lifestyle, diet: e.target.value })}>
          <option value="poor">Dieta mala</option>
          <option value="average">Dieta normal</option>
          <option value="good">Dieta buena</option>
        </select>

        <select onChange={e => setLifestyle({ ...lifestyle, vetVisits: e.target.value })}>
          <option value="never">Nunca veterinario</option>
          <option value="sometimes">A veces</option>
          <option value="regular">Regular</option>
        </select>
      </div>

      <button
        onClick={predict}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Calculando...' : 'Predecir'}
      </button>

      {result && (
        <div className="mt-4 bg-gray-50 p-4 rounded space-y-3 text-sm">

          <p>
            {speciesEmoji[normalizedSpecies] || '🐾'}{' '}
            <b>Riesgo de obesidad:</b> {result.obesity?.probability ?? 0}%
            ({result.obesity?.severity})
          </p>

          <p>
            🍬 <b>Probabilidad de diabetes en 2 años:</b>{' '}
            {result.diabetes_2y?.probability ?? 0}%
          </p>

          <p className="text-xs text-gray-600">
            {result.diabetes_2y?.explanation}
          </p>

          <div>
            <p className="font-semibold mb-1">🧬 Progresión estimada (Markov):</p>
            <ul className="list-disc ml-5">
              {result.markov_projection?.states?.map((s, i) => (
                <li key={i}>
                  Año {s.year}: {s.state}
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};

export default HealthAIPredictor;
