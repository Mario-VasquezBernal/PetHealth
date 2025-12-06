import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PetCard from '../components/PetCard';
import { getPets, addPetToStorage, deletePetFromStorage, getUserProfile } from '../dataManager';
import { 
  PlusCircle, 
  Calendar, 
  Upload,
  X,
  Dog,
  Cat,
  Stethoscope,
  Heart
} from 'lucide-react';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const navigate = useNavigate();

  // CLOUDINARY CONFIG
  const CLOUD_NAME = "dggoadwam"; 
  const UPLOAD_PRESET = "pethealth_app"; 

  // Filtros de estadísticas
  const totalPets = pets.length;
  const totalDogs = pets.filter(p => p.type === 'Perro').length;
  const totalCats = pets.filter(p => p.type === 'Gato').length;

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pb-20 md:pb-8">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Saludo Personalizado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900">
            ¡Hola, {user?.full_name || 'Usuario'}! 👋
          </h1>
          <p className="text-primary-600 mt-1">Bienvenido a tu centro de cuidado de mascotas</p>
        </div>

        {/* Estadísticas - Grid Optimizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Total Mascotas */}
          <div className="bg-white p-6 rounded-card shadow-card border border-primary-100 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">Total Mascotas</p>
                <h3 className="text-3xl font-bold text-primary-900 mt-1">{totalPets}</h3>
              </div>
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Card 2: Perros */}
          <div className="bg-white p-6 rounded-card shadow-card border border-orange-100 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Perros</p>
                <h3 className="text-3xl font-bold text-orange-900 mt-1">{totalDogs}</h3>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Dog className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Card 3: Gatos */}
          <div className="bg-white p-6 rounded-card shadow-card border border-purple-100 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Gatos</p>
                <h3 className="text-3xl font-bold text-purple-900 mt-1">{totalCats}</h3>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Cat className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Card 4: Acciones Rápidas - Stack Vertical */}
          <div className="flex flex-col gap-3">
            
            {/* Botón: Agendar Cita */}
            <button 
              onClick={() => navigate('/appointments')}
              className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-card shadow-lg hover:shadow-xl transition-all group text-white flex items-center justify-between flex-1"
            >
              <div>
                <p className="text-xs text-primary-100 font-medium">Agendar</p>
                <h3 className="text-base font-bold mt-0.5">Nueva Cita</h3>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </button>

            {/* Botón: Nueva Mascota */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-card shadow-lg hover:shadow-xl transition-all group text-white flex items-center justify-between flex-1"
            >
              <div>
                <p className="text-xs text-orange-100 font-medium">Registrar</p>
                <h3 className="text-base font-bold mt-0.5">Nueva Mascota</h3>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Sección de Mascotas */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary-600" />
            Mis Mascotas
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 shadow-md transition-all font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            Nueva Mascota
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center border border-dashed border-primary-300">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-primary-900 mb-2">No tienes mascotas registradas</h3>
            <p className="text-primary-600 mb-6">Comienza agregando tu primera mascota</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              <PlusCircle className="w-5 h-5" />
              Agregar primera mascota
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} {...pet} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-card shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-900">Registrar Mascota</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-primary-50 rounded-xl transition-colors text-primary-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Nombre *</label>
                  <input 
                    required 
                    name="name" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                    placeholder="Ej: Max" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Especie *</label>
                  <select 
                    name="species" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Raza</label>
                  <input 
                    name="breed" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                    placeholder="Ej: Labrador" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Género</label>
                  <select 
                    name="gender" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Fecha de Nacimiento *</label>
                  <input 
                    required 
                    name="birth_date" 
                    type="date" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Peso (kg)</label>
                  <input 
                    name="weight" 
                    type="number" 
                    step="0.1" 
                    className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                    placeholder="15.5" 
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-primary-300 rounded-xl p-6 text-center hover:bg-primary-50 transition-colors">
                <label className="cursor-pointer block">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full"></div>
                      <span className="text-primary-600 text-sm font-medium">Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-primary-600" />
                      <span className="text-primary-700 text-sm font-medium">📸 Subir Foto</span>
                      <span className="text-primary-500 text-xs">Clic aquí para seleccionar</span>
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
                      alt="Vista previa" 
                      className="h-32 mx-auto rounded-xl object-cover shadow-md" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Alergias / Notas</label>
                <textarea 
                  name="allergies" 
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                  rows="3" 
                  placeholder="Describe cualquier alergia o condición médica..."
                ></textarea>
              </div>

              <div className="flex items-center gap-3 bg-primary-50 p-3 rounded-xl">
                <input 
                  name="is_sterilized" 
                  type="checkbox" 
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                />
                <label className="text-primary-800 font-medium">¿Está esterilizado/a?</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 font-medium transition-colors shadow-md" 
                  disabled={uploading}
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
