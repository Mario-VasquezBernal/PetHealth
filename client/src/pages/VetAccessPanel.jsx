import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ClipboardCheck, Save, User, Building2,
  CheckCircle, Thermometer, Heart, Weight, Clock, Loader
} from 'lucide-react';

const VetAccessPanel = () => {

  const { token } = useParams(); // ✅ token QR de la URL /qr/:token

  const [pet, setPet]               = useState(null);
  const [assignedVet, setAssignedVet]     = useState(null);
  const [assignedClinic, setAssignedClinic] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [requiresReview, setRequiresReview] = useState(false);

  const [formData, setFormData] = useState({
    visit_type:  'Consulta General',
    diagnosis:   '',
    treatment:   '',
    weight:      '',
    temperature: '',
    heart_rate:  '',
    notes:       '',
    next_visit:  ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  // ===============================
  // VALIDAR TOKEN QR
  // ✅ CAMBIO: usa /qr/validate/:token (BD) en lugar de query params
  // ===============================
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        const res = await fetch(`${API_URL}/qr/validate/${token}`);

        if (!res.ok) {
          setTokenValid(false);
          setLoading(false);
          return;
        }

        const data = await res.json();

        setPet(data.pet);
        setAssignedVet(data.assignedVet);
        setAssignedClinic(data.assignedClinic);
        setTokenValid(true);

        console.log('✅ Vet asignado:', data.assignedVet);
        console.log('✅ Clínica asignada:', data.assignedClinic);

      } catch (err) {
        console.error(err);
        setTokenValid(false);
        toast.error("Token inválido o expirado");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, API_URL]);

  // ===============================
  // SUBMIT
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.diagnosis || !formData.treatment) {
      return toast.warning('Completa diagnóstico y tratamiento');
    }

    setSubmitting(true);

    try {
      // ✅ CAMBIO: enviamos 'token' QR para que el servidor resuelva
      // pet_id, vet_id, clinic_id desde la BD — no desde query params
      const payload = {
        token,                                          // ✅ token QR → resuelve todo en el servidor
        diagnosis:         formData.diagnosis,
        treatment:         formData.treatment,
        recorded_weight:   formData.weight      ? parseFloat(formData.weight)      : null,
        temperature:       formData.temperature ? parseFloat(formData.temperature) : null,
        heart_rate:        formData.heart_rate  ? parseInt(formData.heart_rate)    : null,
        notes:             formData.notes       || null,
        next_visit:        requiresReview ? formData.next_visit : null,
        visit_type:        formData.visit_type,
        // fallback por si el servidor necesita nombres
        veterinarian_name: assignedVet?.name    || '',
        clinic_name:       assignedClinic?.name || '',
      };

      const response = await fetch(`${API_URL}/api/public/medical-records`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al guardar');
      }

      setSuccess(true);
      toast.success("✅ Consulta registrada correctamente");

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ===============================
  // UI STATES
  // ===============================
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <Loader className="w-10 h-10 text-green-600 animate-spin" />
      <p className="text-gray-600">Verificando pase médico...</p>
    </div>
  );

  if (!tokenValid) return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-4xl mb-4">⛔</p>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Código QR Inválido</h2>
      <p className="text-gray-500">Este código ha expirado o no es válido.<br/>Solicita uno nuevo al dueño de la mascota.</p>
    </div>
  );

  if (success) return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-50">
      <CheckCircle className="w-24 h-24 text-green-600 mb-4" />
      <h1 className="text-2xl font-bold">¡Consulta Guardada!</h1>
      <p className="text-gray-500 mt-2">El registro médico se guardó correctamente.</p>
    </div>
  );

  // ===============================
  // FORM
  // ===============================
  return (
    <div className="min-h-screen bg-green-50 pb-12">

      {/* HEADER */}
      <div className="bg-green-700 text-white p-6">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-4 mb-4">
            <ClipboardCheck size={24} />
            <div>
              <h1 className="text-xl font-bold">Nueva Consulta</h1>
              <p className="text-green-100 text-sm">Sesión Segura Activa</p>
            </div>
          </div>

          {/* INFO VET Y CLÍNICA — datos reales de la BD */}
          <div className="bg-black/20 rounded-xl p-4 flex gap-6">
            <div className="flex items-center gap-2">
              <User size={18} />
              <div>
                <p className="text-xs text-green-200">Profesional</p>
                <p className="font-bold">{assignedVet?.name || 'No asignado'}</p>
                {assignedVet?.specialty && (
                  <p className="text-xs text-green-200">{assignedVet.specialty}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={18} />
              <div>
                <p className="text-xs text-green-200">Clínica</p>
                <p className="font-bold">{assignedClinic?.name || 'Independiente'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow p-6">

          {/* INFO MASCOTA */}
          <div className="mb-6 flex items-center gap-3">
            <img
              src={
                pet?.photo_url ||
                `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='60' text-anchor='middle' font-size='40'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E`
              }
              alt="Mascota"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{pet?.name}</h2>
              <p className="text-gray-500">{pet?.species} — {pet?.breed || 'Mixto'}</p>
              {pet?.allergies && pet.allergies !== 'no' && (
                <p className="text-xs text-orange-600 font-semibold mt-1">⚠️ {pet.allergies}</p>
              )}
            </div>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Visita</label>
              <select
                name="visit_type"
                value={formData.visit_type}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl"
              >
                <option value="Consulta General">Consulta General</option>
                <option value="Emergencia">Emergencia</option>
                <option value="Seguimiento">Seguimiento</option>
                <option value="Cirugía">Cirugía</option>
                <option value="Rutina">Rutina</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Diagnóstico *</label>
              <input
                type="text" name="diagnosis" placeholder="Diagnóstico" required
                value={formData.diagnosis} onChange={handleChange}
                className="w-full p-3 border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tratamiento *</label>
              <textarea
                name="treatment" placeholder="Tratamiento" required
                value={formData.treatment} onChange={handleChange}
                rows={3}
                className="w-full p-3 border rounded-xl resize-none"
              />
            </div>

            {/* SIGNOS VITALES */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Weight size={12} /> Peso (kg)
                </label>
                <input type="number" step="0.1" name="weight"
                  placeholder="15.5" value={formData.weight} onChange={handleChange}
                  className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Thermometer size={12} className="text-orange-500" /> Temp (°C)
                </label>
                <input type="number" step="0.1" name="temperature"
                  placeholder="38.5" value={formData.temperature} onChange={handleChange}
                  className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Heart size={12} className="text-red-500" /> Pulso (bpm)
                </label>
                <input type="number" name="heart_rate"
                  placeholder="90" value={formData.heart_rate} onChange={handleChange}
                  className="w-full p-3 border rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notas adicionales</label>
              <textarea
                name="notes" placeholder="Observaciones, recomendaciones..."
                value={formData.notes} onChange={handleChange}
                rows={2}
                className="w-full p-3 border rounded-xl resize-none"
              />
            </div>

            {/* PRÓXIMA REVISIÓN */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Requiere revisión?
              </label>
              <select
                value={requiresReview ? "yes" : "no"}
                onChange={(e) => setRequiresReview(e.target.value === "yes")}
                className="w-full p-3 border rounded-xl"
              >
                <option value="no">No requiere revisión</option>
                <option value="yes">Sí, agendar próxima visita</option>
              </select>

              {requiresReview && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Clock size={12} /> Fecha de próxima revisión
                  </label>
                  <input
                    type="datetime-local" name="next_visit"
                    value={formData.next_visit} onChange={handleChange} required
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              )}
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader className="w-5 h-5 animate-spin" /> Guardando...</>
              ) : (
                <><Save size={18} /> Finalizar y Guardar Consulta</>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default VetAccessPanel;
