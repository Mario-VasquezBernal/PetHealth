import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para regresar
import { getPets, getVets, getAppointments, createAppointment, deleteAppointment, createVet } from '../dataManager';

const Appointments = () => {
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  // Estado para el formulario de citas
  const [form, setForm] = useState({ pet_id: '', vet_id: '', date: '', reason: '' });

  // Estado para el MODAL de Nuevo Veterinario
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [newVetForm, setNewVetForm] = useState({ name: '', specialty: '', phone: '', address: '' });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
        const p = await getPets();
        const v = await getVets();
        const a = await getAppointments();
        setPets(Array.isArray(p) ? p : []);
        setVets(Array.isArray(v) ? v : []);
        setAppointments(Array.isArray(a) ? a : []);
    };
    loadData();
  }, []);

  // Guardar Cita
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pet_id || !form.vet_id || !form.date) return alert("Completa los campos");

    await createAppointment(form);
    const updatedList = await getAppointments();
    setAppointments(updatedList);
    setForm({ ...form, reason: '', date: '' });
    alert("Cita agendada con éxito ✅");
  };

  // Cancelar Cita
  const handleDelete = async (id) => {
    if(window.confirm("¿Cancelar esta cita?")) {
        const updatedList = await deleteAppointment(id);
        setAppointments(updatedList);
    }
  };

  // Guardar Nuevo Veterinario
  const handleCreateVet = async (e) => {
    e.preventDefault();
    try {
        const createdVet = await createVet(newVetForm);
        // Actualizamos la lista de doctores y seleccionamos el nuevo automáticamente
        setVets([...vets, createdVet]);
        setForm({ ...form, vet_id: createdVet.id });
        setIsVetModalOpen(false);
        setNewVetForm({ name: '', specialty: '', phone: '', address: '' });
    } catch (error) {
        alert("Error al guardar veterinario");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      {/* BOTÓN REGRESAR */}
      <Link to="/" className="text-blue-600 hover:underline mb-6 inline-flex items-center gap-2 font-medium transition-colors hover:text-blue-800">
        &larr; Volver al Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">📅 Agenda Veterinaria</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: FORMULARIO */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Nueva Cita</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mascota</label>
                    <select 
                        className="w-full border p-2 rounded mt-1 bg-white"
                        value={form.pet_id}
                        onChange={e => setForm({...form, pet_id: e.target.value})}
                        required
                    >
                        <option value="">Selecciona una mascota</option>
                        {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Veterinario</label>
                    <div className="flex gap-2">
                        <select 
                            className="w-full border p-2 rounded mt-1 bg-white"
                            value={form.vet_id}
                            onChange={e => setForm({...form, vet_id: e.target.value})}
                            required
                        >
                            <option value="">Selecciona un doctor</option>
                            {vets.map(v => <option key={v.id} value={v.id}>{v.name} - {v.specialty}</option>)}
                        </select>
                        <button 
                            type="button"
                            onClick={() => setIsVetModalOpen(true)}
                            className="bg-green-100 text-green-700 px-3 rounded mt-1 hover:bg-green-200 border border-green-200 text-xl font-bold"
                            title="Agregar nuevo doctor"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                    <input 
                        type="datetime-local" 
                        className="w-full border p-2 rounded mt-1"
                        value={form.date}
                        onChange={e => setForm({...form, date: e.target.value})}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Motivo</label>
                    <textarea 
                        className="w-full border p-2 rounded mt-1" 
                        rows="2"
                        value={form.reason}
                        onChange={e => setForm({...form, reason: e.target.value})}
                        placeholder="Ej: Vacuna anual..."
                    ></textarea>
                </div>

                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md">
                    Agendar Cita
                </button>
            </form>
        </div>

        {/* COLUMNA 2: LISTA DE CITAS */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Próximas Citas</h2>
            
            {appointments.length === 0 ? (
                <div className="bg-gray-50 p-10 rounded-xl text-center text-gray-400 border border-dashed border-gray-300">
                    No tienes citas programadas.
                </div>
            ) : (
                appointments.map(appt => (
                    <div key={appt.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-shadow">
                        
                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-center min-w-[100px]">
                            <p className="text-xs font-bold uppercase">Fecha</p>
                            <p className="font-bold text-sm">{appt.formatted_date}</p>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-800">{appt.pet_name}</h3>
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">con {appt.vet_name}</span>
                            </div>
                            <p className="text-gray-600 text-sm">{appt.reason}</p>
                            <p className="text-xs text-gray-400 mt-1">📍 {appt.vet_address}</p>
                        </div>

                        <button 
                            onClick={() => handleDelete(appt.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                            title="Cancelar cita"
                        >
                            ❌
                        </button>
                    </div>
                ))
            )}
        </div>

      </div>

      {/* --- MODAL PARA CREAR VETERINARIO --- */}
      {isVetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Nuevo Veterinario</h2>
                <form onSubmit={handleCreateVet} className="space-y-4">
                    <input 
                        required 
                        placeholder="Nombre (Dr. Ejemplo)" 
                        className="w-full border p-2 rounded"
                        value={newVetForm.name}
                        onChange={e => setNewVetForm({...newVetForm, name: e.target.value})}
                    />
                    <input 
                        placeholder="Especialidad (General, Cirugía...)" 
                        className="w-full border p-2 rounded"
                        value={newVetForm.specialty}
                        onChange={e => setNewVetForm({...newVetForm, specialty: e.target.value})}
                    />
                    <input 
                        placeholder="Teléfono" 
                        className="w-full border p-2 rounded"
                        value={newVetForm.phone}
                        onChange={e => setNewVetForm({...newVetForm, phone: e.target.value})}
                    />
                    <input 
                        placeholder="Dirección de la clínica" 
                        className="w-full border p-2 rounded"
                        value={newVetForm.address}
                        onChange={e => setNewVetForm({...newVetForm, address: e.target.value})}
                    />
                    
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsVetModalOpen(false)} className="flex-1 bg-gray-100 p-2 rounded hover:bg-gray-200">Cancelar</button>
                        <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700 font-bold">Guardar Doctor</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Appointments;