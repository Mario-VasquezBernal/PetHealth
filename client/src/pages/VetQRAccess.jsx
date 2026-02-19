import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom'; // ✅ CAMBIO: agregar useSearchParams
import { validateQRToken, createMedicalRecord } from '../dataManager';
import { toast } from 'react-toastify';
import { 
  Stethoscope, Weight, User, Building2, Clock,
  AlertCircle, CheckCircle, Loader, Thermometer, Heart
} from 'lucide-react';

const VetQRAccess = () => {
  const { token }              = useParams();
  const [searchParams]         = useSearchParams(); // ✅ CAMBIO: leer parámetros del QR

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [petData, setPetData]       = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [assignedVet, setAssignedVet]       = useState(null);
  const [assignedClinic, setAssignedClinic] = useState(null);

  const [formData, setFormData] = useState({
    diagnosis:            '',
    treatment:            '',
    notes:                '',
    recorded_weight:      '',   // ✅ CAMBIO: era 'measured_weight' → ahora coincide con el backend
    vet_id:               '',
    clinic_id:            '',
    visit_reason:         '',
    examination_findings: '',
    next_visit:           '',   // ✅ CAMBIO: era 'follow_up_date' → ahora coincide con el backend
    visit_type:           'Consulta General', // ✅ CAMBIO: valor en español para que coincida con el badge
    temperature:          '',   // ✅ CAMBIO: campo nuevo (signos vitales)
    heart_rate:           '',   // ✅ CAMBIO: campo nuevo (signos vitales)
  });

  useEffect(() => {
    validateTokenFunc();
  }, [token]);

  const validateTokenFunc = async () => {
    try {
      const data = await validateQRToken(token);
      setPetData(data.pet);
      setTokenValid(true);

      // ✅ CAMBIO: Si validateQRToken devuelve assignedVet/assignedClinic úsalos,
      // si no, construirlos desde los query params del QR (vet_id, vet_name, clinic_id, clinic_name)
      const vet = data.assignedVet || {
        id:   searchParams.get('vet_id'),
        name: searchParams.get('vet_name'),
      };

      const clinic = data.assignedClinic || {
        id:   searchParams.get('clinic_id'),
        name: searchParams.get('clinic_name'),
      };

      setAssignedVet(vet);
      setAssignedClinic(clinic);

      setFormData(prev => ({
        ...prev,
        vet_id:    vet?.id    || '',
        clinic_id: clinic?.id || '',
      }));

      console.log('✅ Veterinario asignado:', vet);
      console.log('✅ Clínica asignada:', clinic);
      toast.success('Código QR válido');
    } catch (error) {
      setTokenValid(false);
      toast.error(error.message || 'Código QR inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.diagnosis || !formData.treatment) {
      return toast.warning('Completa diagnóstico y tratamiento');
    }

    try {
      setSubmitting(true);

      // ✅ CAMBIO: payload alineado con lo que espera public.routes.js
      await createMedicalRecord({
        token,                                    // para resolver pet_id en el backend
        clinic_id:       formData.clinic_id,
        clinic_name:     assignedClinic?.name || '',
        veterinarian_name: assignedVet?.name  || '',
        diagnosis:       formData.diagnosis,
        treatment:       formData.treatment,
        notes:           formData.notes,
        recorded_weight: formData.recorded_weight // ✅ CAMBIO: nombre correcto para el backend
          ? parseFloat(formData.recorded_weight)
          : null,
        next_visit:      formData.next_visit || null, // ✅ CAMBIO: nombre correcto para el backend
        visit_type:      formData.visit_type,
        temperature:     formData.temperature     // ✅ CAMBIO: signos vitales
          ? parseFloat(formData.temperature)
          : null,
        heart_rate:      formData.heart_rate      // ✅ CAMBIO: signos vitales
          ? parseInt(formData.heart_rate)
          : null,
        examination_findings: formData.examination_findings,
      });

      toast.success('✅ Registro médico guardado exitosamente');

      // Reset
      setFormData({
        diagnosis:            '',
        treatment:            '',
        notes:                '',
        recorded_weight:      '',
        vet_id:               assignedVet?.id    || '',
        clinic_id:            assignedClinic?.id || '',
        visit_reason:         '',
        examination_findings: '',
        next_visit:           '',
        visit_type:           'Consulta General',
        temperature:          '',
        heart_rate:           '',
      });

    } catch (error) {
      toast.error(error.message || 'Error al guardar registro');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando código QR...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Código QR Inválido</h2>
          <p className="text-gray-600 mb-6">
            Este código ha expirado o no es válido. Solicita uno nuevo al dueño de la mascota.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-blue-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Acceso Veterinario</h1>
              <p className="text-gray-600">Registro de consulta médica</p>
            </div>
          </div>
        </div>

        {/* INFO MASCOTA */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">MASCOTA</p>
              <p className="font-bold text-gray-900 text-lg">{petData.name}</p>
              <p className="text-gray-600 text-sm">{petData.species} - {petData.breed || 'Mixto'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">PROPIETARIO</p>
              <p className="font-bold text-gray-900">{petData.owner_name}</p>
              <p className="text-gray-600 text-sm">{petData.owner_phone}</p>
              <p className="text-gray-600 text-sm">{petData.owner_email}</p>
            </div>
          </div>
          {petData.allergies && petData.allergies !== 'no' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-bold text-orange-700 flex items-center gap-1">⚠️ ALERGIAS/NOTAS</p>
              <p className="text-orange-900 font-medium">{petData.allergies}</p>
            </div>
          )}
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Registro de Consulta</h2>

          <div className="space-y-6">

            {/* INFO ASIGNADA (read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" /> Doctor Asignado
                </label>
                <div className="bg-white border-2 border-green-300 p-3 rounded-xl">
                  <p className="font-bold text-gray-900">{assignedVet?.name || 'No asignado'}</p>
                  {assignedVet?.specialty && <p className="text-sm text-gray-600">{assignedVet.specialty}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-600" /> Clínica Asignada
                </label>
                <div className="bg-white border-2 border-green-300 p-3 rounded-xl">
                  <p className="font-bold text-gray-900">{assignedClinic?.name || 'No asignada'}</p>
                  {assignedClinic?.address && <p className="text-sm text-gray-600">{assignedClinic.address}</p>}
                </div>
              </div>
            </div>

            {/* MOTIVO Y TIPO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de la Consulta</label>
                <input
                  type="text"
                  placeholder="Ej: Chequeo anual, Vacunación, Emergencia..."
                  value={formData.visit_reason}
                  onChange={(e) => setFormData({...formData, visit_reason: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Visita</label>
                {/* ✅ CAMBIO: valores en español para que coincidan con el badge del historial */}
                <select
                  value={formData.visit_type}
                  onChange={(e) => setFormData({...formData, visit_type: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Consulta General">Consulta General</option>
                  <option value="Emergencia">Emergencia</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Rutina">Rutina</option>
                </select>
              </div>
            </div>

            {/* DIAGNÓSTICO */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnóstico *</label>
              <textarea required rows="3" placeholder="Ingresa el diagnóstico de la consulta"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* TRATAMIENTO */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tratamiento *</label>
              <textarea required rows="3" placeholder="Medicamentos, procedimientos, etc."
                value={formData.treatment}
                onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* HALLAZGOS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hallazgos del Examen Físico</label>
              <textarea rows="2" placeholder="Temperatura, frecuencia cardíaca, condición física general..."
                value={formData.examination_findings}
                onChange={(e) => setFormData({...formData, examination_findings: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* ✅ CAMBIO: Signos vitales como campos individuales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" /> Temperatura (°C)
                </label>
                <input
                  type="number" step="0.1" placeholder="Ej: 38.5"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> Frecuencia Cardíaca (bpm)
                </label>
                <input
                  type="number" placeholder="Ej: 90"
                  value={formData.heart_rate}
                  onChange={(e) => setFormData({...formData, heart_rate: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                />
              </div>
            </div>

            {/* PESO Y PRÓXIMA REVISIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Weight className="w-4 h-4" /> Peso medido (kg)
                </label>
                <input
                  type="number" step="0.1" placeholder="Ej: 15.5"
                  value={formData.recorded_weight}  // ✅ CAMBIO: nombre correcto
                  onChange={(e) => setFormData({...formData, recorded_weight: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Este peso actualizará automáticamente el peso de la mascota</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Próxima Revisión
                </label>
                <input
                  type="date"
                  value={formData.next_visit}       // ✅ CAMBIO: nombre correcto
                  onChange={(e) => setFormData({...formData, next_visit: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* NOTAS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notas adicionales</label>
              <textarea rows="3" placeholder="Observaciones, recomendaciones..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <><Loader className="w-5 h-5 animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> Guardar Registro Médico</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VetQRAccess;
