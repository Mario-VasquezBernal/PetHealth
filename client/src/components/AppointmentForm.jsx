// ============================================
// COMPONENTS/APPOINTMENTFORM.JSX
// ============================================
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, User, Calendar, PawPrint, Clock, AlignLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const AppointmentForm = ({ onSuccess }) => {
  const [clinics, setClinics] = useState([]);
  const [vets, setVets] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedPet, setSelectedPet] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [isIndependent, setIsIndependent] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Obtener fecha de hoy en formato YYYY-MM-DD para validación
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [clinicsRes, vetsRes, petsRes] = await Promise.all([
          axios.get(`${API_URL}/clinics`, config),
          axios.get(`${API_URL}/veterinarians/directory/all`, config),
          axios.get(`${API_URL}/auth/pets`, config)
        ]);
        setClinics(clinicsRes.data.clinics || []);
        setVets(vetsRes.data.veterinarians || vetsRes.data || []);
        setPets(petsRes.data.pets || petsRes.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, [API_URL]);

  const handleClinicChange = (e) => {
    const value = e.target.value;
    setSelectedVet('');
    if (value === 'independent') {
      setSelectedClinic('independent');
      setIsIndependent(true);
    } else {
      setSelectedClinic(value);
      setIsIndependent(false);
    }
  };

  const handleVetChange = (e) => {
    const vetId = e.target.value;
    setSelectedVet(vetId);
    const vetInfo = vets.find(v => v.id === vetId || v.id === parseInt(vetId));
    if (vetInfo) {
      if (vetInfo.clinic_id) {
        setSelectedClinic(vetInfo.clinic_id);
        setIsIndependent(false);
      } else {
        setSelectedClinic('independent');
        setIsIndependent(true);
      }
    }
  };

  const filteredVets =
    selectedClinic === 'independent'
      ? vets.filter(v => !v.clinic_id)
      : selectedClinic
      ? vets.filter(v => v.clinic_id === selectedClinic || v.clinic_id === parseInt(selectedClinic))
      : vets;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIONES
    if (!selectedPet) return toast.warning('🐶 Selecciona una mascota');
    if (!selectedVet) return toast.warning('👨‍⚕️ Selecciona un veterinario');
    if (!isIndependent && !selectedClinic) return toast.warning('🏥 Selecciona una clínica');
    if (!date) return toast.warning('📅 Selecciona la fecha');
    if (!time) return toast.warning('⏰ Selecciona la hora');
    
    // Validación de fecha pasada
    if (date < todayStr) return toast.error('❌ No puedes agendar citas en fechas pasadas');

    // Validación de motivo
    if (!reason.trim()) return toast.warning('📋 Escribe el motivo de la consulta');
    if (reason.trim().length < 5) return toast.warning('📋 El motivo debe ser más detallado (mín. 5 letras)');
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\\s,.-]+$/.test(reason)) {
      return toast.warning('📋 El motivo contiene caracteres no permitidos');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/appointments`, {
        pet_id: selectedPet,
        veterinarian_id: selectedVet,
        clinic_id: isIndependent ? null : selectedClinic,
        date: `${date} ${time}`,
        reason: reason.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("✅ Cita agendada correctamente");
      setReason(''); setDate(''); setTime('');
      setSelectedVet(''); setSelectedClinic(''); setIsIndependent(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("❌ Error al agendar la cita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 mx-auto max-w-2xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center justify-center gap-2">
          <Calendar className="text-blue-600" /> Nueva Cita
        </h2>
        <p className="text-sm text-gray-500">Completa los datos para agendar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        {/* MASCOTA */}
        <div className="space-y-1">
          <label className="block text-xs font-black uppercase text-gray-500 ml-1">Mascota</label>
          <div className="relative">
            <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              autoComplete="none"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
            >
              <option value="">Seleccionar Mascota...</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* CLÍNICA */}
        <div className="space-y-1">
          <label className="block text-xs font-black uppercase text-gray-500 ml-1">Clínica</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              autoComplete="none"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
              value={selectedClinic}
              onChange={handleClinicChange}
            >
              <option value="">Seleccionar Clínica...</option>
              <option value="independent">🏠 Independiente / A Domicilio</option>
              <option disabled>──────────────</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {isIndependent && (
            <span className="inline-block mt-1 text-[10px] text-emerald-600 font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              ✓ Atención independiente — sin clínica asignada
            </span>
          )}
        </div>

        {/* VETERINARIO */}
        <div className="space-y-1">
          <label className="block text-xs font-black uppercase text-gray-500 ml-1">
            Veterinario {isIndependent && <span className="text-emerald-500 lowercase">(solo independientes)</span>}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              autoComplete="none"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
              value={selectedVet}
              onChange={handleVetChange}
            >
              <option value="">Seleccionar Veterinario...</option>
              {selectedClinic && filteredVets.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.specialty || 'Gral.'})
                </option>
              ))}
              {!selectedClinic && (
                <>
                  <optgroup label="Independientes">
                    {vets.filter(v => !v.clinic_id).map(v => (
                      <option key={v.id} value={v.id}>{v.name} (Indep.)</option>
                    ))}
                  </optgroup>
                  <optgroup label="En Clínicas">
                    {vets.filter(v => v.clinic_id).map(v => (
                      <option key={v.id} value={v.id}>{v.name} — {v.clinic_name || 'Clínica'}</option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>
        </div>

        {/* FECHA Y HORA — Ajuste Grid Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-gray-500 ml-1">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                min={todayStr}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase text-gray-500 ml-1">Hora</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="time"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* MOTIVO */}
        <div className="space-y-1">
          <label className="block text-xs font-black uppercase text-gray-500 ml-1">Motivo de consulta</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-4 text-gray-400" size={18} />
            <textarea
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium resize-none min-h-[100px]"
              placeholder="Ej: Control de vacunas, desparasitación..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {loading ? 'Procesando...' : 'Confirmar Cita 🐾'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
