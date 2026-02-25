import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PetCard from "../components/PetCard";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import {
  getPets,
  addPetToStorage,
  deletePetFromStorage,
  getUserProfile
} from "../dataManager";

// ⚠️ PENDIENTE: habilitar cuando se implemente para app nativa Capacitor
// import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const Home = () => {
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const CLOUD_NAME = "dggoadwam";
  const UPLOAD_PRESET = "pethealth_app";

  const loadPets = async () => {
    try {
      setLoading(true);
      const [petsData, userData] = await Promise.all([
        getPets(),
        getUserProfile()
      ]);
      setPets(Array.isArray(petsData) ? petsData : []);
      setUser(userData);
    } catch {
      toast.error("Error conectando con el servidor 🔴");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadToCloudinary(file);
    e.target.value = "";
  };

  // ⚠️ PENDIENTE: habilitar cuando se implemente Capacitor para app nativa
  /*
  const handleCameraUpload = async () => {
    const isWeb = !window.Capacitor || window.Capacitor.getPlatform() === "web";
    if (isWeb) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) uploadToCloudinary(file);
      };
      input.click();
    }
    // else {
    //   try {
    //     const photo = await Camera.getPhoto({
    //       quality: 80,
    //       allowEditing: false,
    //       resultType: CameraResultType.Base64,
    //       source: CameraSource.Prompt
    //     });
    //     if (!photo.base64String) return;
    //     const base64 = `data:image/jpeg;base64,${photo.base64String}`;
    //     uploadToCloudinary(base64);
    //   } catch {
    //     toast.error("No se pudo abrir la cámara");
    //   }
    // }
  };
  */

  const uploadToCloudinary = async (fileOrBase64) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileOrBase64);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Foto subida correctamente 📸");
      } else {
        toast.error("No se pudo subir la imagen");
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
      species_code: form.species.value,
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
      setImageUrl("");
      toast.success("¡Mascota registrada! 🎉");
    } catch {
      toast.error("Error al guardar mascota");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar mascota?")) {
      try {
        await deletePetFromStorage(id);
        await loadPets();
        toast.info("Mascota eliminada 🗑️");
      } catch {
        toast.error("Error al eliminar");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setImageUrl("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={() => setIsModalOpen(true)}
      />

      <div className="flex-1 lg:ml-72">
        <MobileHeader
          onMenuClick={() => setSidebarOpen(true)}
          onNewPet={() => setIsModalOpen(true)}
        />

        <main className="px-4 lg:px-8 py-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl mb-6"
          >
            Agregar Mascota
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} {...pet} onDelete={handleDelete} />
            ))}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

            {/* Header sticky */}
            <div className="sticky top-0 bg-white px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-800">🐾 Agregar Mascota</h2>
            </div>

            <form onSubmit={handleAddPet} className="px-6 py-4 flex flex-col gap-4">

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  name="name"
                  required
                  placeholder="Ej: Firulais"
                  className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                />
              </div>

              {/* Especie */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Especie *</label>
                <select
                  name="species"
                  className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white"
                >
                  <option value="dog">Perro</option>
                  <option value="cat">Gato</option>
                  <option value="bird">Ave</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Raza + Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Raza</label>
                  <input
                    name="breed"
                    placeholder="Ej: Labrador"
                    className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input
                    type="date"
                    name="birth_date"
                    className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
              </div>

              {/* Género + Peso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Género</label>
                  <select
                    name="gender"
                    className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white"
                  >
                    <option value="male">Macho</option>
                    <option value="female">Hembra</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    placeholder="Ej: 5.2"
                    className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  />
                </div>
              </div>

              {/* Esterilizado */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" name="is_sterilized" className="w-5 h-5 accent-blue-600" />
                <span className="text-sm text-gray-700">Esterilizado/a</span>
              </label>

              {/* Alergias */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Alergias</label>
                <textarea
                  name="allergies"
                  placeholder="Ej: Polen, mariscos..."
                  rows={2}
                  className="border border-gray-300 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                />
              </div>

              {/* Foto */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Foto</label>
                <div className="flex flex-wrap gap-3">
                  {/* ⚠️ PENDIENTE: habilitar cuando se implemente Capacitor para app nativa
                  <button
                    type="button"
                    onClick={handleCameraUpload}
                    disabled={uploading}
                    className="flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                  >
                    📷 Cámara / Galería
                  </button>
                  */}
                  <label className="flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer text-center text-sm">
                    📁 Subir foto
                    <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                  </label>
                </div>
                {uploading && <p className="text-xs text-blue-500 text-center">Subiendo imagen...</p>}
                {imageUrl && (
                  <img src={imageUrl} alt="preview" className="h-36 w-full object-cover rounded-xl mt-1" />
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white p-3 rounded-xl text-sm font-medium disabled:opacity-50"
                >
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
