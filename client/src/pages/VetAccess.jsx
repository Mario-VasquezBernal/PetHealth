import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validateQRToken, createMedicalRecord } from '../dataManager';
import { 
  Stethoscope, 
  User, 
  Building2, 
  FileText, 
  Weight,
  Pill,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

const VetAccess = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [petData, setPetData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    vet_name: '',
    clinic_name: '',
    reason: '',
    diagnosis: '',
    measured_weight: '',
    notes: '',
    treatments: []
  });

  const [newTreatment, setNewTreatment] = useState({
    type: 'MEDICATION',
    name: '',
    dosage: '',
    next_due_date: ''
  });

  useEffect(() => {
  validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);
;

  const validateToken = async () => {
    try {
      setValidating(true);
      const data = await validateQRToken(token);
      if (data.valid) {
        setIsValid(true);
        setPetData(data.pet);
        setFormData(prev => ({
          ...prev,
          measured_weight: data.pet.weight || ''
        }));
      }
    } catch (error) {
      console.error(error);
      setIsValid(false);
      toast.error(error.message || 'Código QR inválido o expirado');
    } finally {
      setValidating(false);
    }
  };

  const handleAddTreatment = () => {
    if (!newTreatment.name) {
      toast.warning('El nombre del tratamiento es requerido');
      return;
    }

    setFormData(prev => ({
      ...prev,
      treatments: [...prev.treatments, { ...newTreatment }]
    }));

    setNewTreatment({
      type: 'MEDICATION',
      name: '',
      dosage: '',
      next_due_date: ''
    });
  };

  const handleRemoveTreatment = (index) => {
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast.warning('El motivo de consulta es requerido');
      return;
    }

    try {
      setSubmitting(true);
      await createMedicalRecord({
        token,
        ...formData
      });
      
      setSuccess(true);
      toast.success('✅ Registro médico guardado exitosamente');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  // Estados de carga y validación
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">Validando código QR...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-2xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Código QR Inválido</h2>
          <p className="text-red-600 mb-6">
            El código QR ha expirado o no es válido. Solicita un nuevo código al dueño de la mascota.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-2xl border border-green-200 p-8 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-green-700 mb-4">
            El registro médico de <strong>{petData.name}</strong> ha sido guardado correctamente.
          </p>
          <p className="text-green-600 text-sm">
            Redirigiendo en 3 segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary-900">Acceso Veterinario</h1>
              <p className="text-primary-600">Registro médico para {petData?.name}</p>
            </div>
          </div>

          {/* Info de la mascota */}
          <div className="mt-4 pt-4 border-t border-primary-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-primary-600">Mascota</p>
              <p className="font-semibold text-primary-900">{petData?.name}</p>
            </div>
            <div>
              <p className="text-xs text-primary-600">Especie</p>
              <p className="font-semibold text-primary-900">{petData?.species}</p>
            </div>
            <div>
              <p className="text-xs text-primary-600">Raza</p>
              <p className="font-semibold text-primary-900">{petData?.breed || 'Mixta'}</p>
            </div>
            <div>
              <p className="text-xs text-primary-600">Dueño</p>
              <p className="font-semibold text-primary-900">{petData?.owner_name}</p>
            </div>
          </div>

          {petData?.allergies && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ ALERGIAS / CONDICIONES</p>
              <p className="text-sm text-orange-800">{petData.allergies}</p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Datos del Veterinario y Clínica */}
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Información del Profesional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Nombre del Veterinario *
                </label>
                <input
                  type="text"
                  value={formData.vet_name}
                  onChange={(e) => setFormData({...formData, vet_name: e.target.value})}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Dr. Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Clínica / Hospital
                </label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Veterinaria Central"
                />
              </div>
            </div>
          </div>

          {/* Detalles de la Consulta */}
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Detalles de la Consulta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Motivo de Consulta *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Ej: Vacunación anual, Revisión general, Síntomas..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Diagnóstico
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  rows={3}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Diagnóstico del veterinario..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Peso Actual (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.measured_weight}
                  onChange={(e) => setFormData({...formData, measured_weight: e.target.value})}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="15.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Observaciones, recomendaciones, cuidados especiales..."
                />
              </div>
            </div>
          </div>

          {/* Tratamientos */}
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary-600" />
              Tratamientos / Medicamentos
            </h3>

            {/* Lista de tratamientos agregados */}
            {formData.treatments.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.treatments.map((treatment, index) => (
                  <div key={index} className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-primary-900">{treatment.name}</p>
                      <p className="text-sm text-primary-600">
                        {treatment.type} {treatment.dosage && `• ${treatment.dosage}`}
                        {treatment.next_due_date && ` • Próxima: ${new Date(treatment.next_due_date).toLocaleDateString('es-ES')}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTreatment(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para nuevo tratamiento */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newTreatment.type}
                    onChange={(e) => setNewTreatment({...newTreatment, type: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="MEDICATION">Medicamento</option>
                    <option value="VACCINE">Vacuna</option>
                    <option value="PROCEDURE">Procedimiento</option>
                    <option value="DEWORMING">Desparasitación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newTreatment.name}
                    onChange={(e) => setNewTreatment({...newTreatment, name: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Nombre del tratamiento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                  <input
                    type="text"
                    value={newTreatment.dosage}
                    onChange={(e) => setNewTreatment({...newTreatment, dosage: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Ej: 1 tableta cada 12h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Dosis</label>
                  <input
                    type="date"
                    value={newTreatment.next_due_date}
                    onChange={(e) => setNewTreatment({...newTreatment, next_due_date: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTreatment}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Agregar Tratamiento
              </button>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 transition-colors font-medium shadow-md"
            >
              {submitting ? 'Guardando...' : 'Guardar Registro Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VetAccess;
