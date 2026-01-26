// ============================================
// APPOINTMENTS.JSX
// ============================================
// Página de gestión de citas veterinarias
// Permite agendar, ver y cancelar citas
// Incluye gestión de veterinarios y clínicas
// ============================================
// 
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import RatingModal from '../components/RatingModal';
import { 
    getPets, 
    getVeterinarians,
    getAppointments, 
    createAppointment, 
    deleteAppointment, 
    getClinics,
    getUserProfile
} from '../dataManager';
import ClinicManagement from '../components/ClinicManagement'; 
import VetManagement from '../components/VetManagement';
import { 
  Calendar, 
  MapPin, 
  Stethoscope, 
  Building2, 
  X,
  Clock,
  FileText,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

const ArrayOf = (data) => Array.isArray(data) ? data : [];

const Appointments = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [clinics, setClinics] = useState([]); 
  const [appointments, setAppointments] = useState([]);
  
  const [form, setForm] = useState({ pet_id: '', vet_id: '', date: '', reason: '' });
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
      const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedVeterinarianForRating, setSelectedVeterinarianForRating] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  
  const loadData = useCallback(async () => {
      try {
          const [p, v, c, a, userData] = await Promise.all([
              getPets(), 
              getVeterinarians(),
              getClinics(), 
              getAppointments(),
              getUserProfile()
          ]);
          
          setPets(ArrayOf(p));
          setVets(ArrayOf(v));
          setClinics(ArrayOf(c)); 
          setUser(userData);

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

  const filteredVets = selectedClinicId 
    ? vets.filter(v => v.clinic_id === selectedClinicId)
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
              <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Agenda Veterinaria</h1>
                <p className="text-gray-600">Gestiona las citas de tus mascotas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA 1: FORMULARIO */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit">
              <div className="flex items-center gap-2 mb-6">
                <PlusCircle className="w-6 h-6 text-blue-600" strokeWidth={2} />
                <h2 className="text-xl font-bold text-gray-900">Nueva Cita</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. SELECCIÓN DE MASCOTA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mascota *</label>
                  <select 
                    className="w-full border border-gray-300 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    value={form.pet_id} 
                    onChange={e => setForm({...form, pet_id: e.target.value})} 
                    required 
                    disabled={pets.length === 0}
                  >
                    <option value="">{pets.length === 0 ? 'Crea una mascota primero' : 'Selecciona una mascota'}</option>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type || p.species})</option>)}
                  </select>
                </div>

                <hr className="border-gray-200 my-4" />

                {/* 2. CAJÓN DE CLÍNICA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    1. Clínica
                  </label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 min-w-0 border border-gray-300 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" 
                      value={selectedClinicId} 
                      onChange={e => {
                        setSelectedClinicId(e.target.value);
                        setForm({...form, vet_id: ''});
                      }}
                    >
                      <option value="">-- Todas las Clínicas --</option>
                      {clinics.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    
                    <button 
                      type='button' 
                      onClick={() => setIsClinicModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all min-w-[44px] max-w-[44px] h-[44px] flex items-center justify-center text-xl shadow-md"
                      title="Gestionar Clínicas"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. CAJÓN DE VETERINARIO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    2. Veterinario *
                  </label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 min-w-0 border border-gray-300 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" 
                      value={form.vet_id} 
                      onChange={e => setForm({...form, vet_id: e.target.value})} 
                      required 
                      disabled={vets.length === 0}
                    >
                      <option value="">
                        {selectedClinicId 
                          ? (filteredVets.length === 0 ? 'No hay doctores aquí' : 'Selecciona doctor')
                          : 'Selecciona un doctor'
                        }
                      </option>
                      
                      {filteredVets.map(v => {
                        const clinic = clinics.find(c => c.id === v.clinic_id);
                        const clinicName = clinic ? clinic.name : "Consultorio Privado";
                        const label = selectedClinicId ? v.name : `${v.name} (${clinicName})`;
                        
                        return (
                          <option key={v.id} value={v.id}>
                            {label} - {v.specialty}
                          </option>
                        );
                      })}
                    </select>
                    
                    <button 
                      type="button"
                      onClick={() => setIsVetModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all min-w-[44px] max-w-[44px] h-[44px] flex items-center justify-center text-xl shadow-md"
                      title="Agregar Nuevo Doctor"
                    >
                      +
                    </button>
                  </div>
                  {vets.length === 0 && (
                    <p className='text-red-600 text-xs mt-2 flex items-center gap-1'>
                      <AlertCircle className="w-3 h-3" />
                      Registra un doctor primero
                    </p>
                  )}
                </div>

                <hr className="border-gray-200 my-4" />

                {/* Fecha y Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Fecha y Hora *
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    value={form.date} 
                    onChange={e => setForm({...form, date: e.target.value})} 
                    required
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Motivo
                  </label>
                  <textarea 
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" 
                    rows="3" 
                    value={form.reason} 
                    onChange={e => setForm({...form, reason: e.target.value})} 
                    placeholder="Ej: Vacuna anual, consulta general..."
                  ></textarea>
                </div>

                {/* BOTÓN AGENDAR CITA */}
                <button 
                  type="submit"
                  className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    pets.length === 0 || vets.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:-translate-y-0.5'
                  }`}
                  disabled={pets.length === 0 || vets.length === 0}
                >
                  <Calendar className="w-5 h-5" strokeWidth={2} />
                  Agendar Cita
                </button>
              </form>
            </div>

            {/* COLUMNA 2: LISTA DE CITAS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-7 h-7 text-blue-600" strokeWidth={2} />
                  Próximas Citas
                </h2>
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {appointments.length} citas
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes citas programadas</h3>
                  <p className="text-gray-600">Agenda una cita usando el formulario de la izquierda</p>
                </div>
              ) : (
                appointments.map(appt => (
                  <div 
                    key={appt.id} 
                    className="bg-white p-5 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Fecha */}
                      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-4 rounded-2xl text-center min-w-[120px] shadow-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-1" strokeWidth={2} />
                        <p className="text-xs font-semibold uppercase opacity-90">Fecha</p>
                        <p className="font-bold text-sm mt-1">{appt.formatted_date}</p>
                      </div>

                      {/* Detalles */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{appt.pet_name}</h3>
                          <button 
                            onClick={() => handleDelete(appt.id)} 
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" 
                            title="Cancelar cita"
                          >
                            <X className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Stethoscope className="w-4 h-4" />
                            <span className="font-medium">Dr. {appt.vet_name}</span>
                          </div>

                          {appt.reason && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{appt.reason}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{appt.clinic_name} {appt.clinic_address && `- ${appt.clinic_address}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODALES */}
      {isVetModalOpen && (
        <VetManagement onClose={() => { setIsVetModalOpen(false); loadData(); }} />
      )}
      
      {isClinicModalOpen && <ClinicManagement onClose={handleCloseClinicModal} />}
          {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        veterinarian={selectedVeterinarianForRating}
        appointmentId={selectedAppointmentId}
        onClose={() => setIsRatingModalOpen(false)}
        onSuccess={() => loadData()}
      />

    </div>
  );
};

export default Appointments;
