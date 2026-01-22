import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Building2, MapPin } from 'lucide-react';

const ManageClinics = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    latitude: '',
    longitude: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  useEffect(() => {
    loadUser();
    fetchClinics();
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

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClinics(res.data.clinics || []);
    } catch (error) {
      console.error('Error cargando clínicas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('✅ Clínica actualizada exitosamente');
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('✅ Clínica creada exitosamente');
      }

      setFormData({
        name: '',
        address: '',
        city: '',
        phone: '',
        latitude: '',
        longitude: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchClinics();
    } catch (error) {
      console.error('Error guardando clínica:', error);
      alert('❌ Error al guardar la clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setFormData({
      name: clinic.name,
      address: clinic.address,
      city: clinic.city || '',
      phone: clinic.phone || '',
      latitude: clinic.latitude || '',
      longitude: clinic.longitude || '',
    });
    setEditingId(clinic.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta clínica?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clinics/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('✅ Clínica eliminada exitosamente');
      fetchClinics();
    } catch (error) {
      console.error('Error eliminando clínica:', error);
      alert('❌ Error al eliminar la clínica');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 flex">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={null} />

        {/* Header Desktop */}
        <div className="hidden lg:block bg-white/80 border-b border-primary-100 backdrop-blur-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-700" strokeWidth={2} />
              <span className="text-sm font-medium text-primary-800">Cuenca, Ecuador</span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/40">
                <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Clínicas</h1>
                <p className="text-gray-600">Administra las clínicas veterinarias</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    address: '',
                    city: '',
                    phone: '',
                    latitude: '',
                    longitude: '',
                  });
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-medium shadow-lg shadow-emerald-400/40 hidden lg:block transition-all hover:-translate-y-0.5"
              >
                {showForm ? '❌ Cancelar' : '➕ Nueva Clínica'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUMNA 1: FORMULARIO */}
            {showForm && (
              <div className="bg-white/95 p-6 rounded-3xl shadow-xl shadow-emerald-100 border border-emerald-100 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {editingId ? '✏️ Editar Clínica' : '➕ Nueva Clínica'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Clínica *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                      placeholder="Ej: Clínica Veterinaria El Bosque"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                      placeholder="Ej: Cuenca"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                      placeholder="Ej: Av. González Suárez 123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                      placeholder="Ej: 07-1234567"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            latitude: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                        placeholder="-2.9001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            longitude: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-emerald-100 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none shadow-sm"
                        placeholder="-79.0059"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-400/50 disabled:bg-gray-400 disabled:shadow-none transition-all hover:-translate-y-0.5"
                  >
                    {loading
                      ? 'Guardando...'
                      : editingId
                      ? '💾 Actualizar Clínica'
                      : '➕ Crear Clínica'}
                  </button>
                </form>
              </div>
            )}

            {/* COLUMNA 2: LISTA DE CLÍNICAS */}
            <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="bg-white/95 rounded-3xl shadow-md shadow-primary-100/80 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all border border-primary-100/70"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="inline-flex w-8 h-8 rounded-2xl bg-primary-100 items-center justify-center text-primary-700">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <span>{clinic.name}</span>
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>📍 {clinic.address}</p>
                      <p>🏙️ {clinic.city || 'Sin ciudad'}</p>
                      {clinic.phone && <p>📞 {clinic.phone}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(clinic)}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 text-sm rounded-2xl hover:bg-gray-200 font-medium shadow-md shadow-gray-300/60 transition-all hover:-translate-y-0.5"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(clinic.id)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-2xl hover:from-emerald-600 hover:to-emerald-700 font-medium shadow-lg shadow-emerald-400/40 transition-all hover:-translate-y-0.5"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {clinics.length === 0 && (
                <div className="mt-10 text-center py-12 bg-white/95 rounded-3xl shadow-lg shadow-primary-100/80 border border-primary-100 max-w-xl mx-auto">
                  <Building2 className="w-16 h-16 text-primary-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-700 mb-2">No hay clínicas registradas</p>
                  <p className="text-sm text-gray-500">
                    Crea tu primera clínica haciendo clic en{' '}
                    <span className="font-semibold">“Nueva Clínica”</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageClinics;
