import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ClinicsMap from "../components/ClinicsMap";

// Fix iconos Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Captura click en mapa
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]}>
      <Popup>📍 Ubicación seleccionada</Popup>
    </Marker>
  ) : null;
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
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';
  const defaultCenter = [-2.9001, -79.0059];

  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClinics(res.data.clinics || []);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL]);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch {}
    };
    load();
    fetchClinics();
  }, [fetchClinics]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success('Clínica guardada');
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        phone: '',
        latitude: '',
        longitude: '',
      });
      setMapPosition(null);
      fetchClinics();
    } catch {
      toast.error('Error al guardar clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setFormData(clinic);
    if (clinic.latitude && clinic.longitude) {
      setMapPosition({
        lat: parseFloat(clinic.latitude),
        lng: parseFloat(clinic.longitude),
      });
    }
    setEditingId(clinic.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar clínica?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clinics/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchClinics();
      toast.success('Clínica eliminada');
    } catch {
      toast.error('Error eliminando');
    }
  };

  useEffect(() => {
    if (mapPosition) {
      setFormData((prev) => ({
        ...prev,
        latitude: mapPosition.lat.toFixed(6),
        longitude: mapPosition.lng.toFixed(6),
      }));
    }
  }, [mapPosition]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 lg:px-8 py-8">

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Gestión de Clínicas</h1>
              <p className="text-gray-600">Administra las clínicas veterinarias</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-600 text-white px-5 py-2 rounded-xl"
            >
              {showForm ? 'Cancelar' : 'Nueva Clínica'}
            </button>
          </div>

          {/* 🗺️ MAPA GENERAL */}
          <ClinicsMap clinics={clinics} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* FORMULARIO */}
            {showForm && (
              <div className="bg-white p-6 rounded-xl shadow">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input placeholder="Nombre" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border p-2 rounded" />

                  <input placeholder="Ciudad" value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border p-2 rounded" />

                  <input placeholder="Dirección" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border p-2 rounded" />

                  <div className="h-56 rounded overflow-hidden">
                    <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                  </div>

                  <button type="submit" disabled={loading}
                    className="bg-emerald-600 text-white w-full py-2 rounded">
                    Guardar
                  </button>
                </form>
              </div>
            )}

            {/* LISTA */}
            <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white p-4 rounded-xl shadow">

                    <h3 className="font-bold mb-2">{clinic.name}</h3>
                    <p className="text-sm text-gray-600">{clinic.address}</p>
                    <p className="text-sm text-gray-600">{clinic.city}</p>

                    {clinic.latitude && clinic.longitude && (
                      <>
                        <div className="h-32 mt-2 rounded overflow-hidden">
                          <MapContainer
                            center={[clinic.latitude, clinic.longitude]}
                            zoom={15}
                            style={{ height: '100%' }}
                            zoomControl={false}
                            dragging={false}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[clinic.latitude, clinic.longitude]} />
                          </MapContainer>
                        </div>

                        {/* BOTÓN NAVEGACIÓN */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-center bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                        >
                          🧭 Cómo llegar
                        </a>
                      </>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleEdit(clinic)}
                        className="flex-1 bg-emerald-600 text-white rounded py-1">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(clinic.id)}
                        className="flex-1 bg-red-600 text-white rounded py-1">
                        Eliminar
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

export default ManageClinics;
