import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Stethoscope, MapPin, Building2 } from 'lucide-react';
import StarRating from '../components/StarRating';

const ManageVeterinarians = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [veterinarians, setVeterinarians] = useState([]);
  const [clinics, setClinics] = useState([]); 
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    clinic_id: ''
  });
  
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const loadUser = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  // ✅ CORRECCIÓN AQUÍ: Agregamos "/api" a la ruta
  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/public/clinics`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data || []);
    } catch (error) {
      console.error('Error cargando clínicas:', error);
      // No mostramos toast de error para no saturar si falla silenciosamente
    }
  }, [API_URL]);

  const fetchVeterinarians = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians`, { // Esta ruta ya tiene /api en tu configuración de axios global o backend?
        // Si tu backend monta todo bajo /api, asegúrate de que esta ruta también sea correcta.
        // Asumo que '/veterinarians' está montado en app.use('/api/veterinarians', ...)
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Si la respuesta viene directa o anidada
      const vets = res.data.veterinarians || res.data || [];
      vets.sort((a, b) => Number(b.average_rating) - Number(a.average_rating));
      setVeterinarians(vets);
    } catch (error) {
      console.error('Error cargando veterinarios:', error);
      toast.error('Error cargando lista de veterinarios');
    }
  }, [API_URL]);

  useEffect(() => {
    loadUser();
    fetchClinics();
    fetchVeterinarians();
  }, [fetchVeterinarians, fetchClinics]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'name' && value.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';
    else if (name === 'name') delete newErrors.name;
    
    if (name === 'phone' && value && !/^[0-9]{10}$/.test(value)) newErrors.phone = '10 dígitos requeridos';
    else if (name === 'phone') delete newErrors.phone;

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.name.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error('Corrige los errores');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Preparar payload (clinic_id vacío envía null o "independent")
      const payload = {
        ...formData,
        clinic_id: formData.clinic_id || 'independent'
      };

      if (editingId) {
        await axios.put(`${API_URL}/veterinarians/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario actualizado');
      } else {
        await axios.post(`${API_URL}/veterinarians`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario creado');
      }

      setFormData({ name: '', specialty: '', phone: '', email: '', clinic_id: '' });
      setErrors({});
      setEditingId(null);
      setShowForm(false);
      fetchVeterinarians();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar veterinario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vet) => {
    setFormData({
      name: vet.name,
      specialty: vet.specialty || '',
      phone: vet.phone || '',
      email: vet.email || '',
      clinic_id: vet.clinic_id || '' 
    });
    setErrors({});
    setEditingId(vet.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar veterinario?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/veterinarians/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Veterinario eliminado');
      fetchVeterinarians();
    } catch  {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="px-4 lg:px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Veterinarios</h1>
              <p className="text-gray-600">Vincula doctores a tus clínicas registradas</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ name: '', specialty: '', phone: '', email: '', clinic_id: '' });
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"
            >
              {showForm ? 'Cancelar' : 'Nuevo Veterinario'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {showForm && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {editingId ? 'Editar Veterinario' : 'Nuevo Veterinario'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* SELECTOR DE CLÍNICA */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lugar de Trabajo</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 text-gray-400" size={18}/>
                      <select
                        name="clinic_id"
                        value={formData.clinic_id}
                        onChange={handleChange}
                        className="w-full pl-10 border p-2.5 rounded-xl bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Seleccione lugar --</option>
                        <option value="independent">🏠 Independiente / A Domicilio</option>
                        {clinics.length > 0 ? (
                          clinics.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        ) : (
                          <option disabled>No hay clínicas registradas</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre completo *" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

                  <input name="specialty" value={formData.specialty} onChange={handleChange} placeholder="Especialidad" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />

                  <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </form>
              </div>
            )}

            <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {veterinarians.map(vet => (
                  <div key={vet.id} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100 relative overflow-hidden">
                    {/* Badge de Clínica */}
                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${vet.clinic_name ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {vet.clinic_name || 'Independiente'}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1 mt-4">{vet.name}</h3>
                    <StarRating value={Number(vet.average_rating || 0)} total={vet.total_ratings || 0} />
                    
                    <div className="space-y-1 text-sm text-gray-600 mt-3 mb-4">
                      {vet.specialty && <p className="flex items-center gap-2">🩺 {vet.specialty}</p>}
                      {vet.phone && <p className="flex items-center gap-2">📞 {vet.phone}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(vet)} className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-xl hover:bg-blue-100 font-bold transition-colors">Editar</button>
                      <button onClick={() => handleDelete(vet.id)} className="flex-1 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-xl hover:bg-red-100 font-bold transition-colors">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageVeterinarians;