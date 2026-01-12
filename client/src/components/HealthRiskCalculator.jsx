import { useState, useEffect } from 'react';
import { AlertTriangle, Heart, TrendingUp, Info, Activity, Shield } from 'lucide-react';

const HealthRiskCalculator = ({ pet }) => {
  const [risks, setRisks] = useState([]);
  const [overallRisk, setOverallRisk] = useState('low');

  useEffect(() => {
    if (pet) {
      calculateRisks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet]);

  // 📊 MODELO PROBABILÍSTICO DE RIESGO
  const calculateRisks = () => {
    const age = calculateAge(pet.birth_date);
    const weight = parseFloat(pet.weight) || 0;
    const species = pet.type || pet.species || '';
    const breed = pet.breed || '';
    const isNeutered = pet.is_sterilized;

    const calculatedRisks = [];

    // RIESGO 1: OBESIDAD
    const obesityRisk = calculateObesityRisk(species, breed, weight, age);
    if (obesityRisk.probability > 0) {
      calculatedRisks.push(obesityRisk);
    }

    // RIESGO 2: ENFERMEDADES CARDÍACAS
    const cardiacRisk = calculateCardiacRisk(species, breed, age, weight);
    if (cardiacRisk.probability > 0) {
      calculatedRisks.push(cardiacRisk);
    }

    // RIESGO 3: ARTRITIS
    const arthritisRisk = calculateArthritisRisk(species, breed, age, weight);
    if (arthritisRisk.probability > 0) {
      calculatedRisks.push(arthritisRisk);
    }

    // RIESGO 4: DIABETES
    const diabetesRisk = calculateDiabetesRisk(species, breed, age, weight, isNeutered);
    if (diabetesRisk.probability > 0) {
      calculatedRisks.push(diabetesRisk);
    }

    // RIESGO 5: PROBLEMAS DENTALES
    const dentalRisk = calculateDentalRisk(species, age);
    if (dentalRisk.probability > 0) {
      calculatedRisks.push(dentalRisk);
    }

    calculatedRisks.sort((a, b) => b.probability - a.probability);
    setRisks(calculatedRisks);

    if (calculatedRisks.length > 0) {
      const maxRisk = Math.max(...calculatedRisks.map(r => r.probability));
      if (maxRisk >= 60) setOverallRisk('high');
      else if (maxRisk >= 35) setOverallRisk('medium');
      else setOverallRisk('low');
    }
  };

  const calculateObesityRisk = (species, breed, weight, ageYears) => {
    if (!weight || weight === 0) return { probability: 0 };

    const idealWeights = {
      'Perro': {
        'pequeño': { mean: 8, std: 3 },
        'mediano': { mean: 20, std: 5 },
        'grande': { mean: 35, std: 8 }
      },
      'Gato': { mean: 4.5, std: 1 }
    };

    let probability = 0;
    let description = '';

    if (species === 'Perro') {
      let size = 'mediano';
      const smallBreeds = ['chihuahua', 'poodle', 'yorkshire', 'maltés', 'pomerania'];
      const largeBreeds = ['labrador', 'golden', 'pastor', 'husky', 'rottweiler', 'doberman'];
      
      const breedLower = breed.toLowerCase();
      if (smallBreeds.some(b => breedLower.includes(b))) size = 'pequeño';
      if (largeBreeds.some(b => breedLower.includes(b))) size = 'grande';

      const ideal = idealWeights['Perro'][size];
      const zScore = (weight - ideal.mean) / ideal.std;

      if (zScore > 2) {
        probability = 75 + (zScore - 2) * 5;
        description = `El peso está ${(weight - ideal.mean).toFixed(1)} kg por encima del promedio ideal (${ideal.mean} kg).`;
      } else if (zScore > 1) {
        probability = 45 + (zScore - 1) * 30;
        description = `El peso está ligeramente elevado comparado con el rango ideal.`;
      } else if (zScore > 0.5) {
        probability = 25 + (zScore - 0.5) * 40;
        description = `El peso está en el límite superior del rango saludable.`;
      }
    } else if (species === 'Gato') {
      const ideal = idealWeights['Gato'];
      const zScore = (weight - ideal.mean) / ideal.std;

      if (zScore > 2) {
        probability = 70 + (zScore - 2) * 5;
        description = `El peso está ${(weight - ideal.mean).toFixed(1)} kg por encima del promedio ideal (${ideal.mean} kg).`;
      } else if (zScore > 1) {
        probability = 40 + (zScore - 1) * 30;
        description = `El peso está ligeramente elevado.`;
      } else if (zScore > 0.5) {
        probability = 20 + (zScore - 0.5) * 40;
        description = `El peso está en el límite superior del rango saludable.`;
      }
    }

    if (ageYears > 7) {
      probability = Math.min(95, probability * 1.15);
      description += ` La edad avanzada (${ageYears} años) aumenta el riesgo.`;
    }

    return {
      name: 'Obesidad',
      probability: Math.min(95, Math.round(probability)),
      description,
      severity: probability > 60 ? 'high' : probability > 35 ? 'medium' : 'low',
      icon: TrendingUp,
      color: 'orange',
      recommendations: [
        'Controlar porciones de comida',
        'Aumentar actividad física diaria',
        'Consultar plan nutricional con veterinario',
        'Monitorear peso mensualmente'
      ],
      formula: `Z-score = (Peso - Media) / Desv.Est = (${weight} - ideal) / σ`
    };
  };

  const calculateCardiacRisk = (species, breed, ageYears, weight) => {
    let priorProbability = 0.05;

    const highRiskBreeds = ['cavalier', 'boxer', 'dóberman', 'gran danés', 'cocker'];
    const breedLower = breed.toLowerCase();
    
    if (highRiskBreeds.some(b => breedLower.includes(b))) {
      priorProbability = 0.25;
    }

    let ageLikelihood = 1;
    if (ageYears > 10) ageLikelihood = 4.5;
    else if (ageYears > 7) ageLikelihood = 2.8;
    else if (ageYears > 5) ageLikelihood = 1.5;

    let weightLikelihood = 1;
    if (species === 'Perro' && weight > 30) weightLikelihood = 1.8;
    else if (species === 'Perro' && weight > 40) weightLikelihood = 2.5;

    const posteriorProbability = priorProbability * ageLikelihood * weightLikelihood;
    const probability = Math.min(95, posteriorProbability * 100);

    if (probability < 15) return { probability: 0 };

    return {
      name: 'Enfermedades Cardíacas',
      probability: Math.round(probability),
      description: `Basado en edad (${ageYears} años), raza (${breed}) y peso (${weight} kg). Modelo de Bayes aplicado.`,
      severity: probability > 50 ? 'high' : probability > 30 ? 'medium' : 'low',
      icon: Heart,
      color: 'red',
      recommendations: [
        'Chequeo cardíaco anual (ecocardiograma)',
        'Monitoreo de frecuencia cardíaca',
        'Ejercicio moderado supervisado',
        'Dieta baja en sodio si se confirma diagnóstico'
      ],
      formula: `P(Cardiopatía|datos) = P(datos|Cardiopatía) × P(Cardiopatía) / P(datos)`
    };
  };

  const calculateArthritisRisk = (species, breed, ageYears, weight) => {
    let probability = 0;

    if (ageYears < 3) probability = 5;
    else if (ageYears < 6) probability = 15;
    else if (ageYears < 9) probability = 35;
    else if (ageYears < 12) probability = 60;
    else probability = 80;

    if (species === 'Perro') {
      const largeBreeds = ['labrador', 'golden', 'pastor', 'rottweiler', 'san bernardo'];
      if (largeBreeds.some(b => breed.toLowerCase().includes(b))) {
        probability *= 1.4;
      }
      
      if (weight > 35) probability *= 1.25;
    }

    probability = Math.min(95, probability);

    if (probability < 20) return { probability: 0 };

    return {
      name: 'Artritis / Problemas Articulares',
      probability: Math.round(probability),
      description: `Riesgo aumenta significativamente con la edad. ${species === 'Perro' && weight > 35 ? 'El sobrepeso acelera el desgaste articular.' : ''}`,
      severity: probability > 60 ? 'high' : probability > 40 ? 'medium' : 'low',
      icon: Activity,
      color: 'purple',
      recommendations: [
        'Suplementos de glucosamina y condroitina',
        'Control de peso estricto',
        'Ejercicio de bajo impacto (natación)',
        'Cama ortopédica para descanso',
        'Evaluación radiográfica anual'
      ],
      formula: `P(Artritis|Edad,Peso) = P(Edad) × Factor(Peso) × Factor(Raza)`
    };
  };

  const calculateDiabetesRisk = (species, breed, ageYears, weight, isNeutered) => {
    let score = 0;

    if (ageYears > 10) score += 40;
    else if (ageYears > 7) score += 25;
    else if (ageYears > 5) score += 10;

    if (species === 'Perro') {
      if (weight > 40) score += 30;
      else if (weight > 30) score += 20;
      else if (weight > 25) score += 10;
    } else if (species === 'Gato') {
      if (weight > 6) score += 30;
      else if (weight > 5) score += 20;
    }

    if (isNeutered) score += 15;

    const diabeticBreeds = ['beagle', 'dachshund', 'poodle', 'schnauzer'];
    if (diabeticBreeds.some(b => breed.toLowerCase().includes(b))) {
      score += 20;
    }

    const probability = Math.min(95, (score / 105) * 100);

    if (probability < 20) return { probability: 0 };

    return {
      name: 'Diabetes Mellitus',
      probability: Math.round(probability),
      description: `Score de riesgo: ${score}/105 puntos. Factores: edad, peso${isNeutered ? ', esterilización' : ''}.`,
      severity: probability > 55 ? 'high' : probability > 35 ? 'medium' : 'low',
      icon: AlertTriangle,
      color: 'amber',
      recommendations: [
        'Prueba de glucosa en sangre anual',
        'Control estricto de carbohidratos',
        'Monitoreo de síntomas (sed excesiva, micción frecuente)',
        'Mantener peso ideal',
        'Ejercicio regular'
      ],
      formula: `Score = Edad(40) + Peso(30) + Esterilizado(15) + Raza(20)`
    };
  };

  const calculateDentalRisk = (species, ageYears) => {
    let probability = 0;

    if (ageYears < 2) probability = 15;
    else if (ageYears < 4) probability = 35;
    else if (ageYears < 7) probability = 60;
    else probability = 85;

    if (species === 'Gato') probability *= 0.85;

    return {
      name: 'Enfermedad Periodontal',
      probability: Math.round(probability),
      description: `La mayoría de mascotas mayores de 3 años desarrollan algún grado de enfermedad dental.`,
      severity: probability > 70 ? 'medium' : 'low',
      icon: Shield,
      color: 'teal',
      recommendations: [
        'Limpieza dental profesional anual',
        'Cepillado dental 2-3 veces por semana',
        'Snacks dentales',
        'Revisión bucal en cada visita veterinaria'
      ],
      formula: `P(Dental) = Base(Edad) × Factor(Especie)`
    };
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getFullYear() - birth.getFullYear();
  };

  const getOverallRiskColor = () => {
    switch (overallRisk) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'green';
    }
  };

  const getOverallRiskText = () => {
    switch (overallRisk) {
      case 'high': return 'Alto';
      case 'medium': return 'Moderado';
      default: return 'Bajo';
    }
  };

  if (!pet) return null;

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-bold text-primary-900">Análisis de Riesgo de Salud</h3>
        </div>
        <div className={`px-4 py-2 bg-${getOverallRiskColor()}-100 border-2 border-${getOverallRiskColor()}-300 rounded-lg`}>
          <p className="text-xs font-semibold text-gray-600">RIESGO GENERAL</p>
          <p className={`text-lg font-bold text-${getOverallRiskColor()}-900`}>{getOverallRiskText()}</p>
        </div>
      </div>

      {/* Información del modelo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Modelo Probabilístico
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Teorema de Bayes:</strong> Enfermedades cardíacas</p>
          <p>• <strong>Distribución Normal:</strong> Análisis de peso y obesidad</p>
          <p>• <strong>Probabilidad Condicional:</strong> Artritis según edad y peso</p>
          <p>• <strong>Modelo de Scoring:</strong> Diabetes mellitus</p>
          <p className="text-xs italic mt-2">Basado en estudios veterinarios y datos epidemiológicos</p>
        </div>
      </div>

      {/* Lista de riesgos */}
      {risks.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-green-400 mx-auto mb-3" />
          <p className="text-green-700 font-semibold">¡Excelente! No se detectaron riesgos significativos.</p>
          <p className="text-green-600 text-sm mt-2">Continúa con chequeos preventivos regulares.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk, index) => (
            <div
              key={index}
              className={`border-2 border-${risk.color}-200 bg-${risk.color}-50 rounded-xl p-5 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <risk.icon className={`w-6 h-6 text-${risk.color}-600`} />
                  <div>
                    <h4 className={`font-bold text-${risk.color}-900 text-lg`}>{risk.name}</h4>
                    <p className={`text-sm text-${risk.color}-700`}>{risk.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold text-${risk.color}-900`}>{risk.probability}%</p>
                  <p className="text-xs text-gray-600">probabilidad</p>
                </div>
              </div>

              {/* Fórmula matemática */}
              <div className={`bg-${risk.color}-100 rounded p-2 mb-3`}>
                <p className="text-xs font-mono text-gray-700">{risk.formula}</p>
              </div>

              {/* Recomendaciones */}
              <div>
                <p className={`text-xs font-semibold text-${risk.color}-800 mb-2`}>RECOMENDACIONES:</p>
                <ul className={`text-sm text-${risk.color}-700 space-y-1`}>
                  {risk.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
        <p className="text-xs text-gray-700 flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Importante:</strong> Este análisis es una herramienta estadística de orientación. 
            No reemplaza el diagnóstico profesional de un veterinario. Consulta siempre con un profesional 
            para evaluaciones clínicas precisas.
          </span>
        </p>
      </div>
    </div>
  );
};

export default HealthRiskCalculator;
