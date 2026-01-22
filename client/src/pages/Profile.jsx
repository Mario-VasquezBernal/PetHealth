// ============================================
// PROFILE.JSX
// ============================================
// Página de perfil de usuario
// Muestra y permite editar información personal del usuario
// Campos editables: nombre, teléfono, dirección, ciudad, país
// Email es solo lectura (no se puede modificar)
// Carga datos del usuario al montar el componente
// Botón "Cancelar" recarga los datos originales descartando cambios
// Actualiza perfil en el servidor al guardar
// Incluye botón Cerrar Sesión dentro de Mi Perfil
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile, updateUserProfile } from '../dataManager';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home as HomeIcon,
  Globe,
  Save,
  X,
  LogOut
} from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      if (data) {
        setFormData(data);
        setUser(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await updateUserProfile(formData);
      setUser(formData);
      toast.success('¡Perfil actualizado con éxito! ✅');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el perfil ❌');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfile();
    toast.info('Cambios descartados');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Sesión cerrada');
    navigate('/login');
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

        <main className="px-4 lg:px-8 py-8 max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/40">
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600">Mantén tu información actualizada</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              
              {/* Header Card */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{formData.name || 'Usuario'}</h2>
                    <p className="text-emerald-100">{formData.email}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  
                  {/* Email (Solo lectura) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Correo Electrónico (No editable)
                    </label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      disabled 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Grid de campos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Nombre Completo */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nombre Completo
                      </label>
                      <input 
                        name="name" 
                        type="text" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Teléfono
                      </label>
                      <input 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Ej: 0999123456"
                      />
                    </div>

                    {/* Ciudad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Ciudad
                      </label>
                      <input 
                        name="city" 
                        type="text" 
                        value={formData.city} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Ej: Cuenca"
                      />
                    </div>

                    {/* Dirección */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <HomeIcon className="w-4 h-4" />
                        Dirección
                      </label>
                      <input 
                        name="address" 
                        type="text" 
                        value={formData.address} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Ej: Av. 10 de Agosto y Gran Colombia"
                      />
                    </div>
                    
                    {/* País */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        País
                      </label>
                      <input 
                        name="country" 
                        type="text" 
                        value={formData.country} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Ej: Ecuador"
                      />
                    </div>
                  </div>

                  {/* Botones Guardar/Cancelar */}
                  <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-gray-100">
                    <button 
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" strokeWidth={2} />
                      Cancelar
                    </button>

                    <button 
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-400/40 hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" strokeWidth={2} />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bloque Cerrar Sesión */}
                  <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-3 border border-emerald-500 text-emerald-600 rounded-2xl hover:bg-emerald-50 font-medium shadow-sm flex items-center gap-2 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
