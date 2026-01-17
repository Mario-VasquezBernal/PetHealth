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

// ============================================
// CREATEMEDICALRECORD.JSX
// ============================================
// Página para crear un registro médico desde QR
// Muestra datos escaneados del QR (clínica + veterinario)
// Formulario completo con diagnóstico, tratamiento, peso, ciudad, etc.
// Utiliza el mismo layout que otras páginas (Sidebar + Header)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { FileText, MapPin, Building2, Stethoscope, Weight, Calendar, FileEdit } from 'lucide-react';

const CreateMedicalRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scanData = location.state?.scanData;
  const petToken = location.state?.petToken;

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    loadUser();
  }, []);

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

  const loadUser = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      
      <Sidebar 
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      <div className="flex-1 lg:ml-72">
        
        <MobileHeader 
          onMenuClick={() => setSidebarOpen(true)}
          onNewPet={null}
        />

        {/* Header Desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-900" strokeWidth={2} />
              <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileEdit className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Crear Registro Médico</h1>
                <p className="text-gray-600">Completa la información de la consulta veterinaria</p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              
              {/* Información del QR escaneado */}
              {scanData && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                    Datos del QR escaneado
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Building2 className="w-4 h-4" />
                      <span className="font-semibold">Clínica:</span>
                      <span>{scanData.clinic?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Stethoscope className="w-4 h-4" />
                      <span className="font-semibold">Veterinario:</span>
                      <span>{scanData.veterinarian?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Diagnóstico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Diagnóstico *
                  </label>
                  <textarea
                    required
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Ingrese el diagnóstico del paciente"
                  />
                </div>

                {/* Tratamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Tratamiento *
                  </label>
                  <textarea
                    required
                    value={formData.treatment}
                    onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Ingrese el tratamiento prescrito"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notas Adicionales
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows="2"
                    placeholder="Observaciones adicionales (opcional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Peso Medido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Weight className="w-4 h-4" />
                      Peso Medido (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.measured_weight}
                      onChange={(e) => setFormData({...formData, measured_weight: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ej: 5.5"
                    />
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ej: Cuenca"
                    />
                  </div>
                </div>

                {/* Próxima Visita */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Próxima Visita (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.next_visit_date}
                    onChange={(e) => setFormData({...formData, next_visit_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg disabled:bg-gray-400 transition-all"
                  >
                    {loading ? 'Guardando...' : '💾 Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateMedicalRecord;
