// ============================================
// HOME.JSX
// ============================================
// Dashboard principal de la aplicación
// Muestra tarjetas de todas las mascotas del usuario en una grid
// Estadísticas: Total de mascotas, perros y gatos
// Modal para agregar nueva mascota con formulario completo
// Sube imágenes a Cloudinary
// Botón rápido para navegar a agendar citas
// Permite eliminar mascotas con confirmación
// Filtros visuales (Todas, Perros, Gatos) - UI preparada pero sin funcionalidad
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PetCard from '../components/PetCard';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getPets, addPetToStorage, deletePetFromStorage, getUserProfile } from '../dataManager';
import { 
  PlusCircle, 
  Calendar, 
  Upload,
  X,
  Dog,
  Cat,
  Heart,
  MapPin,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const CLOUD_NAME = "dggoadwam"; 
  const UPLOAD_PRESET = "pethealth_app"; 

  const totalPets = pets.length;
  const totalDogs = pets.filter(p => p.species === 'Perro' || p.type === 'Perro').length;
  const totalCats = pets.filter(p => p.species === 'Gato' || p.type === 'Gato').length;

  const loadPets = async () => {
    try {
      setLoading(true);
      const [petsData, userData] = await Promise.all([
        getPets(),
        getUserProfile()
      ]);
      if (Array.isArray(petsData)) setPets(petsData);
      else setPets([]); 
      setUser(userData);
    } catch (error) {
      console.error(error); 
      toast.error("Error conectando con el servidor 🔴");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPets(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.info("Foto subida correctamente 📸");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddPet = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (uploading) return toast.warning("Espera a que suba la foto ⏳");

    const newPet = {
      name: form.name.value,
      type: form.species.value,
      species: form.species.value,
      breed: form.breed.value,
      birth_date: form.birth_date.value,
      gender: form.gender.value,
      weight: parseFloat(form.weight.value) || 0,
      photo_url: imageUrl, 
      is_sterilized: form.is_sterilized.checked,
      allergies: form.allergies.value
    };

    try {
      await addPetToStorage(newPet);
      await loadPets();
      setIsModalOpen(false);
      form.reset();
      setImageUrl('');
      toast.success("¡Mascota registrada! 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar (Revisa la consola)");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar mascota?')) {
      await deletePetFromStorage(id);
      await loadPets();
      toast.info("Mascota eliminada 🗑️");
    }
  };

  const handleCloseModal = () => { 
    setIsModalOpen(false); 
    setImageUrl(''); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <Sidebar 
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={() => setIsModalOpen(true)}
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 lg:ml-72">
        
        <MobileHeader 
          onMenuClick={() => setSidebarOpen(true)}
          onNewPet={() => setIsModalOpen(true)}
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
          
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mascotas</h1>
            <p className="text-gray-600">Gestiona el cuidado de tus compañeros</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mb-8">
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold">
              Todas
            </button>
            <button className="px-6 py-2.5 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 border border-gray-200">
              Perros
            </button>
            <button className="px-6 py-2.5 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 border border-gray-200">
              Gatos
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            
            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalPets}</h3>
              <p className="text-sm text-gray-600">Total Mascotas</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Dog className="w-6 h-6 text-orange-600" strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalDogs}</h3>
              <p className="text-sm text-gray-600">Perros</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Cat className="w-6 h-6 text-emerald-600" strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalCats}</h3>
              <p className="text-sm text-gray-600">Gatos</p>
            </div>
          </div>

          {/* Quick Action */}
          <div className="mb-10">
            <button 
              onClick={() => navigate('/appointments')}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl px-8 py-4 flex items-center justify-between sm:justify-start gap-4 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6" strokeWidth={2} />
                <span className="font-semibold">Agendar Nueva Cita</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
          </div>

          {/* Pets Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : pets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-gray-400" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay mascotas registradas</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primera mascota</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                <PlusCircle className="w-5 h-5" strokeWidth={2.5} />
                Agregar Mascota
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <PetCard key={pet.id} {...pet} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Registrar Mascota</h2>
                <p className="text-sm text-gray-600 mt-1">Completa la información</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="p-6 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input 
                      required 
                      name="name" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="Ej: Max" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especie *</label>
                    <select 
                      name="species" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Ave">Ave</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Características</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raza</label>
                    <input 
                      name="breed" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="Ej: Labrador" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                    <select 
                      name="gender" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                    <input 
                      required 
                      name="birth_date" 
                      type="date" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                    <input 
                      name="weight" 
                      type="number" 
                      step="0.1" 
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="15.5" 
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                <label className="cursor-pointer block">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-gray-700 font-medium">Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-blue-600" strokeWidth={2} />
                      </div>
                      <div>
                        <span className="text-gray-900 font-semibold block">Subir Fotografía</span>
                        <span className="text-gray-500 text-sm">JPG, PNG (máx. 5MB)</span>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    disabled={uploading} 
                  />
                </label>
                {imageUrl && (
                  <div className="mt-4">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="h-40 mx-auto rounded-2xl object-cover" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Información Médica</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alergias / Notas</label>
                  <textarea 
                    name="allergies" 
                    className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none" 
                    rows="3" 
                    placeholder="Describe alergias o condiciones médicas..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <input 
                    name="is_sterilized" 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
                  />
                  <label className="text-gray-900 font-medium text-sm">¿Está esterilizado/a?</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3.5 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Guardar Mascota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
