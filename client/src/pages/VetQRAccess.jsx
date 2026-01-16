// ============================================
// VETQRACCESS.JSX
// ============================================
// Página simplificada de acceso veterinario mediante QR
// Similar a VetAccess.jsx pero con formulario más compacto
// Permite crear registros médicos sin autenticación usando token QR temporal
//
// DIFERENCIAS con VetAccess.jsx:
// - Formulario más simple (menos campos)
// - No incluye datos del veterinario/clínica
// - No permite agregar múltiples tratamientos dinámicamente
// - Campos: diagnóstico*, tratamiento, peso medido, notas, próxima visita
//
// FLUJO:
// 1. Valida token QR del URL
// 2. Muestra datos de mascota y dueño
// 3. Destaca alergias si existen
// 4. Formulario simplificado de consulta
// 5. Al guardar: crea registro médico y limpia formulario
// 6. Permite múltiples registros consecutivos sin recargar
//
// Estados:
// - Loading: Validando token
// - Error: Token inválido (redirige a / en 3 seg)
// - Success: Formulario limpio, listo para nuevo registro
//
// Acceso público (no requiere login, solo token válido)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validateQRToken, createMedicalRecord } from '../dataManager';
import { Stethoscope, Calendar, AlertCircle, CheckCircle, Loader, Weight } from 'lucide-react';

const VetQRAccess = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [petData, setPetData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    next_visit: '',
    measured_weight: ''
  });

  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const data = await validateQRToken(token);
      setPetData(data);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Token inválido o expirado');
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.diagnosis.trim()) {
      toast.error('El diagnóstico es requerido');
      return;
    }

    try {
      setSubmitting(true);
      await createMedicalRecord({
        token,
        petId: petData.pet.id,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        notes: formData.notes,
        next_visit: formData.next_visit,
        measured_weight: formData.measured_weight
      });
      
      toast.success('✅ Registro médico guardado exitosamente');
      
      // Limpiar formulario
      setFormData({
        diagnosis: '',
        treatment: '',
        notes: '',
        next_visit: '',
        measured_weight: ''
      });
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al crear registro médico');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Validando código QR...</p>
        </div>
      </div>
    );
  }

  if (!petData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center bg-white p-8 rounded-card shadow-card border border-red-200 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Código QR inválido</h2>
          <p className="text-red-600 mb-4">El código QR ha expirado o no es válido</p>
          <p className="text-sm text-red-500">Serás redirigido en unos segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">Acceso Veterinario</h1>
              <p className="text-primary-600">Registro de consulta médica</p>
            </div>
          </div>

          {/* Info de la mascota */}
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-primary-700 mb-1">MASCOTA</p>
                <p className="text-lg font-bold text-primary-900">{petData.pet.name}</p>
                <p className="text-sm text-primary-600">{petData.pet.species} - {petData.pet.breed}</p>
                {petData.pet.weight && (
                  <p className="text-sm text-primary-600 mt-1">
                    <Weight className="w-3 h-3 inline mr-1" />
                    Peso actual: <strong>{petData.pet.weight} kg</strong>
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-700 mb-1">PROPIETARIO</p>
                <p className="text-sm font-semibold text-primary-900">{petData.owner.name}</p>
                <p className="text-sm text-primary-600">{petData.owner.phone}</p>
                <p className="text-sm text-primary-600">{petData.owner.email}</p>
              </div>
            </div>
            
            {petData.pet.allergies && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ ALERGIAS/NOTAS</p>
                <p className="text-sm text-orange-800 font-medium">{petData.pet.allergies}</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card border border-primary-100 p-6">
          <h2 className="text-xl font-bold text-primary-900 mb-6">Registro de Consulta</h2>

          {/* Diagnóstico */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Diagnóstico <span className="text-red-500">*</span>
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Ingresa el diagnóstico de la consulta"
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Tratamiento */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Tratamiento
            </label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              rows="3"
              placeholder="Medicamentos, procedimientos, etc."
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Peso medido */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Peso medido (kg)
            </label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="number"
                step="0.1"
                name="measured_weight"
                value={formData.measured_weight}
                onChange={handleChange}
                placeholder="Ej: 15.5"
                className="w-full pl-10 pr-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>
            <p className="text-xs text-primary-500 mt-1">
              Este peso actualizará automáticamente el peso registrado de la mascota
            </p>
          </div>

          {/* Notas adicionales */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Notas adicionales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Observaciones, recomendaciones..."
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Próxima visita */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Próxima visita (opcional)
            </label>
            <input
              type="date"
              name="next_visit"
              value={formData.next_visit}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: submitting ? '#86EFAC' : '#059669',
              color: '#ffffff',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s',
              opacity: 1,
              visibility: 'visible'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#047857';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Guardando registro...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Guardar Registro Médico</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-primary-600">
          <p>Este formulario está protegido y solo es accesible mediante código QR válido</p>
        </div>
      </div>
    </div>
  );
};

export default VetQRAccess;
