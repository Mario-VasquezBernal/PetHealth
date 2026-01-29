// ============================================
// HOME.JSX
// ============================================

import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import PetCard from '../components/PetCard';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getPets, addPetToStorage, deletePetFromStorage, getUserProfile } from '../dataManager';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  PlusCircle, Calendar, Upload, X, Dog, Cat, Heart, MapPin, ArrowRight
} from 'lucide-react';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  const CLOUD_NAME = "dggoadwam"; 
  const UPLOAD_PRESET = "pethealth_app"; 

  const loadPets = async () => {
    try {
      setLoading(true);
      const [petsData, userData] = await Promise.all([getPets(), getUserProfile()]);
      setPets(Array.isArray(petsData) ? petsData : []);
      setUser(userData);
    } catch {
      toast.error("Error conectando con el servidor 🔴");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPets(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadToCloudinary(file);
    e.target.value = '';
  };

  const handleCameraUpload = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (!photo.base64String) return;

      const base64 = `data:image/jpeg;base64,${photo.base64String}`;
      uploadToCloudinary(base64);
    } catch {
      toast.error("No se pudo abrir la cámara");
    }
  };

  const uploadToCloudinary = async (fileOrBase64) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileOrBase64);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Foto subida correctamente 📸");
      }
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
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
    } catch {
      toast.error("Error al guardar mascota");
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
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={() => setIsModalOpen(true)} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={() => setIsModalOpen(true)} />

        <main className="px-4 lg:px-8 py-8">
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl mb-6">
            Agregar Mascota
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map(pet => (
              <PetCard key={pet.id} {...pet} onDelete={handleDelete} />
            ))}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6">

            <form onSubmit={handleAddPet} className="space-y-4">

              <input name="name" required placeholder="Nombre" className="border p-2 w-full" />
              <select name="species" className="border p-2 w-full">
                <option>Perro</option>
                <option>Gato</option>
              </select>

              <input name="breed" placeholder="Raza" className="border p-2 w-full" />
              <input name="birth_date" type="date" className="border p-2 w-full" />
              <input name="weight" type="number" placeholder="Peso" className="border p-2 w-full" />

              <div className="flex gap-3 justify-center mt-4">
                <button type="button" onClick={handleCameraUpload} disabled={uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl">
                  📷 Cámara / Galería
                </button>

                <label className="bg-gray-200 px-4 py-2 rounded-xl cursor-pointer">
                  📁 Archivo
                  <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                </label>
              </div>

              {imageUrl && (
                <img src={imageUrl} alt="preview" className="h-40 mx-auto mt-4 rounded-xl object-cover" />
              )}

              <textarea name="allergies" placeholder="Alergias" className="border p-2 w-full"></textarea>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-200 p-3 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-xl">
                  Guardar
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
