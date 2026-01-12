import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    getPets, 
    getVeterinarians,
    getAppointments, 
    createAppointment, 
    deleteAppointment, 
    getClinics
} from '../dataManager';
import ClinicManagement from '../components/ClinicManagement'; 
import VetManagement from '../components/VetManagement';
import { 
  ArrowLeft, 
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
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [clinics, setClinics] = useState([]); 
  const [appointments, setAppointments] = useState([]);
  
  const [form, setForm] = useState({ pet_id: '', vet_id: '', date: '', reason: '' });


  const [selectedClinicId, setSelectedClinicId] = useState('');


  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  
  const loadData = useCallback(async () => {
      try {
          const [p, v, c, a] = await Promise.all([
              getPets(), 
              getVeterinarians(),
              getClinics(), 
              getAppointments()
          ]);
          
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pb-8">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/home"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary-900">Agenda Veterinaria</h1>
          </div>
          <p className="text-primary-600">Gestiona las citas de tus mascotas</p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: FORMULARIO */}
          <div className="bg-white p-6 rounded-card shadow-card border border-primary-100 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-primary-900">Nueva Cita</h2>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. SELECCIÓN DE MASCOTA */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">Mascota *</label>
                <select 
                  className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
                  value={form.pet_id} 
                  onChange={e => setForm({...form, pet_id: e.target.value})} 
                  required 
                  disabled={pets.length === 0}
                >
                  <option value="">{pets.length === 0 ? 'Crea una mascota primero' : 'Selecciona una mascota'}</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type || p.species})</option>)}
                </select>
              </div>


              <hr className="border-primary-100 my-4" />


              {/* 2. CAJÓN DE CLÍNICA */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  1. Clínica
                </label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 min-w-0 border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
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
                  
                  {/* ✅ BOTÓN + CLÍNICA */}
                  <button 
                    type='button' 
                    onClick={() => setIsClinicModalOpen(true)}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '0 0.875rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #10b981',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '1.25rem',
                      minWidth: '44px',
                      maxWidth: '44px',
                      height: '44px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
                      e.currentTarget.style.borderColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10b981';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
                    title="Gestionar Clínicas"
                  >
                    +
                  </button>
                </div>
              </div>


              {/* 3. CAJÓN DE VETERINARIO */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  2. Veterinario *
                </label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 min-w-0 border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
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
                  
                  {/* ✅ BOTÓN + VETERINARIO */}
                  <button 
                    type="button"
                    onClick={() => setIsVetModalOpen(true)}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '0 0.875rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #10b981',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '1.25rem',
                      minWidth: '44px',
                      maxWidth: '44px',
                      height: '44px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
                      e.currentTarget.style.borderColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10b981';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
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


              <hr className="border-primary-100 my-4" />


              {/* Fecha y Hora */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Fecha y Hora *
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
                  value={form.date} 
                  onChange={e => setForm({...form, date: e.target.value})} 
                  required
                />
              </div>


              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Motivo
                </label>
                <textarea 
                  className="w-full border border-primary-200 p-2.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
                  rows="3" 
                  value={form.reason} 
                  onChange={e => setForm({...form, reason: e.target.value})} 
                  placeholder="Ej: Vacuna anual, consulta general..."
                ></textarea>
              </div>


              {/* ✅ BOTÓN AGENDAR CITA */}
              <button 
                type="submit"
                className="w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: pets.length === 0 || vets.length === 0 
                    ? 'linear-gradient(to right, #d1d5db, #9ca3af)'
                    : 'linear-gradient(to right, #10b981, #059669)',
                  cursor: pets.length === 0 || vets.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (pets.length > 0 && vets.length > 0) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pets.length > 0 && vets.length > 0) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
                disabled={pets.length === 0 || vets.length === 0}
              >
                <Calendar className="w-5 h-5" />
                Agendar Cita
              </button>
            </form>
          </div>


          {/* COLUMNA 2: LISTA DE CITAS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-primary-600" />
                Próximas Citas
              </h2>
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                {appointments.length} citas
              </span>
            </div>


            {appointments.length === 0 ? (
              <div className="bg-white rounded-card shadow-card p-12 text-center border border-dashed border-primary-300">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">No tienes citas programadas</h3>
                <p className="text-primary-600">Agenda una cita usando el formulario de la izquierda</p>
              </div>
            ) : (
              appointments.map(appt => (
                <div 
                  key={appt.id} 
                  className="bg-white p-5 rounded-card shadow-card border border-primary-100 hover:shadow-card-hover transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Fecha */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4 rounded-xl text-center min-w-[120px] shadow-md">
                      <Calendar className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-semibold uppercase opacity-90">Fecha</p>
                      <p className="font-bold text-sm mt-1">{appt.formatted_date}</p>
                    </div>


                    {/* Detalles */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg text-primary-900">{appt.pet_name}</h3>
                        <button 
                          onClick={() => handleDelete(appt.id)} 
                          className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" 
                          title="Cancelar cita"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>


                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-primary-700">
                          <Stethoscope className="w-4 h-4" />
                          <span className="font-medium">Dr. {appt.vet_name}</span>
                        </div>


                        {appt.reason && (
                          <div className="flex items-start gap-2 text-sm text-primary-600">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{appt.reason}</span>
                          </div>
                        )}


                        <div className="flex items-center gap-2 text-sm text-primary-500">
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
