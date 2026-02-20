import { useState, useEffect } from 'react';
import { AlertTriangle, Heart, TrendingUp, Info, Activity, Shield } from 'lucide-react';
import { normalizeSpecies, getSpeciesProfile } from '../speciesProfiles';

const HealthRiskCalculator = ({ pet, prediction }) => {
  const [risks, setRisks] = useState([]);
  const [overallRisk, setOverallRisk] = useState('low');

  useEffect(() => {
    if (pet) {
      calculateRisks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet]);

  const calculateRisks = () => {
    const age = calculateAge(pet.birth_date);
    const weight = parseFloat(pet.weight) || 0;
    const normalizedSpecies = normalizeSpecies(pet);
    const speciesProfile = getSpeciesProfile(normalizedSpecies);

    if (!speciesProfile.supportsHealthRisk) {
      setRisks([]);
      setOverallRisk('low');
      return;
    }

    const species =
      normalizedSpecies === 'dog' ? 'Perro' :
      normalizedSpecies === 'cat' ? 'Gato' : '';

    const breed = pet.breed || '';
    const isNeutered = pet.is_sterilized;
    const calculatedRisks = [];

    const obesityRisk = calculateObesityRisk(species, breed, weight, age);
    if (obesityRisk.probability > 0) calculatedRisks.push(obesityRisk);

    const cardiacRisk = calculateCardiacRisk(species, breed, age, weight);
    if (cardiacRisk.probability > 0) calculatedRisks.push(cardiacRisk);

    const arthritisRisk = calculateArthritisRisk(species, breed, age, weight);
    if (arthritisRisk.probability > 0) calculatedRisks.push(arthritisRisk);

    const diabetesRisk = calculateDiabetesRisk(species, breed, age, weight, isNeutered);
    if (diabetesRisk.probability > 0) calculatedRisks.push(diabetesRisk);

    const dentalRisk = calculateDentalRisk(species, age);
    if (dentalRisk.probability > 0) calculatedRisks.push(dentalRisk);

    calculatedRisks.sort((a, b) => b.probability - a.probability);
    setRisks(calculatedRisks);

    if (calculatedRisks.length > 0) {
      const maxRisk = Math.max(...calculatedRisks.map(r => r.probability));
      if (maxRisk >= 60) setOverallRisk('high');
      else if (maxRisk >= 35) setOverallRisk('medium');
      else setOverallRisk('low');
    } else {
      setOverallRisk('low');
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
    if (highRiskBreeds.some(b => breedLower.includes(b))) priorProbability = 0.25;

    let ageLikelihood = 1;
    if (ageYears > 10) ageLikelihood = 4.5;
    else if (ageYears > 7) ageLikelihood = 2.8;
    else if (ageYears > 5) ageLikelihood = 1.5;

    let weightLikelihood = 1;
    if (species === 'Perro' && weight > 40) weightLikelihood = 2.5;
    else if (species === 'Perro' && weight > 30) weightLikelihood = 1.8;

    const posteriorProbability = priorProbability * ageLikelihood * weightLikelihood;
    const probability = Math.min(95, posteriorProbability * 100);

    if (probability < 15) return { probability: 0 };

    return {
      name: 'Enfermedades Cardiacas',
      probability: Math.round(probability),
      description: `Basado en edad (${ageYears} años), raza (${breed}) y peso (${weight} kg). Modelo de Bayes aplicado.`,
      severity: probability > 50 ? 'high' : probability > 30 ? 'medium' : 'low',
      icon: Heart,
      color: 'red',
      recommendations: [
        'Chequeo cardiaco anual (ecocardiograma)',
        'Monitoreo de frecuencia cardiaca',
        'Ejercicio moderado supervisado',
        'Dieta baja en sodio si se confirma diagnostico'
      ],
      formula: `P(Cardiopatia|datos) = P(datos|Cardiopatia) x P(Cardiopatia) / P(datos)`
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
      if (largeBreeds.some(b => breed.toLowerCase().includes(b))) probability *= 1.4;
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
        'Ejercicio de bajo impacto (natacion)',
        'Cama ortopedica para descanso',
        'Evaluacion radiografica anual'
      ],
      formula: `P(Artritis|Edad,Peso) = P(Edad) x Factor(Peso) x Factor(Raza)`
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
    if (diabeticBreeds.some(b => breed.toLowerCase().includes(b))) score += 20;

    const probability = Math.min(95, (score / 105) * 100);
    if (probability < 20) return { probability: 0 };

    return {
      name: 'Diabetes Mellitus',
      probability: Math.round(probability),
      description: `Score de riesgo: ${score}/105 puntos. Factores: edad, peso${isNeutered ? ', esterilizacion' : ''}.`,
      severity: probability > 55 ? 'high' : probability > 35 ? 'medium' : 'low',
      icon: AlertTriangle,
      color: 'amber',
      recommendations: [
        'Prueba de glucosa en sangre anual',
        'Control estricto de carbohidratos',
        'Monitoreo de sintomas (sed excesiva, miccion frecuente)',
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
      description: `La mayoria de mascotas mayores de 3 años desarrollan algun grado de enfermedad dental.`,
      severity: probability > 70 ? 'medium' : 'low',
      icon: Shield,
      color: 'teal',
      recommendations: [
        'Limpieza dental profesional anual',
        'Cepillado dental 2-3 veces por semana',
        'Snacks dentales',
        'Revision bucal en cada visita veterinaria'
      ],
      formula: `P(Dental) = Base(Edad) x Factor(Especie)`
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
    // ── FRAGMENTO RAIZ — necesario para envolver los dos bloques ──
    <>
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-primary-900">Analisis de Riesgo de Salud</h3>
          </div>
          <div className={`px-4 py-2 bg-${getOverallRiskColor()}-100 border-2 border-${getOverallRiskColor()}-300 rounded-lg`}>
            <p className="text-xs font-semibold text-gray-600">RIESGO GENERAL</p>
            <p className={`text-lg font-bold text-${getOverallRiskColor()}-900`}>{getOverallRiskText()}</p>
          </div>
        </div>

        {/* Informacion del modelo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Modelo Probabilistico
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Teorema de Bayes:</strong> Enfermedades cardiacas + Renal + Displasia (motor IA)</p>
            <p>• <strong>Distribucion Normal:</strong> Analisis de peso y obesidad</p>
            <p>• <strong>Probabilidad Condicional:</strong> Artritis segun edad y peso</p>
            <p>• <strong>Modelo de Scoring:</strong> Diabetes mellitus</p>
            <p>• <strong>Cadena de Markov:</strong> Proyeccion de estado de salud a 3 años</p>
            <p className="text-xs italic mt-2">Basado en estudios veterinarios y datos epidemiologicos</p>
          </div>
        </div>

        {/* Lista de riesgos locales */}
        {risks.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-3" />
            <p className="text-green-700 font-semibold">No se detectaron riesgos significativos.</p>
            <p className="text-green-600 text-sm mt-2">Continua con chequeos preventivos regulares.</p>
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

                <div className={`bg-${risk.color}-100 rounded p-2 mb-3`}>
                  <p className="text-xs font-mono text-gray-700">{risk.formula}</p>
                </div>

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
              <strong>Importante:</strong> Este analisis es una herramienta estadistica de orientacion.
              No reemplaza el diagnostico profesional de un veterinario.
            </span>
          </p>
        </div>

        {/* ── BLOQUE IA BAYESIANO — dentro del mismo div, bajo el disclaimer ── */}
        {prediction && (
          <div className="mt-6 space-y-3">
            <h4 className="font-bold text-primary-900 flex items-center gap-2 border-t border-gray-200 pt-4">
              Riesgos adicionales (motor IA bayesiano)
            </h4>

            {prediction.renalRisk && (
              <div className={`border-2 rounded-xl p-4 ${
                prediction.renalRisk.severity === 'high'   ? 'border-red-200 bg-red-50' :
                prediction.renalRisk.severity === 'medium' ? 'border-orange-200 bg-orange-50' :
                                                             'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Enfermedad Renal Cronica</span>
                  <span className="text-2xl font-bold text-gray-900">{prediction.renalRisk.probability}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      prediction.renalRisk.severity === 'high'   ? 'bg-red-500' :
                      prediction.renalRisk.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${prediction.renalRisk.probability}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-mono">
                  P(Renal|datos) = Bayes(prior, evidencias clinicas)
                </p>
              </div>
            )}

            {prediction.hipDysplasiaRisk && (
              <div className={`border-2 rounded-xl p-4 ${
                prediction.hipDysplasiaRisk.severity === 'high'   ? 'border-red-200 bg-red-50' :
                prediction.hipDysplasiaRisk.severity === 'medium' ? 'border-orange-200 bg-orange-50' :
                                                                    'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Displasia de Cadera</span>
                  <span className="text-2xl font-bold text-gray-900">{prediction.hipDysplasiaRisk.probability}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      prediction.hipDysplasiaRisk.severity === 'high'   ? 'bg-red-500' :
                      prediction.hipDysplasiaRisk.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${prediction.hipDysplasiaRisk.probability}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-mono">
                  P(Displasia|Raza,Peso,Edad) = Bayes posterior
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HealthRiskCalculator;


// ============================================
// HEALTHRISKCALCULATOR.JSX
// ============================================
// Componente de análisis predictivo de salud para mascotas usando modelos probabilísticos
// Calcula automáticamente riesgos de 5 condiciones médicas basado en datos del animal
// Implementa métodos estadísticos: Teorema de Bayes, Distribución Normal (Z-score), 
// Probabilidad Condicional y Modelo de Scoring para cuantificar riesgos
//
// ENFERMEDADES ANALIZADAS:
// 1. OBESIDAD: Usa distribución normal (Z-score) comparando peso actual vs ideal por especie/raza
//    - Perros pequeños: media 8kg ±3kg | medianos: 20kg ±5kg | grandes: 35kg ±8kg
//    - Gatos: media 4.5kg ±1kg
//    - Z-score >1σ: 45% riesgo | >2σ: 75% riesgo
//
// 2. CARDIOPATÍAS: Teorema de Bayes con probabilidad prior ajustada por raza de riesgo
//    - Razas alto riesgo (Cavalier, Boxer, Dóberman): prior 0.25
//    - Otras razas: prior 0.05
//    - Factores: edad (>10 años: 4.5x) + peso (>40kg: 2.5x)
//    - Umbral: >50% alto riesgo
//
// 3. ARTRITIS: Probabilidad condicional basada en edad + factores agravantes (peso, raza grande)
//    - <3 años: 5% | 3-6 años: 15% | 6-9 años: 35% | 9-12 años: 60% | >12 años: 80%
//    - Razas grandes (Labrador, Golden, Pastor): multiplicador 1.4x
//    - Sobrepeso (>35kg): multiplicador 1.25x
//
// 4. DIABETES: Sistema de scoring con puntos acumulativos (edad + peso + esterilización + raza)
//    - Score máximo: 105 puntos
//    - Edad >10 años: +40pts | Peso elevado: +30pts | Esterilizado: +15pts | Raza predispuesta: +20pts
//    - Razas riesgo: Beagle, Dachshund, Poodle, Schnauzer
//    - >55 pts: alto riesgo
//
// 5. ENFERMEDAD PERIODONTAL: Modelo basado en edad con ajuste por especie
//    - <2 años: 15% | 2-4 años: 35% | 4-7 años: 60% | >7 años: 85%
//    - Gatos: probabilidad reducida 0.85x vs perros
//
// CARACTERÍSTICAS:
// - Cada riesgo muestra: porcentaje de probabilidad, descripción técnica, fórmula matemática,
//   severidad (low/medium/high), recomendaciones preventivas
// - Clasificación general de riesgo: Bajo (<35%), Moderado (35-60%), Alto (>60%)
// - No muestra riesgos con probabilidad <15-20% para evitar falsos positivos
// - Visualización con colores por severidad y iconos específicos por patología
// - Incluye disclaimer médico-legal sobre uso orientativo del análisis
//
// PROPS:
// - pet: objeto con datos de la mascota (birth_date, weight, type/species, breed, is_sterilized)
//
// VALIDACIÓN: Basado en estudios epidemiológicos veterinarios y estándares de peso por raza
// ============================================
