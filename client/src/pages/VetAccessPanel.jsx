import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ClipboardCheck, Save, Stethoscope, Syringe, Calendar, User, Building2, 
  Activity, CheckCircle, Clock, Thermometer, Heart, AlertTriangle 
} from 'lucide-react';

const VetAccessPanel = () => {
  const { id } = useParams(); // sigue siendo el petId (para el medical record)
  const [searchParams] = useSearchParams();

  // CONTEXTO
  const clinicName = searchParams.get('clinic') || 'Consulta General';
  const clinicId = searchParams.get('clinic_id');
  const vetName = searchParams.get('vet') || 'Veterinario';
  const timestamp = searchParams.get('ts');

  // 👉 NUEVO: id real de la cita
  const appointmentId = searchParams.get('appointment_id');

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  // 👉 NUEVO
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

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api`;

  useEffect(() => {
    if (timestamp) {
      const diffMinutes = (Date.now() - parseInt(timestamp)) / 1000 / 60;
      if (diffMinutes > 20) {
        setExpired(true);
        setLoading(false);
        return;
      }
    }

    const fetchPetBasicInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/public/pets/${id}`);
        if (!response.ok) throw new Error('Error al cargar datos');
        const data = await response.json();
        setPet(data.pet);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo verificar la mascota');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPetBasicInfo();
  }, [id, API_URL, timestamp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {

      const payload = {
        pet_id: id,

        clinic_name: clinicName,
        clinic_id: clinicId,
        veterinarian_name: vetName,

        ...formData
      };

      const response = await fetch(`${API_URL}/public/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar');

      // 👉 NUEVO → finalizar la cita
      if (appointmentId) {
        await fetch(`${API_URL}/appointments/finish/${appointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requires_review: requiresReview,
            next_review_date: requiresReview ? formData.next_visit : null
          })
        });
      } else {
        console.warn("No se recibió appointment_id en el QR");
      }

      setSuccess(true);
      toast.success('Consulta registrada correctamente');

    } catch (error) {
      console.error(error);
      toast.error('Error al guardar. Intente nuevamente.');
      setSubmitting(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  if (loading)
    return <div className="h-screen flex items-center justify-center bg-gray-50">Verificando pase...</div>;

  if (expired)
    return <div className="h-screen flex items-center justify-center text-red-600 font-bold">Código QR Expirado</div>;

  if (success)
    return (
      <div className="h-screen flex items-center justify-center bg-green-50 flex-col p-6 text-center animate-in zoom-in">
        <CheckCircle className="w-24 h-24 text-green-600 mb-4" />
        <h1 className="text-3xl font-black text-gray-900 mb-2">¡Consulta Guardada!</h1>
        <p className="text-gray-500">Se ha registrado la consulta correctamente.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-green-50/50 pb-12">

      <div className="bg-green-700 text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-2 rounded-full">
              <ClipboardCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nueva Consulta</h1>
              <p className="text-green-100 text-sm">Sesión Segura Activa</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Building2 size={18} className="text-green-300"/>
              </div>
              <div>
                <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Lugar de Atención</p>
                <p className="font-bold text-lg">{clinicName}</p>
              </div>
            </div>

            <div className="hidden sm:block w-px bg-white/20"></div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <User size={18} className="text-green-300"/>
              </div>
              <div>
                <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Profesional</p>
                <p className="font-bold text-lg">{vetName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

          <div className="mb-6 flex items-center gap-3 pb-6 border-b border-gray-100">
            <img
              src={pet?.photo_url || 'https://via.placeholder.com/100'}
              alt="Mascota"
              className="w-16 h-16 rounded-full object-cover border-2 border-green-100"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{pet?.name}</h2>
              <p className="text-gray-500 text-sm">{pet?.breed}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 block">
                Tipo de Visita
              </label>
              <div className="flex gap-2 flex-wrap">
                {['Consulta General', 'Vacunación', 'Control', 'Emergencia', 'Cirugía'].map(type => (
                  <label
                    key={type}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${
                      formData.visit_type === type
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visit_type"
                      value={type}
                      checked={formData.visit_type === type}
                      onChange={handleChange}
                      className="hidden"
                    />
                    {type === 'Emergencia' && <AlertTriangle size={14} className="inline mr-1 mb-0.5"/>}
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Activity size={16} className="text-green-600"/> Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  required
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Thermometer size={16} className="text-orange-500"/> Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Heart size={16} className="text-red-500"/> Frec. Cardíaca
                </label>
                <input
                  type="number"
                  name="heart_rate"
                  value={formData.heart_rate}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600"/> Diagnóstico Principal *
              </label>
              <input
                type="text"
                name="diagnosis"
                required
                value={formData.diagnosis}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Syringe size={16} className="text-purple-600"/> Tratamiento / Procedimiento *
              </label>
              <textarea
                name="treatment"
                required
                rows="4"
                value={formData.treatment}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>

            {/* NUEVO BLOQUE */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 space-y-3">
              <label className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                <Calendar size={16}/> ¿Requiere revisión?
              </label>

              <select
                value={requiresReview ? "yes" : "no"}
                onChange={(e) => setRequiresReview(e.target.value === "yes")}
                className="w-full p-3 bg-white rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
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
                  className="w-full p-3 bg-white rounded-xl border border-yellow-300 focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Finalizar y Guardar Consulta'}
                <Save size={20} />
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default VetAccessPanel;
