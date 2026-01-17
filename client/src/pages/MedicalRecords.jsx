// ============================================
// MEDICALRECORDS.JSX
// ============================================
// Página de historial médico de mascotas
// Muestra un selector (dropdown) de todas las mascotas del usuario
// Al seleccionar una mascota, muestra su historial médico completo
// Utiliza el componente MedicalHistory para renderizar los registros
// Si no hay mascotas, muestra mensaje de estado vacío
// Preselecciona la primera mascota automáticamente
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';


const CreateMedicalRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scanData = location.state?.scanData;
  const petToken = location.state?.petToken;


  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    measured_weight: '',
    next_visit_date: '',
    city: '',
    vet_id: scanData?.veterinarian?.id || '',
    clinic_id: scanData?.clinic?.id || ''
  });


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (scanData?.clinic) {
      setFormData(prev => ({
        ...prev,
        vet_id: scanData.veterinarian?.id || '',
        clinic_id: scanData.clinic?.id || '',
        city: scanData.clinic?.city || ''
      }));
    }
  }, [scanData]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');


    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';
     
      const payload = {
        token: petToken,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        notes: formData.notes,
        measured_weight: formData.measured_weight ? parseFloat(formData.measured_weight) : null,
        next_visit_date: formData.next_visit_date || null,
        city: formData.city || null,
        vet_id: formData.vet_id,
        clinic_id: formData.clinic_id
      };


      await axios.post(`${API_URL}/medical-records/create`, payload);


      alert('✅ Registro médico creado exitosamente');
      navigate('/vet-dashboard');
    } catch (err) {
      console.error('❌ Error creando registro:', err);
      setError(err.response?.data?.error || 'Error al crear el registro médico');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📋 Crear Registro Médico
          </h1>


          {scanData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                ✅ Datos del QR escaneado:
              </p>
              <p className="text-sm text-blue-800">
                🏥 Clínica: {scanData.clinic?.name}
              </p>
              <p className="text-sm text-blue-800">
                👨‍⚕️ Veterinario: {scanData.veterinarian?.name}
              </p>
            </div>
          )}


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico *
              </label>
              <textarea
                required
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Ingrese el diagnóstico"
              />
            </div>


            {/* Tratamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tratamiento *
              </label>
              <textarea
                required
                value={formData.treatment}
                onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Ingrese el tratamiento"
              />
            </div>


            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="Observaciones o notas adicionales"
              />
            </div>


            {/* Peso Medido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso Medido (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.measured_weight}
                onChange={(e) => setFormData({...formData, measured_weight: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 5.5"
              />
            </div>


            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Cuenca"
              />
            </div>


            {/* Próxima Visita */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próxima Visita (Opcional)
              </label>
              <input
                type="date"
                value={formData.next_visit_date}
                onChange={(e) => setFormData({...formData, next_visit_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default CreateMedicalRecord;