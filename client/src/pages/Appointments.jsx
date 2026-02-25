// ============================================
// PAGES/APPOINTMENTS.JSX
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Calendar, MapPin, Stethoscope, Star, Trash2,
  ClipboardList, RefreshCw, Clock, PawPrint
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import AppointmentForm from "../components/AppointmentForm";
import RatingModal from '../components/RatingModal';

import { getAppointments, deleteAppointment, getUserProfile } from '../dataManager';

const STATUS_CONFIG = {
  completed: {
    label: 'Completada',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500'
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500'
  },
  scheduled: {
    label: 'Agendada',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500'
  }
};

const Appointments = () => {
  const [user, setUser]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);

  const [isRatingModalOpen, setIsRatingModalOpen]                         = useState(false);
  const [selectedVeterinarianForRating, setSelectedVeterinarianForRating] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId]                 = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, userData] = await Promise.all([
        getAppointments(),
        getUserProfile()
      ]);

      const formattedAppointments = Array.isArray(appointmentsData)
        ? appointmentsData.map(appt => {
            const rawDate = appt.raw_date || appt.date;
            const dateObj = rawDate ? new Date(rawDate) : null;
            const isValid = dateObj && !isNaN(dateObj.getTime());
            return {
              ...appt,
              formatted_date: isValid
                ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) +
                  ' · ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Fecha no disponible'
            };
          })
        : [];

      setAppointments(formattedAppointments);
      setUser(userData);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar citas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleNewAppointment = () => loadData();

  const handleOpenRatingModal = (appt) => {
    setSelectedVeterinarianForRating({ id: appt.vet_id, name: appt.vet_name });
    setSelectedAppointmentId(appt.id);
    setIsRatingModalOpen(true);
  };

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const scheduledCount = appointments.filter(a => a.status === 'scheduled').length;
  const pendingReviews = appointments.filter(a => a.status === 'completed' && !a.has_review).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />

      <div className="flex-1 lg:ml-72 min-w-0"> {/* ✅ min-w-0 evita desbordamiento */}
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={null} />

        <main className="px-4 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">

          {/* ── HEADER ── */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Mis Citas</h1>
            <p className="text-gray-400 mt-1 text-sm">Gestiona tus citas veterinarias</p>
          </div>

          {/* ── STATS RÁPIDAS ── */}
          {/* ✅ grid-cols-3 con texto truncado para móvil */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-50 p-2 sm:p-2.5 rounded-xl flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900">{scheduledCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">Agendadas</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="bg-emerald-50 p-2 sm:p-2.5 rounded-xl flex-shrink-0">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900">{completedCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">Completadas</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="bg-yellow-50 p-2 sm:p-2.5 rounded-xl flex-shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900">{pendingReviews}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">Sin calificar</p>
              </div>
            </div>
          </div>

          {/* ── FORMULARIO NUEVA CITA ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              Agendar Nueva Cita
            </h2>
            <AppointmentForm onAppointmentCreated={handleNewAppointment} />
          </div>

          {/* ── LISTA DE CITAS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="bg-blue-50 p-1.5 rounded-lg">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                </div>
                Historial de Citas
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {appointments.length} en total
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 text-sm">Cargando citas...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-700">Sin citas registradas</h3>
                <p className="text-gray-400 text-sm mt-1">Agenda tu primera cita veterinaria arriba.</p>
              </div>
            ) : (
              appointments.map((appt) => {
                const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

                      {/* INFO */}
                      <div className="flex gap-3 flex-1 min-w-0"> {/* ✅ min-w-0 */}
                        <div className="bg-blue-50 rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
                          <PawPrint className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        </div>

                        <div className="space-y-1 flex-1 min-w-0"> {/* ✅ min-w-0 */}
                          {/* Badge status + fecha */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusCfg.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {/* ✅ truncate evita desbordamiento en móvil */}
                              <span className="truncate max-w-[160px] sm:max-w-none">
                                {appt.formatted_date}
                              </span>
                            </span>
                          </div>

                          {/* Nombre mascota */}
                          <p className="font-bold text-gray-900 capitalize truncate">{appt.pet_name}</p>

                          {/* Veterinario */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                            <Stethoscope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{appt.vet_name}</span>
                            {appt.average_rating && (
                              <span className="flex items-center gap-0.5 ml-1 text-yellow-500 font-semibold text-xs flex-shrink-0">
                                <Star className="w-3 h-3 fill-current" />
                                {parseFloat(appt.average_rating).toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Clínica */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{appt.clinic_name}</span>
                          </div>

                          {/* Motivo */}
                          {appt.reason && (
                            <p className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg truncate max-w-xs sm:max-w-none">
                              "{appt.reason}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ACCIONES */}
                      <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[130px]">
                        {appt.status === 'completed' && appt.vet_id && !appt.has_review && (
                          <button
                            onClick={() => handleOpenRatingModal(appt)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white py-2 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-yellow-200"
                          >
                            <Star className="w-3.5 h-3.5" /> Calificar
                          </button>
                        )}

                        {appt.has_review && (
                          <div className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-yellow-50 text-yellow-600 border border-yellow-200 py-2 px-3 sm:px-4 rounded-xl text-sm font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" /> Calificado
                          </div>
                        )}

                        {appt.status === 'scheduled' && (
                          <button
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 py-2 px-3 sm:px-4 rounded-xl text-sm font-semibold border border-red-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* MODAL CALIFICACIÓN */}
      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          veterinarian={selectedVeterinarianForRating}
          appointmentId={selectedAppointmentId}
          onSuccess={() => { setIsRatingModalOpen(false); loadData(); }}
        />
      )}
    </div>
  );
};

export default Appointments;
