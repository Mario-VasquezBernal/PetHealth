import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getClinics, createClinic, deleteClinic } from '../dataManager';
import { X, Building2, MapPin, Phone, Trash2, Plus, Navigation, Loader } from 'lucide-react';

const ClinicManagement = ({ onClose }) => {
  const [clinics, setClinics] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', phone: '', city: '', country: '' });
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const c = await getClinics();
      setClinics(Array.isArray(c) ? c : []);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando clínicas');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA para obtener ubicación
  const getLocationAddress = async () => {
    setGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Tu navegador no soporta geolocalización');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('PERMISSION_DENIED'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('POSITION_UNAVAILABLE'));
                break;
              case error.TIMEOUT:
                reject(new Error('TIMEOUT'));
                break;
              default:
                reject(new Error('ERROR_UNKNOWN'));
                break;
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;

      toast.info('📍 Ubicación obtenida, convirtiendo a dirección...');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'PetHealthApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al convertir coordenadas a dirección');
      }

      const data = await response.json();
      const address = data.address;

      const formattedAddress = [
        address.road || address.street || address.pedestrian,
        address.house_number,
        address.neighbourhood || address.suburb || address.quarter,
      ]
        .filter(Boolean)
        .join(', ');

      setForm((prev) => ({
        ...prev,
        address: formattedAddress || data.display_name,
        city: address.city || address.town || address.village || address.municipality || '',
        country: address.country || '',
      }));

      toast.success('✅ ¡Ubicación obtenida correctamente!');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);

      if (error.message === 'PERMISSION_DENIED') {
        toast.error('❌ Permiso denegado. Habilita la ubicación en tu navegador.', {
          autoClose: 5000,
        });
        setTimeout(() => {
          toast.info(
            '💡 Chrome: Click en el ícono 🔒 al lado de la URL → Permisos del sitio → Ubicación → Permitir',
            {
              autoClose: 8000,
            }
          );
        }, 1000);
      } else if (error.message === 'POSITION_UNAVAILABLE') {
        toast.error('❌ No se pudo determinar tu ubicación. ¿Tienes GPS/WiFi activado?');
      } else if (error.message === 'TIMEOUT') {
        toast.error('❌ Tiempo de espera agotado. Intenta de nuevo o ingresa la dirección manualmente.');
      } else {
        toast.error('❌ Error al obtener ubicación. Puedes escribir la dirección manualmente.');
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.warning('El nombre es obligatorio');

    try {
      await createClinic(form);
      toast.success('Clínica registrada ✅');
      setForm({ name: '', address: '', phone: '', city: '', country: '' });

      const updated = await getClinics();
      setClinics(Array.isArray(updated) ? updated : []);
    } catch (error) {
      console.error(error);
      toast.error('Error al crear clínica');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta clínica?')) {
      try {
        await deleteClinic(id);
        toast.info('Clínica eliminada 🗑️');

        const updated = await getClinics();
        setClinics(Array.isArray(updated) ? updated : []);
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-primary-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center shadow-md shadow-primary-200/60">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900">Gestionar Clínicas</h2>
              <p className="text-sm text-primary-600">Directorio de centros veterinarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulario */}
        <div className="bg-gradient-to-br from-primary-50 to-white px-6 py-5 rounded-3xl mx-4 mb-6 border border-primary-200 shadow-md shadow-primary-200/70">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-primary-900">Nueva Clínica</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Nombre de la clínica *
              </label>
              <input
                required
                placeholder="Ej: Veterinaria San Francisco"
                className="w-full border border-primary-200 p-2.5 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* ✅ BOTÓN DE GEOLOCALIZACIÓN */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Ubicación
              </label>
              <button
                type="button"
                onClick={getLocationAddress}
                disabled={gettingLocation}
                className={`w-full text-white font-semibold py-3 rounded-2xl border-none cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all ${
                  gettingLocation
                    ? 'bg-gradient-to-r from-blue-300 to-blue-400 opacity-80 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5'
                }`}
              >
                {gettingLocation ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Obteniendo ubicación...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    <span>📍 Obtener mi ubicación actual</span>
                  </>
                )}
              </button>

              <div className="text-center text-sm text-primary-600 mb-3 mt-2">
                <p>O ingresa la dirección manualmente ⬇️</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <input
                  placeholder="Calle Principal #123"
                  className="w-full border border-primary-200 p-2.5 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    placeholder="Cuenca"
                    className="w-full border border-primary-200 p-2.5 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    País
                  </label>
                  <input
                    placeholder="Ecuador"
                    className="w-full border border-primary-200 p-2.5 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="w-full border border-primary-200 p-2.5 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Guardar Clínica
            </button>
          </form>
        </div>

        {/* Lista de Clínicas */}
        <div className="px-6 pb-6">
          <h3 className="font-bold text-primary-900 mb-4 flex items-center justify-between">
            <span>Directorio de Clínicas</span>
            <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
              {clinics.length} {clinics.length === 1 ? 'clínica' : 'clínicas'}
            </span>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-primary-500 text-center py-8">Cargando...</p>
            ) : clinics.length === 0 ? (
              <div className="text-center py-8 bg-primary-50 rounded-2xl border border-dashed border-primary-300 shadow-inner">
                <Building2 className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                <p className="text-primary-600">No hay clínicas registradas</p>
              </div>
            ) : (
              clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="border border-primary-100 p-4 rounded-2xl flex justify-between items-start bg-white/80 hover:bg-primary-50 transition-colors group shadow-md shadow-primary-100/80"
                >
                  <div className="flex gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0 shadow-sm">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary-900 mb-1">{clinic.name}</p>
                      {clinic.address && (
                        <p className="text-sm text-primary-600 flex items-start gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {clinic.address}
                          {clinic.city && `, ${clinic.city}`}
                          {clinic.country && `, ${clinic.country}`}
                        </p>
                      )}
                      {clinic.phone && (
                        <p className="text-sm text-primary-600 flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />
                          {clinic.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(clinic.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                    title="Eliminar clínica"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-primary-100 px-6 py-4 bg-primary-50/60 rounded-b-3xl">
          <div className="text-right">
            <button
              onClick={onClose}
              className="bg-primary-100 text-primary-700 px-6 py-2.5 rounded-xl hover:bg-primary-200 font-medium transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicManagement;
