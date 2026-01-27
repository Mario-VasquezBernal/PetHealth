import StarRating from '../components/StarRating';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getVeterinarians, 
  createVeterinarian, 
  deleteVeterinarian, 
  getClinics 
} from '../dataManager';
import { X, Stethoscope, Building2, Trash2, Plus, UserPlus, AlertCircle } from 'lucide-react';

const onlyLettersRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.]+$/;

const capitalizeWords = (text) =>
  text
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();

const VetManagement = ({ onClose }) => {
  const [vets, setVets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [form, setForm] = useState({ name: '', specialty: '', clinic_id: '' });

  // =========================
  // FUNCIONES
  // =========================

  const loadData = async () => {
    try {
      const [v, c] = await Promise.all([getVeterinarians(), getClinics()]);
      setVets(Array.isArray(v) ? v : []);
      setClinics(Array.isArray(c) ? c : []);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    }
  };

  const validateForm = () => {
    const name = form.name.trim();
    const specialty = form.specialty.trim();

    if (!name || !specialty) {
      toast.warning("Completa nombre y especialidad");
      return false;
    }

    if (!onlyLettersRegex.test(name)) {
      toast.error("❌ El nombre solo puede contener letras y espacios");
      return false;
    }

    if (name.length < 3) {
      toast.error("❌ El nombre debe tener al menos 3 caracteres");
      return false;
    }

    if (!onlyLettersRegex.test(specialty)) {
      toast.error("❌ La especialidad solo puede contener letras");
      return false;
    }

    if (specialty.length < 3) {
      toast.error("❌ La especialidad debe tener al menos 3 caracteres");
      return false;
    }

    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const vetData = {
        name: capitalizeWords(form.name),
        specialty: capitalizeWords(form.specialty)
      };

      if (form.clinic_id) {
        vetData.clinic_id = form.clinic_id;
      }

      await createVeterinarian(vetData);

      toast.success("Doctor registrado ✅");

      setForm({ name: '', specialty: '', clinic_id: '' });

      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear doctor");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar a este doctor?")) return;

    try {
      await deleteVeterinarian(id);
      toast.info("Doctor eliminado 🗑️");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {
  const init = async () => {
    await loadData();
  };

  init();
}, []);


  // =========================
  // RENDER
  // =========================

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900">Gestionar Veterinarios</h2>
              <p className="text-sm text-primary-600">Directorio médico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary-50 rounded-xl text-primary-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {clinics.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
            <p className="text-sm text-blue-800">
              Puedes registrar doctores sin clínica y asignarla después.
            </p>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-gradient-to-br from-primary-50 to-white p-5 rounded-xl mb-6 border">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-primary-900">Nuevo Doctor</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Nombre completo"
                className="border p-2.5 rounded-xl"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Especialidad"
                className="border p-2.5 rounded-xl"
                value={form.specialty}
                onChange={e => setForm({ ...form, specialty: e.target.value })}
              />
            </div>

            <select
              className="border p-2.5 rounded-xl w-full"
              value={form.clinic_id}
              onChange={e => setForm({ ...form, clinic_id: e.target.value })}
            >
              <option value="">Consultorio independiente</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex justify-center items-center gap-2">
              <Plus className="w-5 h-5" />
              Guardar Doctor
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {vets.length === 0 ? (
            <p className="text-center text-gray-500">No hay veterinarios registrados</p>
          ) : vets.map(vet => {
            const clinic = clinics.find(c => c.id === vet.clinic_id);

            return (
              <div key={vet.id} className="border p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">{vet.name}</p>
                  <StarRating value={vet.average_rating} total={vet.total_ratings} />
                  <p className="text-sm">{vet.specialty}</p>
                  <p className="text-xs text-gray-500">
                    {clinic ? clinic.name : 'Consultorio independiente'}
                  </p>
                </div>

                <button onClick={() => handleDelete(vet.id)} className="text-red-500">
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-primary-100 px-6 py-2 rounded-xl">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default VetManagement;
