import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ClipboardCheck,
  Save,
  Calendar,
  User,
  Building2,
  Activity,
  CheckCircle,
  Thermometer,
  Heart,
  AlertTriangle
} from 'lucide-react';

const VetAccessPanel = () => {

  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const clinicName = searchParams.get('clinic') || 'Consulta General';
  const clinicId = searchParams.get('clinic_id');
  const vetName = searchParams.get('vet') || 'Veterinario';
  const timestamp = searchParams.get('ts');
  const appointmentId = searchParams.get('appointment_id');

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const [requiresReview, setRequiresReview] = useState(false);

  const [formData, setFormData] = useState({
    visit_type: 'Consulta General',
    diagnosis: '',
    treatment: '',
    weight: '',
    temperature: '',
    heart_rate: '',
    notes: '',
    next_visit: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // ===============================
  // VALIDAR QR + CARGAR MASCOTA
  // ===============================
  useEffect(() => {

    if (timestamp) {
      const diffMinutes = (Date.now() - parseInt(timestamp)) / 1000 / 60;
      if (diffMinutes > 20) {
        setExpired(true);
        setLoading(false);
        return;
      }
    }

    const fetchPet = async () => {
      try {

        const res = await fetch(`${API_URL}/public/pets/${id}`);

        if (!res.ok) throw new Error();

        const data = await res.json();
        setPet(data.pet);

      } catch (err) {
        console.error(err);
        toast.error("No se pudo verificar la mascota");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPet();

  }, [id, API_URL, timestamp]);

  // ===============================
  // SUBMIT
  // ===============================
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!token) {
      toast.error("Sesión expirada. Inicie sesión nuevamente.");
      return;
    }

    setSubmitting(true);

    try {

      const payload = {
        pet_id: id,
        clinic_name: clinicName,
        clinic_id: clinicId,
        veterinarian_name: vetName,
        ...formData
      };

      // GUARDAR HISTORIAL
      const response = await fetch(`${API_URL}/public/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error();

      // ===========================
      // FINALIZAR CITA EXISTENTE
      // ===========================
      if (appointmentId) {

        await fetch(`${API_URL}/appointments/finish/${appointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            requires_review: requiresReview,
            next_review_date: requiresReview ? formData.next_visit : null
          })
        });

      }

      // ===========================
      // CREAR CITA SI NO EXISTE
      // ===========================
      if (!appointmentId && requiresReview && formData.next_visit) {

        await fetch(`${API_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            pet_id: id,
            veterinarian_id: clinicId || null,
            date: formData.next_visit,
            reason: formData.diagnosis || "Revisión médica"
          })
        });

      }

      setSuccess(true);
      toast.success("Consulta registrada correctamente");

    } catch (err) {

      console.error(err);
      toast.error("Error al guardar");

    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ===============================
  // UI STATES
  // ===============================

  if (loading)
    return <div className="h-screen flex items-center justify-center">Verificando pase...</div>;

  if (expired)
    return <div className="h-screen flex items-center justify-center text-red-600 font-bold">Código QR Expirado</div>;

  if (success)
    return (
      <div className="h-screen flex items-center justify-center bg-green-50 flex-col">
        <CheckCircle className="w-24 h-24 text-green-600 mb-4" />
        <h1 className="text-2xl font-bold">¡Consulta Guardada!</h1>
        <p className="text-gray-500">Se registró correctamente</p>
      </div>
    );

  // ===============================
  // FORM
  // ===============================

  return (
    <div className="min-h-screen bg-green-50 pb-12">

      <div className="bg-green-700 text-white p-6">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-4 mb-4">
            <ClipboardCheck size={24} />
            <div>
              <h1 className="text-xl font-bold">Nueva Consulta</h1>
              <p className="text-green-100 text-sm">Sesión Segura Activa</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4 flex gap-4">

            <div className="flex items-center gap-2">
              <Building2 size={18}/>
              <div>
                <p className="text-xs">Lugar</p>
                <p className="font-bold">{clinicName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User size={18}/>
              <div>
                <p className="text-xs">Profesional</p>
                <p className="font-bold">{vetName}</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="mb-6 flex items-center gap-3">

            <img
              src={pet?.photo_url || 'https://via.placeholder.com/100'}
              alt="Mascota"
              className="w-16 h-16 rounded-full"
            />

            <div>
              <h2 className="text-xl font-bold">{pet?.name}</h2>
              <p className="text-gray-500">{pet?.breed}</p>
            </div>

          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              type="text"
              name="diagnosis"
              placeholder="Diagnóstico"
              required
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <textarea
              name="treatment"
              placeholder="Tratamiento"
              required
              value={formData.treatment}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl"
            />

            <div className="grid grid-cols-3 gap-4">

              <input
                type="number"
                name="weight"
                placeholder="Peso"
                value={formData.weight}
                onChange={handleChange}
                className="p-3 border rounded-xl"
              />

              <input
                type="number"
                name="temperature"
                placeholder="Temp"
                value={formData.temperature}
                onChange={handleChange}
                className="p-3 border rounded-xl"
              />

              <input
                type="number"
                name="heart_rate"
                placeholder="Pulso"
                value={formData.heart_rate}
                onChange={handleChange}
                className="p-3 border rounded-xl"
              />

            </div>

            <div className="bg-yellow-50 p-4 rounded-xl">

              <label>¿Requiere revisión?</label>

              <select
                value={requiresReview ? "yes" : "no"}
                onChange={(e) => setRequiresReview(e.target.value === "yes")}
                className="w-full p-3 border rounded-xl mt-2"
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>

              {requiresReview && (
                <input
                  type="datetime-local"
                  name="next_visit"
                  value={formData.next_visit}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-xl mt-2"
                />
              )}

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold"
            >
              {submitting ? "Guardando..." : "Finalizar y Guardar Consulta"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default VetAccessPanel;
