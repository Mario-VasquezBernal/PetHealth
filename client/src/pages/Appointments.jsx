// ============================================
// APPOINTMENTS.JSX
// ============================================
// Página de gestión de citas veterinarias
// Permite ver, cancelar y calificar citas
// =========================================
import StarRating from '../components/StarRating';
import AppointmentForm from "../components/AppointmentForm";
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import RatingModal from '../components/RatingModal';
import {
  getAppointments,
  deleteAppointment,
  getUserProfile
} from '../dataManager';
import VetManagement from '../components/VetManagement';
import ClinicManagement from '../components/ClinicManagement';
import axios from 'axios';
import {
  Calendar,
  MapPin,
  Stethoscope,
  X,
  Star,
  Pencil,
  Trash2
} from 'lucide-react';

const Appointments = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedVeterinarianForRating, setSelectedVeterinarianForRating] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
 

  // ==========================
  // LOAD DATA (ESLint friendly)
  // ==========================

  useEffect(() => {
    const load = async () => {
      try {
        const [appointmentsData, userData] = await Promise.all([
          getAppointments(),
          getUserProfile()
        ]);

        const formattedAppointments = Array.isArray(appointmentsData)
          ? appointmentsData.map(appt => ({
              ...appt,
              formatted_date:
                new Date(appt.raw_date || appt.date).toLocaleDateString() +
                ' ' +
                new Date(appt.raw_date || appt.date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
            }))
          : [];

        setAppointments(formattedAppointments);
        setUser(userData);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar citas');
      }
    };

    load();
  }, []);

  // ==========================
  // RELOAD DATA (outside effect)
  // ==========================

  const reloadAppointments = async () => {
    try {
      const [appointmentsData, userData] = await Promise.all([
        getAppointments(),
        getUserProfile()
      ]);

      const formattedAppointments = Array.isArray(appointmentsData)
        ? appointmentsData.map(appt => ({
            ...appt,
            formatted_date:
              new Date(appt.raw_date || appt.date).toLocaleDateString() +
              ' ' +
              new Date(appt.raw_date || appt.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
          }))
        : [];

      setAppointments(formattedAppointments);
      setUser(userData);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar citas');
    }
  };

  // ==========================
  // APPOINTMENTS
  // ==========================

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;

    try {
      await deleteAppointment(id);
      toast.info('Cita cancelada');
      reloadAppointments();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cancelar la cita');
    }
  };

  // ==========================
  // REVIEWS
  // ==========================

const openRatingModal = (appt) => {
  setSelectedVeterinarianForRating({
    id: appt.vet_id,
    name: appt.vet_name
  });
  setSelectedAppointmentId(appt.id);
  setIsRatingModalOpen(true);
};


  const openEditRatingModal = (appointment) => {
    setSelectedVeterinarianForRating({
      id: appointment.vet_id,
      name: appointment.vet_name
    });
    setSelectedAppointmentId(appointment.id);
   
    setIsRatingModalOpen(true);
  };

  const deleteRating = async (reviewId) => {
    if (!window.confirm('¿Eliminar esta calificación?')) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/ratings/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Calificación eliminada');
      reloadAppointments();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar la calificación');
    }
  };

  // ==========================
  /// RENDER
// ==========================

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

      <main className="px-4 lg:px-8 py-8 space-y-4">

        {/* FORMULARIO DE CITA */}
        <AppointmentForm onCreated={reloadAppointments} />

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Mis citas
        </h1>

        {appointments.length === 0 && (
          <p className="text-gray-600">No tienes citas registradas.</p>
        )}

        {appointments.map(appt => (
          <div
            key={appt.id}
            className="bg-white p-4 rounded-xl shadow border space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{appt.pet_name}</h3>
              <button
                onClick={() => handleDeleteAppointment(appt.id)}
                className="text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-sm text-gray-600 flex flex-col gap-1">
  <div className="flex items-center gap-2">
    <Stethoscope size={16} />
    Dr. {appt.vet_name}
  </div>

  <StarRating value={appt.average_rating} />
</div>


            <div className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin size={16} />
              {appt.clinic_name}
            </div>

            <div className="text-sm text-gray-600">
              {appt.formatted_date}
            </div>

            {/* BOTONES REVIEW */}
            {appt.status === 'Completada' && !appt.has_review && (
              <button
                onClick={() => openRatingModal(appt)}
                className="mt-2 flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded"
              >
                <Star size={16} />
                Calificar
              </button>
            )}

            {appt.has_review && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openEditRatingModal(appt)}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded"
                >
                  <Pencil size={14} />
                  Editar
                </button>

                <button
                  onClick={() => deleteRating(appt.review_id)}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>

    {isVetModalOpen && (
      <VetManagement
        onClose={() => {
          setIsVetModalOpen(false);
          reloadAppointments();
        }}
      />
    )}

    {isClinicModalOpen && (
      <ClinicManagement
        onClose={() => {
          setIsClinicModalOpen(false);
          reloadAppointments();
        }}
      />
    )}

    <RatingModal
  isOpen={isRatingModalOpen}
  veterinarian={selectedVeterinarianForRating}
  appointmentId={selectedAppointmentId}
  onClose={() => setIsRatingModalOpen(false)}
  onSuccess={reloadAppointments}
/>

  </div>
);
};

export default Appointments;
