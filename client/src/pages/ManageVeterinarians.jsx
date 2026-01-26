import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Stethoscope, MapPin } from 'lucide-react';
import StarRating from '../components/StarRating';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const loadUser = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  const fetchVeterinarians = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const vets = res.data.veterinarians || [];

      // ⭐ ordenar por mejor calificado
      vets.sort((a, b) => Number(b.average_rating) - Number(a.average_rating));

      setVeterinarians(vets);
    } catch (error) {
      console.error('Error cargando veterinarios:', error);
      toast.error('Error cargando veterinarios');
    }
  }, [API_URL]);

  useEffect(() => {
    loadUser();
    fetchVeterinarians();
  }, [fetchVeterinarians]);

  // ============================
  // VALIDACIONES
  // ============================

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'name') {
      if (value.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';
      else delete newErrors.name;
    }

    if (name === 'phone') {
      if (value && !/^[0-9]{10}$/.test(value)) newErrors.phone = 'Debe tener 10 dígitos';
      else delete newErrors.phone;
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) newErrors.email = 'Email inválido';
      else delete newErrors.email;
    }

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
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Debe tener 10 dígitos';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Email inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================
  // CRUD
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Corrige los errores del formulario');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        await axios.put(`${API_URL}/veterinarians/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario actualizado');
      } else {
        await axios.post(`${API_URL}/veterinarians`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario creado');
      }

      setFormData({ name: '', specialty: '', phone: '', email: '' });
      setErrors({});
      setEditingId(null);
      setShowForm(false);
      fetchVeterinarians();
    } catch (error) {
      console.error('Error guardando veterinario:', error);
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
      email: vet.email || ''
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
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar veterinario');
    }
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="px-8 py-5 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-900" />
            <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
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

                  <input name="name" value={formData.name} onChange={handleChange}
                    placeholder="Nombre completo"
                    className="w-full border p-2.5 rounded-xl" />

                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

                  <input name="specialty" value={formData.specialty} onChange={handleChange}
                    placeholder="Especialidad"
                    className="w-full border p-2.5 rounded-xl" />

                  <input name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="Teléfono"
                    className="w-full border p-2.5 rounded-xl" />

                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

                  <input name="email" value={formData.email} onChange={handleChange}
                    placeholder="Email"
                    className="w-full border p-2.5 rounded-xl" />

                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

                  <button disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold">
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>

                </form>
              </div>
            )}

            <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {veterinarians.map(vet => (
                  <div key={vet.id} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100">

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{vet.name}</h3>

                    {/* ⭐ ESTRELLAS */}
                    <StarRating
                      value={Number(vet.average_rating || 0)}
                      total={vet.total_ratings || 0}
                    />

                    <div className="space-y-1 text-sm text-gray-600 mt-2 mb-4">
                      {vet.specialty && <p>🩺 {vet.specialty}</p>}
                      {vet.phone && <p>📞 {vet.phone}</p>}
                      {vet.email && <p>📧 {vet.email}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(vet)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">
                        ✏️ Editar
                      </button>
                      <button onClick={() => handleDelete(vet.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700">
                        🗑️ Eliminar
                      </button>
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
