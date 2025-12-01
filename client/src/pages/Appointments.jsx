import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    getPets, getVets, getAppointments, createAppointment, deleteAppointment, 
    getClinics
} from '../dataManager';
import ClinicManagement from '../components/ClinicManagement'; 
import VetManagement from '../components/VetManagement'; 

const ArrayOf = (data) => Array.isArray(data) ? data : [];

const Appointments = () => {
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [clinics, setClinics] = useState([]); 
  const [appointments, setAppointments] = useState([]);
  
  const [form, setForm] = useState({ pet_id: '', vet_id: '', date: '', reason: '' });

  // ESTADO NUEVO: Para filtrar los doctores según la clínica seleccionada
  const [selectedClinicId, setSelectedClinicId] = useState('');

  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  
  const loadData = useCallback(async () => {
      try {
          const [p, v, c, a] = await Promise.all([getPets(), getVets(), getClinics(), getAppointments()]);
          
          setPets(ArrayOf(p));
          setVets(ArrayOf(v));
          setClinics(ArrayOf(c)); 

          const formattedAppointments = ArrayOf(a).map(appt => ({
            ...appt,
            pet_name: appt.pets?.name || appt.pet_name || 'Mascota desconocida',
            vet_name: appt.vets?.name || appt.vet_name || 'Doctor no asignado',
            clinic_name: appt.clinics?.name || appt.clinic_name || 'Clínica Principal',
            clinic_address: appt.clinics?.address || appt.clinic_address || '',
            formatted_date: new Date(appt.date).toLocaleDateString() + ' ' + new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }));

          setAppointments(formattedAppointments);

          if (p && p.length > 0) {
              setForm(f => ({ ...f, pet_id: p[0].id }));
          }

      } catch (error) {
          console.error(error);
          toast.error("Error al cargar datos iniciales."); 
      }
  }, []); 

  useEffect(() => {
    const runLoader = async () => { await loadData(); };
    runLoader();
  }, [loadData]); 

  // Filtrar doctores: Si hay clínica seleccionada, muestra solo sus doctores. Si no, muestra todos.
  const filteredVets = selectedClinicId 
    ? vets.filter(v => v.clinic_id === parseInt(selectedClinicId))
    : vets;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pet_id || !form.vet_id || !form.date) return toast.error("Completa todos los campos obligatorios.");

    try {
        await createAppointment(form);
        await loadData(); 
        setForm(f => ({ ...f, reason: '', date: '' }));
        toast.success("Cita agendada con éxito ✅");
    } catch (error) {
        console.error(error);
        toast.error("Error al agendar la cita.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("¿Cancelar esta cita?")) {
        try {
            await deleteAppointment(id);
            await loadData();
            toast.info("Cita cancelada.");
        } catch (error) {
            console.error(error);
            toast.error("No se pudo eliminar.");
        }
    }
  };
  
  const handleCloseClinicModal = () => {
      setIsClinicModalOpen(false);
      loadData(); 
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      <Link to="/" className="text-blue-600 hover:underline mb-6 inline-flex items-center gap-2 font-medium transition-colors hover:text-blue-800">
        &larr; Volver al Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">📅 Agenda Veterinaria</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: FORMULARIO */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Nueva Cita</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. SELECCIÓN DE MASCOTA */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mascota</label>
                    <select className="w-full border p-2 rounded mt-1 bg-white" value={form.pet_id} onChange={e => setForm({...form, pet_id: e.target.value})} required disabled={pets.length === 0}>
                        <option value="">{pets.length === 0 ? 'Crea una mascota primero' : 'Selecciona una mascota'}</option>
                        {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                    </select>
                </div>

                <hr className="border-gray-100 my-2" />

                {/* 2. CAJÓN DE CLÍNICA (PRIMERO) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Clínica</label>
                    <div className="flex gap-2">
                        <select 
                            className="w-full border p-2 rounded bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                            value={selectedClinicId} 
                            onChange={e => {
                                setSelectedClinicId(e.target.value);
                                setForm({...form, vet_id: ''}); // Reseteamos el doctor al cambiar clínica
                            }}
                        >
                            <option value="">-- Todas las Clínicas --</option>
                            {clinics.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        
                        {/* Botón Gestionar Clínicas (Azul) */}
                        <button 
                            type='button' 
                            onClick={() => setIsClinicModalOpen(true)}
                            className='bg-blue-100 text-blue-700 px-3 rounded hover:bg-blue-200 border border-blue-200 text-lg font-bold transition-colors min-w-[45px]'
                            title="Gestionar Clínicas"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* 3. CAJÓN DE VETERINARIO (SEGUNDO) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Veterinario</label>
                    <div className="flex gap-2">
                        <select 
                            className="w-full border p-2 rounded bg-white outline-none focus:ring-2 focus:ring-green-500" 
                            value={form.vet_id} 
                            onChange={e => setForm({...form, vet_id: e.target.value})} 
                            required 
                            disabled={vets.length === 0}
                        >
                            <option value="">
                                {selectedClinicId 
                                    ? (filteredVets.length === 0 ? 'No hay doctores aquí' : 'Selecciona doctor de esta clínica')
                                    : 'Selecciona un doctor'
                                }
                            </option>
                            
                            {filteredVets.map(v => {
                                const clinic = clinics.find(c => c.id === v.clinic_id);
                                const clinicName = clinic ? clinic.name : "Consultorio Privado";
                                // Si ya seleccioné clínica arriba, no repito el nombre en el option para que se vea limpio
                                const label = selectedClinicId ? v.name : `${v.name} (${clinicName})`;
                                
                                return (
                                    <option key={v.id} value={v.id}>
                                        {label} ({v.specialty})
                                    </option>
                                );
                            })}
                        </select>
                        
                        {/* Botón Gestionar Doctores (Verde) */}
                        <button 
                            type="button"
                            onClick={() => setIsVetModalOpen(true)}
                            className="bg-green-100 text-green-700 px-3 rounded hover:bg-green-200 border border-green-200 text-xl font-bold transition-colors min-w-[45px]"
                            title="Agregar Nuevo Doctor"
                        >
                            +
                        </button>
                    </div>
                    {clinics.length === 0 && <p className='text-red-500 text-xs mt-1'>⚠️ Registra una clínica primero.</p>}
                </div>

                <hr className="border-gray-100 my-2" />

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                    <input type="datetime-local" className="w-full border p-2 rounded mt-1" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Motivo</label>
                    <textarea className="w-full border p-2 rounded mt-1" rows="2" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ej: Vacuna anual..."></textarea>
                </div>

                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md" disabled={pets.length === 0 || vets.length === 0}>
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
                            <p className="text-xs text-gray-400 mt-1">📍 {appt.clinic_name} - {appt.clinic_address}</p>
                        </div>
                        <button onClick={() => handleDelete(appt.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors" title="Cancelar cita">❌</button>
                    </div>
                ))
            )}
        </div>

      </div>

      {/* MODALES */}
      {isVetModalOpen && (
        <VetManagement onClose={() => { setIsVetModalOpen(false); loadData(); }} />
      )}
      
      {isClinicModalOpen && <ClinicManagement onClose={handleCloseClinicModal} />}

    </div>
  );
};

export default Appointments;