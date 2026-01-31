// ============================================
// PAGES/APPOINTMENTS.JSX
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Calendar, MapPin, Stethoscope, X, Star, Pencil, Trash2
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
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Estados para Modal de Calificación
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedVeterinarianForRating, setSelectedVeterinarianForRating] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // --- 1. FUNCIÓN DE CARGA (Estable) ---
  const loadData = useCallback(async () => {
    try {
      const [appointmentsData, userData] = await Promise.all([
        getAppointments(),
        getUserProfile()
      ]);

      const formattedAppointments = Array.isArray(appointmentsData)
        ? appointmentsData.map(appt => ({
            ...appt,
            formatted_date: new Date(appt.raw_date || appt.date).toLocaleDateString() + ' ' +
                            new Date(appt.raw_date || appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
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
      toast.info('Cita cancelada');
      loadData(); // Reutilizamos la función
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cancelar la cita');
    }
  };

  const deleteRating = async (reviewId) => {
    if (!window.confirm('¿Eliminar esta calificación?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/ratings/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Calificación eliminada');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar calificación');
    }
  };

  // --- MODALES ---

  const openRatingModal = (appt) => {
    setSelectedVeterinarianForRating({ id: appt.vet_id, name: appt.vet_name });
    setSelectedAppointmentId(appt.id);
    setIsRatingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 lg:px-8 py-8 max-w-5xl mx-auto">

          {/* FORMULARIO INTELIGENTE */}
          <AppointmentForm onSuccess={loadData} />

          {/* LISTADO DE CITAS */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
              <Calendar className="w-6 h-6 text-blue-600" />
              Historial de Citas
            </h1>

            {appointments.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                No tienes citas registradas aún.
              </div>
            ) : (
              appointments.map(appt => (
                <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                  
                  {/* Header Cita */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{appt.pet_name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{appt.status || 'Pendiente'}</p>
                    </div>
                    
                    {/* Botón Cancelar */}
                    {appt.status !== 'Completada' && appt.status !== 'Cancelada' && (
                      <button onClick={() => handleDeleteAppointment(appt.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-blue-500"/>
                      <span>Dr. {appt.vet_name}</span>
                      <StarRating value={appt.average_rating} />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-500"/>
                      <span>{appt.clinic_name || 'Atención a Domicilio / Independiente'}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Calendar size={16} className="text-green-500"/>
                      <span className="font-semibold">{appt.formatted_date}</span>
                    </div>
                  </div>

                  {/* Acciones de Reseña */}
                  <div className="pt-3 border-t border-gray-50 flex gap-2">
                    {appt.status === 'Completada' && !appt.has_review && (
                      <button 
                        onClick={() => openRatingModal(appt)}
                        className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-yellow-100 transition-colors"
                      >
                        <Star size={14} className="fill-yellow-600"/> Calificar Atención
                      </button>
                    )}

                    {appt.has_review && (
                      <>
                        <button onClick={() => openRatingModal(appt)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100">
                          <Pencil size={12} /> Editar Reseña
                        </button>
                        <button onClick={() => deleteRating(appt.review_id)} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100">
                          <Trash2 size={12} /> Borrar
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <RatingModal
        isOpen={isRatingModalOpen}
        veterinarian={selectedVeterinarianForRating}
        appointmentId={selectedAppointmentId}
        onClose={() => setIsRatingModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Appointments;