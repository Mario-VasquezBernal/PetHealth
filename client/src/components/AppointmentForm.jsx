// ============================================
// COMPONENTS/APPOINTMENTFORM.JSX
// ============================================
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, User, Calendar, PawPrint } from 'lucide-react';
import { toast } from 'react-toastify';

const AppointmentForm = ({ onSuccess }) => {
  const [clinics, setClinics]       = useState([]);
  const [vets, setVets]             = useState([]);
  const [pets, setPets]             = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedVet, setSelectedVet]       = useState('');
  const [selectedPet, setSelectedPet]       = useState('');
  const [date, setDate]             = useState('');
  const [time, setTime]             = useState('');
  const [reason, setReason]         = useState('');
  const [isIndependent, setIsIndependent]   = useState(false);
  const [loading, setLoading]       = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 1. Cargar datos al inicio
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

  // 2. Cambio de Clínica — ✅ nuevo caso 'independent'
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

  // 3. Cambio de Veterinario — auto-selecciona clínica/independiente
  const handleVetChange = (e) => {
    const vetId = e.target.value;
    setSelectedVet(vetId);
    const vetInfo = vets.find(v => v.id === vetId || v.id === parseInt(vetId));
    if (vetInfo) {
      if (vetInfo.clinic_id) {
        setSelectedClinic(vetInfo.clinic_id);
        setIsIndependent(false);
      } else {
        setSelectedClinic('independent'); // ✅ auto-marca independiente
        setIsIndependent(true);
      }
    }
  };

  // 4. Filtrado de veterinarios según clínica seleccionada
  const filteredVets =
    selectedClinic === 'independent'
      ? vets.filter(v => !v.clinic_id)                                           // solo independientes
      : selectedClinic
        ? vets.filter(v => v.clinic_id === selectedClinic || v.clinic_id === parseInt(selectedClinic)) // solo de esa clínica
        : vets;                                                                   // todos (sin filtro)

  // 5. Enviar cita
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPet)                         return toast.warning('Selecciona una mascota');
    if (!selectedVet)                         return toast.warning('Selecciona un veterinario');
    if (!isIndependent && !selectedClinic)    return toast.warning('Selecciona una clínica');
    if (!date || !time)                       return toast.warning('Selecciona fecha y hora');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/appointments`, {
        pet_id:          selectedPet,
        veterinarian_id: selectedVet,
        clinic_id:       isIndependent ? null : selectedClinic,
        date:            `${date} ${time}`,
        reason
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success("Cita agendada correctamente");
      setReason(''); setDate(''); setTime('');
      setSelectedVet(''); setSelectedClinic(''); setIsIndependent(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Error al agendar la cita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calendar className="text-blue-600" /> Nueva Cita
        </h2>
        <p className="text-sm text-gray-500">Completa los datos para agendar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* MASCOTA */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mascota</label>
          <div className="relative">
            <PawPrint className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
            >
              <option value="">Seleccionar Mascota...</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* CLÍNICA — ✅ nueva opción Independiente */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Clínica</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedClinic}
              onChange={handleClinicChange}
            >
              <option value="">Seleccionar Clínica...</option>

              {/* ✅ Opción especial independiente */}
              <option value="independent">🏠 Independiente</option>

              {/* Separador visual */}
              <option disabled>──────────────</option>

              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Badge visual cuando está en modo independiente */}
            {isIndependent && (
              <span className="inline-block mt-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ Atención independiente — sin clínica asignada
              </span>
            )}
          </div>
        </div>

        {/* VETERINARIO — filtrado según selección */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Veterinario
            {isIndependent && (
              <span className="ml-2 text-xs text-emerald-500 font-normal">solo independientes</span>
            )}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedVet}
              onChange={handleVetChange}
            >
              <option value="">Seleccionar Veterinario...</option>

              {/* Con clínica seleccionada (real o independiente): lista plana */}
              {selectedClinic && filteredVets.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.specialty || 'General'})
                </option>
              ))}

              {/* Sin clínica: lista agrupada */}
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

        {/* FECHA Y HORA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
            <input
              type="time"
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* MOTIVO */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Motivo</label>
          <textarea
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows="2"
            placeholder="Ej: Vacunación anual..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
        >
          {loading ? 'Agendando...' : 'Confirmar Cita'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
