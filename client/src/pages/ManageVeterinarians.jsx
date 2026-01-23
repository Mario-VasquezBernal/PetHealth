import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Stethoscope, MapPin } from 'lucide-react';


const ManageVeterinarians = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [veterinarians, setVeterinarians] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);


  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';


  useEffect(() => {
    loadUser();
    fetchVeterinarians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loadUser = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const fetchVeterinarians = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVeterinarians(res.data.veterinarians || []);
    } catch (error) {
      console.error('Error cargando veterinarios:', error);
    }
  };


  // Validación en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };


    switch (name) {
      case 'name': {
        if (value.trim().length < 3) {
          newErrors.name = 'Mínimo 3 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      }


      case 'phone': {
        if (value && !/^[0-9]{10}$/.test(value)) {
          newErrors.phone = 'Debe tener 10 dígitos';
        } else {
          delete newErrors.phone;
        }
        break;
      }


      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          newErrors.email = 'Email inválido';
        } else {
          delete newErrors.email;
        }
        break;
      }


      default:
        break;
    }


    setErrors(newErrors);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;


    // Solo números para teléfono
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }


    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };


  const validateForm = () => {
    const newErrors = {};


    // Nombre
    if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener mínimo 3 caracteres';
    }


    // Teléfono (opcional pero si se llena debe ser válido)
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    }


    // Email (opcional pero si se llena debe ser válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores del formulario');
      return;
    }


    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        await axios.put(`${API_URL}/veterinarians/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('✅ Veterinario actualizado exitosamente');
      } else {
        await axios.post(`${API_URL}/veterinarians`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('✅ Veterinario creado exitosamente');
      }


      setFormData({ name: '', specialty: '', phone: '', email: '' });
      setErrors({});
      setEditingId(null);
      setShowForm(false);
      fetchVeterinarians();
    } catch (error) {
      console.error('Error guardando veterinario:', error);
      toast.error(error.response?.data?.error || '❌ Error al guardar el veterinario');
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (vet) => {
    setFormData({
      name: vet.name,
      specialty: vet.specialty || '',
      phone: vet.phone || '',
      email: vet.email || ''
    });
    setErrors({});
    setEditingId(vet.id);
    setShowForm(true);
  };


  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este veterinario?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/veterinarians/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Veterinario eliminado exitosamente');
      fetchVeterinarians();
    } catch (error) {
      console.error('Error eliminando veterinario:', error);
      toast.error('❌ Error al eliminar el veterinario');
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Veterinarios</h1>
                <p className="text-gray-600">Administra los doctores veterinarios</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({ name: '', specialty: '', phone: '', email: '' });
                  setErrors({});
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg hidden lg:block"
              >
                {showForm ? '❌ Cancelar' : '➕ Nuevo Veterinario'}
              </button>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA 1: FORMULARIO */}
            {showForm && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {editingId ? '✏️ Editar Veterinario' : '➕ Nuevo Veterinario'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="Ej: Dr. Juan Pérez"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>


                  {/* Especialidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidad (Opcional)
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ej: Cirugía, Dermatología"
                    />
                  </div>


                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={`w-full px-4 py-2.5 border ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="0987654321"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>


                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="vet@clinica.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold shadow-lg transition-all disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : editingId ? '💾 Actualizar Veterinario' : '➕ Crear Veterinario'}
                  </button>
                </form>
              </div>
            )}


            {/* COLUMNA 2: LISTA DE VETERINARIOS */}
            <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {veterinarians.map((vet) => (
                  <div key={vet.id} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{vet.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      {vet.specialty && <p>🩺 {vet.specialty}</p>}
                      {vet.phone && <p>📞 {vet.phone}</p>}
                      {vet.email && <p>📧 {vet.email}</p>}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vet)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(vet.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>


              {veterinarians.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
                  <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 mb-2">No hay veterinarios registrados</p>
                  <p className="text-sm text-gray-400">Crea tu primer veterinario haciendo clic en "Nuevo Veterinario"</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


export default ManageVeterinarians;
