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

// Fix iconos Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono verde para clínicas existentes
const clinicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Icono azul para nueva ubicación seleccionada
const newIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const isValidCoord = (lat, lng) => {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) && la !== 0 && lo !== 0;
};

// Captura click en el mapa del formulario
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? (
    <Marker position={[position.lat, position.lng]} icon={newIcon}>
      <Popup>📍 Nueva ubicación seleccionada</Popup>
    </Marker>
  ) : null;
};

const ManageClinics = () => {
  const [user, setUser]               = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinics, setClinics]         = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '',
    latitude: '', longitude: ''
  });

  const API_URL      = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';
  const defaultCenter = [-2.9001, -79.0059]; // Cuenca

  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.get(`${API_URL}/clinics`, {
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

  // Sincroniza coordenadas del mapa con el formulario
  useEffect(() => {
    if (mapPosition) {
      setFormData(prev => ({
        ...prev,
        latitude:  mapPosition.lat.toFixed(6),
        longitude: mapPosition.lng.toFixed(6),
      }));
    }
  }, [mapPosition]);

  const resetForm = () => {
    setFormData({ name: '', address: '', city: '', phone: '', latitude: '', longitude: '' });
    setMapPosition(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mapPosition) {
      toast.error('Haz click en el mapa para seleccionar la ubicación de la clínica');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Clínica actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Clínica creada correctamente');
      }
      resetForm();
      fetchClinics();
    } catch {
      toast.error('Error al guardar clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setFormData(clinic);
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
    } catch {
      toast.error('Error eliminando clínica');
    }
  };

  // Centro del mapa principal — si hay clínicas con coords, centra en la primera
  const clinicsWithCoords = clinics.filter(c => isValidCoord(c.latitude, c.longitude));
  const mainMapCenter = clinicsWithCoords.length > 0
    ? [parseFloat(clinicsWithCoords[0].latitude), parseFloat(clinicsWithCoords[0].longitude)]
    : defaultCenter;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Gestión de Clínicas</h1>
              <p className="text-gray-600">Administra las clínicas veterinarias</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-colors ${
                showForm ? 'bg-gray-400 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva Clínica</>}
            </button>
          </div>

          {/* Formulario nueva/editar clínica */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingId ? '✏️ Editar Clínica' : '🏥 Nueva Clínica'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre *</label>
                    <input
                      required placeholder="Nombre de la clínica"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Ciudad</label>
                    <input
                      placeholder="Cuenca"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Dirección</label>
                    <input
                      placeholder="Av. Principal 123"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono</label>
                    <input
                      placeholder="099 123 4567"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                    />
                  </div>
                </div>

                {/* Mapa interactivo para seleccionar ubicación */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                    <MapPin size={13} className="text-emerald-600" />
                    Ubicación — haz click en el mapa para marcar la clínica *
                  </label>
                  <div className="h-64 rounded-xl overflow-hidden border-2 border-dashed border-emerald-300">
                    <MapContainer
                      center={mapPosition ? [mapPosition.lat, mapPosition.lng] : defaultCenter}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                  </div>
                  {mapPosition ? (
                    <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      Ubicación seleccionada: {mapPosition.lat.toFixed(5)}, {mapPosition.lng.toFixed(5)}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">⚠️ Haz click en el mapa para seleccionar la ubicación</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Guardando...' : editingId ? 'Actualizar Clínica' : 'Crear Clínica'}
                </button>
              </form>
            </div>
          )}

          {/* Mapa principal con todas las clínicas */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" />
                Clínicas registradas en el mapa
              </h2>
              <span className="text-sm text-gray-500">
                {clinicsWithCoords.length} de {clinics.length} con ubicación
              </span>
            </div>
            <div style={{ height: '380px' }}>
              <MapContainer center={mainMapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {clinicsWithCoords.map(clinic => (
                  <Marker
                    key={clinic.id}
                    position={[parseFloat(clinic.latitude), parseFloat(clinic.longitude)]}
                    icon={clinicIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-emerald-800 text-base">{clinic.name}</p>
                        {clinic.address && <p className="text-gray-600 mt-1">📍 {clinic.address}</p>}
                        {clinic.city    && <p className="text-gray-600">🏙️ {clinic.city}</p>}
                        {clinic.phone   && <p className="text-gray-600">📞 {clinic.phone}</p>}
                        <a
                          href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-2 block text-center bg-emerald-600 text-white rounded px-3 py-1 text-xs"
                        >
                          Abrir en Google Maps
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Cards de clínicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay clínicas registradas</p>
              </div>
            ) : clinics.map(clinic => (
              <div key={clinic.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  {isValidCoord(clinic.latitude, clinic.longitude) ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      📍 Con ubicación
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                      Sin ubicación
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-1">{clinic.name}</h3>

                {clinic.city    && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12}/> {clinic.city}</p>}
                {clinic.address && <p className="text-sm text-gray-500">{clinic.address}</p>}
                {clinic.phone   && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12}/> {clinic.phone}</p>}

                {isValidCoord(clinic.latitude, clinic.longitude) && (
                  <a
                    href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-3 block text-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg py-2 text-xs font-medium transition-colors"
                  >
                    🗺️ Ver en Google Maps
                  </a>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(clinic)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(clinic.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
};

export default ManageClinics;
