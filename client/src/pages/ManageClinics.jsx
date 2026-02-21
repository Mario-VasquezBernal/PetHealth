// ============================================
// PAGES/MANAGECLINICS.JSX
// ============================================
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Building2, MapPin, Phone, Pencil, Trash2, Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const clinicIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
});

const newIcon = new L.Icon({
  iconUrl:    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
});

const isValidCoord = (lat, lng) => {
  const la = parseFloat(lat), lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) && la !== 0 && lo !== 0;
};

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={newIcon}>
      <Popup>📍 Nueva ubicación seleccionada</Popup>
    </Marker>
  ) : null;
};

const ManageClinics = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '', latitude: '', longitude: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';
  const defaultCenter = [-2.9001, -79.0059];

  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data.clinics || []);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL]);

  useEffect(() => {
    getUserProfile().then(setUser).catch(console.error);
    fetchClinics();
  }, [fetchClinics]);

  useEffect(() => {
    if (mapPosition) {
      setFormData(prev => ({
        ...prev,
        latitude:  mapPosition.lat.toFixed(6),
        longitude: mapPosition.lng.toFixed(6),
      }));
    }
  }, [mapPosition]);

  // VALIDACIONES
  const validateField = (name, value) => {
    const e = { ...errors };

    if (name === 'name') {
      if (!value.trim()) e.name = 'El nombre es obligatorio';
      else if (value.trim().length < 3) e.name = 'Mínimo 3 caracteres';
      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,'-]+$/.test(value)) e.name = 'Solo letras, números y puntuación básica';
      else delete e.name;
    }

    if (name === 'phone') {
      if (value && !/^\d{7,15}$/.test(value)) e.phone = 'Solo números, entre 7 y 15 dígitos';
      else delete e.phone;
    }

    if (name === 'city') {
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) e.city = 'Solo letras';
      else delete e.city;
    }

    if (name === 'address') {
      if (value && value.trim().length < 5) e.address = 'Dirección muy corta';
      else delete e.address;
    }

    setErrors(e);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone' && value && !/^\d*$/.test(value)) return;

    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateForm = () => {
    const e = {};

    if (!formData.name.trim()) e.name = 'El nombre es obligatorio';
    else if (formData.name.trim().length < 3) e.name = 'Mínimo 3 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,'-]+$/.test(formData.name)) e.name = 'Solo letras, números y puntuación básica';

    if (formData.phone && !/^\d{7,15}$/.test(formData.phone)) e.phone = 'Solo números, entre 7 y 15 dígitos';

    if (formData.city && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.city)) e.city = 'Solo letras';

    if (formData.address && formData.address.trim().length < 5) e.address = 'Dirección muy corta';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      phone: '',
      latitude: '',
      longitude: ''
    });
    setMapPosition(null);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Corrige los errores antes de continuar');
      return;
    }

    if (!mapPosition) {
      toast.error('📍 Haz click en el mapa para seleccionar la ubicación');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('✅ Clínica actualizada');
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('✅ Clínica creada');
      }
      resetForm();
      fetchClinics();
    } catch (err) {
      console.error(err);
      toast.error('❌ Error al guardar clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setFormData({
      id: clinic.id,
      name: clinic.name || '',
      address: clinic.address || '',
      city: clinic.city || '',
      phone: clinic.phone || '',
      latitude: clinic.latitude || '',
      longitude: clinic.longitude || '',
    });
    setErrors({});
    if (isValidCoord(clinic.latitude, clinic.longitude)) {
      setMapPosition({
        lat: parseFloat(clinic.latitude),
        lng: parseFloat(clinic.longitude)
      });
    } else {
      setMapPosition(null);
    }
    setEditingId(clinic.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta clínica? Esta acción no se puede deshacer.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clinics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClinics();
      toast.success('Clínica eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error eliminando clínica');
    }
  };

  const clinicsWithCoords = clinics.filter(c => isValidCoord(c.latitude, c.longitude));
  const mainMapCenter = clinicsWithCoords.length > 0
    ? [parseFloat(clinicsWithCoords[0].latitude), parseFloat(clinicsWithCoords[0].longitude)]
    : defaultCenter;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 lg:px-8 py-6">

          {/* HEADER RESPONSIVE */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Gestión de Clínicas</h1>
                <p className="text-sm text-gray-500">Administra las clínicas veterinarias</p>
              </div>
            </div>

            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl font-bold transition-colors text-sm ${
                showForm
                  ? 'bg-gray-400 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {showForm ? (
                <>
                  <X size={16} /> Cancelar
                </>
              ) : (
                <>
                  <Plus size={16} /> Nueva Clínica
                </>
              )}
            </button>
          </div>

          {/* MAPA GENERAL SIEMPRE VISIBLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 mb-6">
            <h2 className="text-sm font-black text-gray-800 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600" />
              Mapa de clínicas registradas
            </h2>
            <div className="w-full h-60 sm:h-72 rounded-2xl overflow-hidden border border-emerald-100">
              <MapContainer
                center={mainMapCenter}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {clinicsWithCoords.map(c => (
                  <Marker
                    key={c.id}
                    position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                    icon={clinicIcon}
                  >
                    <Popup>
                      <strong>{c.name}</strong>
                      <br />
                      {c.address}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* FORMULARIO */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-5 mb-6">
              <h2 className="text-lg font-black text-gray-900 mb-4">
                {editingId ? '✏️ Editar Clínica' : '🏥 Nueva Clínica'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-1 block">
                      Nombre *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="Nombre de la clínica"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">⚠ {errors.name}</p>
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-1 block">
                      Ciudad
                    </label>
                    <input
                      name="city"
                      placeholder="Cuenca"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">⚠ {errors.city}</p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-1 block">
                      Dirección
                    </label>
                    <input
                      name="address"
                      placeholder="Av. Principal 123"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">⚠ {errors.address}</p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-1 block">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        name="phone"
                        placeholder="0991234567"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={15}
                        inputMode="numeric"
                        className={`w-full border rounded-xl pl-9 pr-3 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">⚠ {errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* MAPA DEL FORMULARIO (SELECCIÓN) */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase mb-1 block">
                    Ubicación en el mapa *
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Toca en el mapa para seleccionar la ubicación de la clínica.
                  </p>
                  <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-emerald-100">
                    <MapContainer
                      center={mapPosition || mainMapCenter}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {clinicsWithCoords.map(c => (
                        <Marker
                          key={c.id}
                          position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                          icon={clinicIcon}
                        >
                          <Popup>
                            <strong>{c.name}</strong>
                            <br />
                            {c.address}
                          </Popup>
                        </Marker>
                      ))}
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block">
                        Latitud
                      </label>
                      <input
                        name="latitude"
                        value={formData.latitude}
                        readOnly
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block">
                        Longitud
                      </label>
                      <input
                        name="longitude"
                        value={formData.longitude}
                        readOnly
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black disabled:opacity-60"
                  >
                    {loading ? 'Guardando...' : editingId ? 'Actualizar Clínica' : 'Crear Clínica'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LISTADO DE CLÍNICAS */}
          <section>
            <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600" />
              Clínicas registradas
            </h2>

            {clinics.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no has registrado clínicas. Usa el botón "Nueva Clínica" para agregar una.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinics.map(clinic => (
                  <div
                    key={clinic.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-emerald-600 w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-black text-gray-900 line-clamp-2">
                          {clinic.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={13} className="text-gray-400" />
                          <span className="line-clamp-2">
                            {clinic.address || 'Sin dirección registrada'}
                          </span>
                        </p>
                        {clinic.city && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ciudad: <span className="font-semibold">{clinic.city}</span>
                          </p>
                        )}
                        {clinic.phone && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Phone size={13} className="text-gray-400" />
                            <span>{clinic.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(clinic)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold hover:bg-emerald-100"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(clinic.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm font-semibold hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ManageClinics;
