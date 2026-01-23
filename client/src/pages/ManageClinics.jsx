import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Building2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para capturar clicks en el mapa
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}>
      <Popup>📍 Ubicación seleccionada</Popup>
    </Marker>
  );
};

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
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  // Posición por defecto (Cuenca, Ecuador)
  const defaultCenter = [-2.9001, -79.0059];

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

  // Validación en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name': {
        if (value.trim().length < 10) {
          newErrors.name = 'Mínimo 10 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      }

      case 'city': {
        if (value.trim().length < 2) {
          newErrors.city = 'Mínimo 2 caracteres';
        } else {
          delete newErrors.city;
        }
        break;
      }

      case 'phone': {
        if (value && !/^[0-9]{10}$/.test(value)) {
          newErrors.phone = 'Debe tener exactamente 10 dígitos';
        } else {
          delete newErrors.phone;
        }
        break;
      }

      case 'latitude': {
        const lat = parseFloat(value);
        if (value && (isNaN(lat) || lat < -90 || lat > 90)) {
          newErrors.latitude = 'Debe estar entre -90 y 90';
        } else {
          delete newErrors.latitude;
        }
        break;
      }

      case 'longitude': {
        const lng = parseFloat(value);
        if (value && (isNaN(lng) || lng < -180 || lng > 180)) {
          newErrors.longitude = 'Debe estar entre -180 y 180';
        } else {
          delete newErrors.longitude;
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
    if (formData.name.trim().length < 10) {
      newErrors.name = 'El nombre debe tener mínimo 10 caracteres';
    }

    // Ciudad
    if (formData.city.trim().length < 2) {
      newErrors.city = 'La ciudad debe tener mínimo 2 caracteres';
    }

    // Dirección
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }

    // Teléfono (opcional pero si se llena debe ser válido)
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos';
    }

    // Coordenadas (si una existe, debe existir la otra)
    if ((formData.latitude && !formData.longitude) || (!formData.latitude && formData.longitude)) {
      newErrors.coordinates = 'Debes proporcionar latitud y longitud juntas';
    }

    // Validar rangos de coordenadas
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitud debe estar entre -90 y 90';
      }
    }

    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitud debe estar entre -180 y 180';
      }
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
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('✅ Clínica actualizada exitosamente');
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('✅ Clínica creada exitosamente');
      }

      setFormData({
        name: '',
        address: '',
        city: '',
        phone: '',
        latitude: '',
        longitude: '',
      });
      setErrors({});
      setMapPosition(null);
      setEditingId(null);
      setShowForm(false);
      fetchClinics();
    } catch (error) {
      console.error('Error guardando clínica:', error);
      toast.error(error.response?.data?.error || '❌ Error al guardar la clínica');
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
    
    // Si tiene coordenadas, establecer la posición del mapa
    if (clinic.latitude && clinic.longitude) {
      setMapPosition({
        lat: parseFloat(clinic.latitude),
        lng: parseFloat(clinic.longitude),
      });
    } else {
      setMapPosition(null);
    }

    setErrors({});
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
      toast.success('✅ Clínica eliminada exitosamente');
      fetchClinics();
    } catch (error) {
      console.error('Error eliminando clínica:', error);
      toast.error('❌ Error al eliminar la clínica');
    }
  };

  // Actualizar coordenadas cuando se hace click en el mapa
  useEffect(() => {
    if (mapPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: mapPosition.lat.toFixed(6),
        longitude: mapPosition.lng.toFixed(6),
      }));
    }
  }, [mapPosition]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={null} />

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
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                  setErrors({});
                  setMapPosition(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-medium shadow-lg hidden lg:block"
              >
                {showForm ? '❌ Cancelar' : '➕ Nueva Clínica'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUMNA 1: FORMULARIO */}
            {showForm && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {editingId ? '✏️ Editar Clínica' : '➕ Nueva Clínica'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Clínica *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      placeholder="Ej: Clínica Veterinaria El Bosque"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      placeholder="Ej: Cuenca"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      placeholder="Ej: Av. González Suárez 123"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
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
                      } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      placeholder="0987654321"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* MAPA INTERACTIVO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Ubicación en el mapa (Haz click para seleccionar)
                    </label>
                    <div className="h-64 rounded-xl overflow-hidden border-2 border-gray-300 shadow-md">
                      <MapContainer
                        center={mapPosition ? [mapPosition.lat, mapPosition.lng] : defaultCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                      </MapContainer>
                    </div>
                    {errors.coordinates && (
                      <p className="text-red-500 text-sm mt-1">{errors.coordinates}</p>
                    )}
                  </div>

                  {/* Coordenadas (solo lectura - se llenan automáticamente) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitud
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={formData.latitude}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                        placeholder="Auto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitud
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={formData.longitude}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                        placeholder="Auto"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold shadow-lg transition-all disabled:cursor-not-allowed"
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
                    className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="inline-flex w-8 h-8 rounded-xl bg-emerald-100 items-center justify-center text-emerald-700">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <span>{clinic.name}</span>
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>📍 {clinic.address}</p>
                      <p>🏙️ {clinic.city || 'Sin ciudad'}</p>
                      {clinic.phone && <p>📞 {clinic.phone}</p>}
                    </div>

                    {/* Mini-mapa si tiene coordenadas */}
                    {clinic.latitude && clinic.longitude && (
                      <div className="mb-4 h-40 rounded-xl overflow-hidden border border-gray-200">
                        <MapContainer
                          center={[parseFloat(clinic.latitude), parseFloat(clinic.longitude)]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={false}
                          dragging={false}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[parseFloat(clinic.latitude), parseFloat(clinic.longitude)]}>
                            <Popup>{clinic.name}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(clinic)}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(clinic.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>

                    {/* Botón para abrir en Google Maps */}
                    {clinic.latitude && clinic.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-center px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-xl hover:bg-blue-200 font-medium"
                      >
                        🗺️ Ver en Google Maps
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {clinics.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 mb-2">No hay clínicas registradas</p>
                  <p className="text-sm text-gray-400">
                    Crea tu primera clínica haciendo clic en "Nueva Clínica"
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
