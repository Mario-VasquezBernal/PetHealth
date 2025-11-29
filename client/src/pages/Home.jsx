import { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; 
import PetCard from '../components/PetCard';
import { getPets, addPetToStorage, deletePetFromStorage } from '../dataManager';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // CLOUDINARY CONFIG
  const CLOUD_NAME = "dggoadwam"; 
  const UPLOAD_PRESET = "pethealth_app"; 

  // Cálculo de estadísticas
  const totalPets = pets.length;
  const totalDogs = pets.filter(p => p.type === 'Perro').length;
  const totalCats = pets.filter(p => p.type === 'Gato').length;

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await getPets();
      if (Array.isArray(data)) setPets(data);
      else setPets([]); 
    } catch (error) {
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
      toast.error("Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar mascota?')) {
      await deletePetFromStorage(id);
      await loadPets();
      toast.info("Mascota eliminada 🗑️");
    }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setImageUrl(''); };

  return (
    <div className="p-6 relative min-h-screen">
      
      {/* DASHBOARD DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-2xl">🏠</div>
            <div><p className="text-gray-500 text-sm">Total</p><h3 className="text-2xl font-bold text-gray-800">{totalPets}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full text-2xl">🐶</div>
            <div><p className="text-gray-500 text-sm">Perros</p><h3 className="text-2xl font-bold text-gray-800">{totalDogs}</h3></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full text-2xl">🐱</div>
            <div><p className="text-gray-500 text-sm">Gatos</p><h3 className="text-2xl font-bold text-gray-800">{totalCats}</h3></div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mis Mascotas 🐾</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">+ Nueva Mascota</button>
      </div>

      {loading ? ( <div className="text-center py-10 text-gray-500">Cargando...</div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.length === 0 ? ( <div className="text-center col-span-3 text-gray-400">No hay mascotas.</div> ) : (
              pets.map((pet) => ( <PetCard key={pet.id} {...pet} onDelete={handleDelete} /> ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Mascota</h2>
            <form onSubmit={handleAddPet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required name="name" className="w-full border p-2 rounded" placeholder="Nombre" />
                <select name="species" className="w-full border p-2 rounded bg-white"><option value="Perro">Perro</option><option value="Gato">Gato</option><option value="Otro">Otro</option></select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="breed" className="w-full border p-2 rounded" placeholder="Raza" />
                <select name="gender" className="w-full border p-2 rounded bg-white"><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required name="birth_date" type="date" className="w-full border p-2 rounded" />
                <input name="weight" type="number" step="0.1" className="w-full border p-2 rounded" placeholder="Peso (kg)" />
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                  <label className="cursor-pointer block">
                      <span className="text-gray-500 text-sm font-medium">{uploading ? "Subiendo..." : "📸 Subir Foto"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  {imageUrl && <img src={imageUrl} alt="Vista previa" className="mt-2 h-20 mx-auto rounded-md object-cover" />}
              </div>
              <textarea name="allergies" className="w-full border p-2 rounded" rows="2" placeholder="Alergias"></textarea>
              <div className="flex items-center gap-2"><input name="is_sterilized" type="checkbox" className="w-5 h-5" /><label>¿Esterilizado?</label></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-100 p-2 rounded">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded disabled:bg-blue-300" disabled={uploading}>{uploading ? 'Subiendo...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;