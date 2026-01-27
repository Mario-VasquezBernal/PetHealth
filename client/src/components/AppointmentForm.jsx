import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getPets,
  getVeterinarians,
  getClinics,
  createAppointment
} from "../dataManager";

const AppointmentForm = ({ onCreated }) => {
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [clinics, setClinics] = useState([]);

  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [form, setForm] = useState({
    pet_id: "",
    vet_id: "",
    date: "",
    reason: ""
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, v, c] = await Promise.all([
          getPets(),
          getVeterinarians(),
          getClinics()
        ]);

        const petsArr = Array.isArray(p) ? p : p.pets || [];
        const vetsArr = Array.isArray(v) ? v : v.veterinarians || [];
        const clinicsArr = Array.isArray(c) ? c : c.clinics || [];

        setPets(petsArr);
        setVets(vetsArr);
        setClinics(clinicsArr);

        if (petsArr.length > 0) {
          setForm(f => ({ ...f, pet_id: petsArr[0].id }));
        }
      } catch (err) {
        console.error(err);
        toast.error("Error cargando datos del formulario");
      }
    };

    load();
  }, []);

  const filteredVets = selectedClinicId
    ? vets.filter(v => v.clinic_id === selectedClinicId)
    : vets;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.pet_id || !form.vet_id || !form.date) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    const appointmentDate = new Date(form.date);

    if (appointmentDate < new Date()) {
      toast.error("❌ No puedes crear citas en fechas pasadas");
      return;
    }

    try {
      await createAppointment(form);
      toast.success("Cita creada con éxito ✅");

      setForm(f => ({ ...f, date: "", reason: "" }));
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo crear la cita");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border mb-6">
      <h2 className="text-xl font-bold mb-4">Nueva cita</h2>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Mascota */}
        <select
          className="w-full border p-2 rounded"
          value={form.pet_id}
          onChange={e => setForm({ ...form, pet_id: e.target.value })}
        >
          <option value="">Selecciona mascota</option>
          {pets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Clínica */}
        <select
          className="w-full border p-2 rounded"
          value={selectedClinicId}
          onChange={e => {
            setSelectedClinicId(e.target.value);
            setForm({ ...form, vet_id: "" });
          }}
        >
          <option value="">Todas las clínicas</option>
          {clinics.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Veterinario */}
        <select
          className="w-full border p-2 rounded"
          value={form.vet_id}
          onChange={e => setForm({ ...form, vet_id: e.target.value })}
        >
          <option value="">Selecciona veterinario</option>
          {filteredVets.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} - {v.specialty}
            </option>
          ))}
        </select>

        {/* Fecha */}
        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          value={form.date}
          min={new Date().toISOString().slice(0, 16)}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />

        {/* Motivo */}
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Motivo"
          value={form.reason}
          onChange={e => setForm({ ...form, reason: e.target.value })}
        />

        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Crear cita
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
