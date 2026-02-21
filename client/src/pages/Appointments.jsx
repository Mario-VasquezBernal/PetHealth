// ============================================
// PAGES/APPOINTMENTS.JSX
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar, MapPin, Stethoscope, X, Star, Pencil, Trash2, ClipboardList, RefreshCw // ✅ CAMBIO: agregar RefreshCw
} from 'lucide-react';


// Componentes
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import AppointmentForm from "../components/AppointmentForm";
import RatingModal from '../components/RatingModal';
import StarRating from '../components/StarRating';


// Data
import { getAppointments, deleteAppointment, getUserProfile } from '../dataManager';


const Appointments = () => {
  const [user, setUser]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [appointments, setAppointments] = useState([]);


  // Estados para Modal de Calificación
  const [isRatingModalOpen, setIsRatingModalOpen]                         = useState(false);
  const [selectedVeterinarianForRating, setSelectedVeterinarianForRating] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId]                 = useState(null);


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


  // --- 1. FUNCIÓN DE CARGA (Estable) ---
  const loadData = useCallback(async () => {
    try {
      const [appointmentsData, userData] = await Promise.all([
        getAppointments(),
        getUserProfile()
      ]);


      const formattedAppointments = Array.isArray(appointmentsData)
        ? appointmentsData.map(appt => {
            // ✅ CAMBIO: proteger fecha inválida — antes new Date(null) daba "Invalid Date"
            const rawDate = appt.raw_date || appt.date;
            const dateObj = rawDate ? new Date(rawDate) : null;
            const isValid = dateObj && !isNaN(dateObj.getTime());
            return {
              ...appt,
              formatted_date: isValid
                ? dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Fecha no disponible'
            };
          })
        : [];


      setAppointments(formattedAppointments);
      setUser(userData);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar citas');
    }
  }, []); // Array vacío = Esta función nunca cambia


  // --- 2. EFECTO DE INICIO ---
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío = Ejecutar SOLO al montar el componente (Evita bucles)


  // --- ACCIONES ---
  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await deleteAppointment(id);
      toast.success('Cita cancelada');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al cancelar cita');
    }
  };


  const handleNewAppointment = () => {
    loadData();
  };


  // ✅ FIX: recibe appt completo y construye objeto { id, name } que RatingModal necesita
  const handleOpenRatingModal = (appt) => {
    setSelectedVeterinarianForRating({ id: appt.vet_id, name: appt.vet_name });
    setSelectedAppointmentId(appt.id);
    setIsRatingModalOpen(true);
  };




  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />


      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={null} />


        <main className="px-4 lg:px-8 py-8 max-w-5xl mx-auto">


          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Mis Citas</h1>
              <p className="text-gray-500 mt-1">Gestiona tus citas veterinarias</p>
            </div>
            {/* ✅ CAMBIO: Botón de refrescar */}
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl border border-blue-200 font-medium text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>


          {/* FORMULARIO NUEVA CITA */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" /> Agendar Nueva Cita
            </h2>
            <AppointmentForm onAppointmentCreated={handleNewAppointment} />
          </div>


          {/* LISTA DE CITAS */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Citas Agendadas ({appointments.length})
            </h2>


            {appointments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Sin citas agendadas</h3>
                <p className="text-gray-500">Agenda tu primera cita veterinaria arriba.</p>
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">


                    {/* INFO PRINCIPAL */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          appt.status === 'completed'  ? 'bg-green-100 text-green-700'  :
                          appt.status === 'cancelled'  ? 'bg-red-100 text-red-700'      :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {appt.status === 'completed' ? 'Completada' :
                           appt.status === 'cancelled'  ? 'Cancelada'  : 'Agendada'}
                        </span>
                        <span className="text-sm text-gray-500">{appt.formatted_date}</span>
                      </div>


                      <p className="font-bold text-gray-900 text-lg">{appt.pet_name}</p>


                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Stethoscope className="w-4 h-4" />
                        <span>{appt.vet_name}</span>
                        {appt.average_rating && (
                          <span className="flex items-center gap-1 ml-2 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            {parseFloat(appt.average_rating).toFixed(1)}
                          </span>
                        )}
                      </div>


                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{appt.clinic_name}</span>
                      </div>


                      {appt.reason && (
                        <p className="text-sm text-gray-500 italic">"{appt.reason}"</p>
                      )}
                    </div>


                    {/* ACCIONES */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {appt.status === 'completed' && appt.vet_id && !appt.has_review && (
                        <button
                          onClick={() => handleOpenRatingModal(appt)} // ✅ FIX: antes (appt.vet_id, appt.id)
                          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-xl text-sm font-medium transition-all"
                        >
                          <Star className="w-4 h-4" /> Calificar
                        </button>
                      )}


                      {appt.has_review && (
                        <div className="flex items-center justify-center gap-1 text-yellow-500 text-sm font-medium">
                          <Star className="w-4 h-4 fill-current" /> Calificado
                        </div>
                      )}


                      {appt.status === 'scheduled' && (
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded-xl text-sm font-medium border border-red-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" /> Cancelar
                        </button>
                      )}
                    </div>


                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>


      {/* MODAL DE CALIFICACIÓN */}
      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          veterinarian={selectedVeterinarianForRating}         // ✅ FIX: antes veterinarianId
          appointmentId={selectedAppointmentId}                // ✅ FIX: antes faltaba
          onSuccess={() => { setIsRatingModalOpen(false); loadData(); }} // ✅ FIX: antes onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};


export default Appointments;
