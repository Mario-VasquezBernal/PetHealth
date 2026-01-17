import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validateQRToken, createMedicalRecord } from '../dataManager';
import { toast } from 'react-toastify';
import { 
  Stethoscope, 
  Weight, 
  User,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  Activity
} from 'lucide-react';

const VetQRAccess = () => {
  const { token } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [petData, setPetData] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [availableVets, setAvailableVets] = useState([]);
  const [availableClinics, setAvailableClinics] = useState([]);
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    measured_weight: '',
    vet_id: '',
    clinic_id: '',
    visit_reason: '',
    examination_findings: '',
    follow_up_date: '',
    visit_type: 'rutina'
  });

  useEffect(() => {
    validateTokenFunc();
  }, [token]);

  const validateTokenFunc = async () => {
    try {
      const data = await validateQRToken(token);
      setPetData(data.pet);
      setTokenValid(true);
      setAvailableVets(data.availableVets || []);
      setAvailableClinics(data.availableClinics || []);
      console.log('✅ Veterinarios:', data.availableVets);
      console.log('✅ Clínicas:', data.availableClinics);
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
    
    if (!formData.vet_id && !formData.clinic_id) {
      return toast.warning('Selecciona al menos el doctor o la clínica');
    }

    try {
      setSubmitting(true);
      
      await createMedicalRecord({
        token,
        ...formData,
        vet_id: formData.vet_id ? parseInt(formData.vet_id) : null,
        clinic_id: formData.clinic_id ? parseInt(formData.clinic_id) : null,
        measured_weight: formData.measured_weight ? parseFloat(formData.measured_weight) : null
      });
      
      toast.success('✅ Registro médico guardado exitosamente');
      
      setFormData({
        diagnosis: '',
        treatment: '',
        notes: '',
        measured_weight: '',
        vet_id: '',
        clinic_id: '',
        visit_reason: '',
        examination_findings: '',
        follow_up_date: '',
        visit_type: 'rutina'
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

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">MASCOTA</p>
              <p className="font-bold text-gray-900 text-lg">{petData.name}</p>
              <p className="text-gray-600 text-sm">{petData.type} - {petData.breed || 'Mixto'}</p>
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
              <p className="text-xs font-bold text-orange-700 flex items-center gap-1">
                ⚠️ ALERGIAS/NOTAS
              </p>
              <p className="text-orange-900 font-medium">{petData.allergies}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Registro de Consulta</h2>

          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Doctor que Atendió *
                </label>
                <select
                  required
                  value={formData.vet_id}
                  onChange={(e) => setFormData({...formData, vet_id: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar doctor...</option>
                  {availableVets.map(vet => (
                    <option key={vet.id} value={vet.id}>
                      {vet.name} - {vet.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Clínica donde fue Atendido *
                </label>
                <select
                  required
                  value={formData.clinic_id}
                  onChange={(e) => setFormData({...formData, clinic_id: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar clínica...</option>
                  {availableClinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name} {clinic.city ? `- ${clinic.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo de la Consulta
                </label>
                <input
                  type="text"
                  placeholder="Ej: Chequeo anual, Vacunación, Emergencia..."
                  value={formData.visit_reason}
                  onChange={(e) => setFormData({...formData, visit_reason: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Visita
                </label>
                <select
                  value={formData.visit_type}
                  onChange={(e) => setFormData({...formData, visit_type: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="rutina">Rutina</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="cirugia">Cirugía</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Diagnóstico *
              </label>
              <textarea
                required
                rows="3"
                placeholder="Ingresa el diagnóstico de la consulta"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tratamiento
              </label>
              <textarea
                rows="3"
                placeholder="Medicamentos, procedimientos, etc."
                value={formData.treatment}
                onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hallazgos del Examen Físico
              </label>
              <textarea
                rows="2"
                placeholder="Temperatura, frecuencia cardíaca, condición física general..."
                value={formData.examination_findings}
                onChange={(e) => setFormData({...formData, examination_findings: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  Peso medido (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 15.5"
                  value={formData.measured_weight}
                  onChange={(e) => setFormData({...formData, measured_weight: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este peso actualizará automáticamente el peso registrado de la mascota
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Próxima Revisión
                </label>
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                rows="3"
                placeholder="Observaciones, recomendaciones..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Guardar Registro Médico
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VetQRAccess;
