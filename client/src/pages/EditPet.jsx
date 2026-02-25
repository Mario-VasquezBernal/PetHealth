// ============================================
// EDITPET.JSX
// ============================================
// Página para editar información de una mascota existente
// Permite modificar: nombre, especie, raza, fecha nacimiento, género, peso, foto, alergias, esterilización
// Carga los datos actuales de la mascota y los muestra en un formulario prellenado
// Sube imágenes a Cloudinary
// Guarda cambios en el servidor y redirige a la página de detalles de la mascota
// Incluye validación de campos obligatorios (nombre y fecha de nacimiento)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getPetById, updatePet, getUserProfile } from '../dataManager';
import { 
  Save,
  X,
  Upload,
  ArrowLeft,
  Dog,
  MapPin
} from 'lucide-react';

const EditPet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Perro',
    breed: '',
    birth_date: '',
    gender: 'Macho',
    weight: '',
    photo_url: '',
    is_sterilized: false,
    allergies: ''
  });

  const CLOUD_NAME = "dggoadwam";
  const UPLOAD_PRESET = "pethealth_app";

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [petData, userData] = await Promise.all([
        getPetById(id),
        getUserProfile()
      ]);
      
      setFormData({
        name: petData.name || '',
        species: petData.species || petData.type || 'Perro',
        breed: petData.breed || '',
        birth_date: petData.birth_date ? petData.birth_date.split('T')[0] : '',
        gender: petData.gender || 'Macho',
        weight: petData.weight || '',
        photo_url: petData.photo_url || '',
        is_sterilized: petData.is_sterilized || false,
        allergies: petData.allergies || ''
      });
      
      setImageUrl(petData.photo_url || '');
      setUser(userData);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar mascota');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formDataUpload
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setFormData(prev => ({ ...prev, photo_url: data.secure_url }));
        toast.success("Foto actualizada 📸");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.birth_date) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      const dataToUpdate = {
        ...formData,
        type: formData.species,
        weight: parseFloat(formData.weight) || 0
      };
      
      await updatePet(id, dataToUpdate);
      toast.success('¡Mascota actualizada con éxito! ✅');
      navigate(`/pets/${id}`);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar mascota');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/pets/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <Sidebar 
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      <div className="flex-1 lg:ml-72">
        
        <MobileHeader 
          onMenuClick={() => setSidebarOpen(true)}
          onNewPet={null}
        />

        {/* Header Desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-900" strokeWidth={2} />
              <span className="text-sm font-medium text-gray-900"></span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8 max-w-4xl mx-auto">
          
          {/* Header */}
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            Volver a detalles
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Dog className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Mascota</h1>
                <p className="text-gray-600">Actualiza la información de {formData.name}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input 
                      required 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="Ej: Max" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especie *</label>
                    <select 
                      name="species"
                      value={formData.species}
                      onChange={handleChange}
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

              {/* Características */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Características</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raza</label>
                    <input 
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="Ej: Labrador" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
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
                      value={formData.birth_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                    <input 
                      name="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                      placeholder="15.5" 
                    />
                  </div>
                </div>
              </div>

              {/* Fotografía */}
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
                        <span className="text-gray-900 font-semibold block">Cambiar Fotografía</span>
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

              {/* Información Médica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Información Médica</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alergias / Notas</label>
                  <textarea 
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    className="w-full border border-gray-300 bg-white p-3 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none" 
                    rows="3" 
                    placeholder="Describe alergias o condiciones médicas..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <input 
                    name="is_sterilized"
                    type="checkbox"
                    checked={formData.is_sterilized}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
                  />
                  <label className="text-gray-900 font-medium text-sm">¿Está esterilizado/a?</label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/30 disabled:shadow-none flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" strokeWidth={2} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditPet;
