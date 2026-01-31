// ============================================
// COMPONENTS/APPOINTMENTFORM.JSX
// ============================================
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, User, Calendar, PawPrint } from 'lucide-react';
import { toast } from 'react-toastify';

const AppointmentForm = ({ onSuccess }) => {
  // Datos maestros
  const [clinics, setClinics] = useState([]);
  const [vets, setVets] = useState([]);
  const [pets, setPets] = useState([]); // Lista de mascotas

  // Estados de selección
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedPet, setSelectedPet] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  
  // Estado derivado: ¿Es el veterinario seleccionado independiente?
  const [isIndependent, setIsIndependent] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 1. Cargar Datos al inicio (Clínicas, Vets y Mascotas)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Peticiones en paralelo
        // NOTA: Si tu ruta de mascotas es diferente (ej: /api/vet/pets), cámbiala aquí abajo
        const [clinicsRes, vetsRes, petsRes] = await Promise.all([
          axios.get(`${API_URL}/clinics`, config), 
          axios.get(`${API_URL}/veterinarians/directory/all`, config),
          axios.get(`${API_URL}/pets`, config) // <--- Petición directa (sin dataManager)
        ]);

        setClinics(clinicsRes.data.clinics || []);
        
        // Manejo robusto de vets
        const vetsData = vetsRes.data.veterinarians || vetsRes.data || [];
        setVets(vetsData);

        // Manejo robusto de mascotas
        const petsData = petsRes.data.pets || petsRes.data || [];
        setPets(petsData);

      } catch (error) {
        console.error("Error cargando datos:", error);
        // No mostramos error al usuario para no saturar, pero lo logueamos
      }
    };
    fetchData();
  }, [API_URL]);

  // 2. Lógica Inteligente: Cambio de Clínica
  const handleClinicChange = (e) => {
    const clinicId = e.target.value;
    setSelectedClinic(clinicId);
    setSelectedVet(''); // Reseteamos vet
    setIsIndependent(false);
  };

  // 3. Lógica Inteligente: Cambio de Veterinario
  const handleVetChange = (e) => {
    const vetId = e.target.value;
    setSelectedVet(vetId);

    // Buscar info del doctor
    const vetInfo = vets.find(v => v.id === vetId || v.id === parseInt(vetId));

    if (vetInfo) {
      if (vetInfo.clinic_id) {
        // CASO A: Tiene clínica -> Auto-seleccionar la clínica
        setSelectedClinic(vetInfo.clinic_id);
        setIsIndependent(false);
      } else {
        // CASO B: Es Independiente -> Limpiar clínica y marcar flag
        setSelectedClinic(''); 
        setIsIndependent(true);
      }
    }
  };

  // 4. Filtrado de Veterinarios
  const filteredVets = selectedClinic 
    ? vets.filter(v => v.clinic_id === selectedClinic || v.clinic_id === parseInt(selectedClinic))
    : vets;

  // 5. Enviar Cita
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedPet) return toast.warning('Selecciona una mascota');
    if(!selectedVet) return toast.warning('Selecciona un veterinario');
    if(!isIndependent && !selectedClinic) return toast.warning('Selecciona una clínica');
    if(!date || !time) return toast.warning('Selecciona fecha y hora');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_URL}/appointments`, {
        pet_id: selectedPet,
        veterinarian_id: selectedVet,
        clinic_id: isIndependent ? null : selectedClinic,
        date: `${date} ${time}`, // Combinar fecha y hora
        reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Cita agendada correctamente");
      
      // Limpiar form
      setReason('');
      setDate('');
      setTime('');
      if (onSuccess) onSuccess(); // Recargar la lista de citas en el padre

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
           <Calendar className="text-blue-600"/> Nueva Cita
        </h2>
        <p className="text-sm text-gray-500">Completa los datos para agendar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* MASCOTA */}
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">Mascota</label>
           <div className="relative">
             <PawPrint className="absolute left-3 top-3 text-gray-400" size={18}/>
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

        {/* CLÍNICA (Inteligente) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Clínica</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all
                ${isIndependent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
              `}
              value={selectedClinic}
              onChange={handleClinicChange}
              disabled={isIndependent}
            >
              <option value="">Seleccionar Clínica...</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {isIndependent && <span className="text-xs text-green-600 font-bold ml-1">* Atención Independiente</span>}
          </div>
        </div>

        {/* VETERINARIO (Inteligente) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Veterinario</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedVet}
              onChange={handleVetChange}
            >
              <option value="">Seleccionar Veterinario...</option>
              
              {/* Opción 1: Filtrados por clínica */}
              {selectedClinic && filteredVets.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.specialty || 'General'})</option>
              ))}

              {/* Opción 2: Todos agrupados (si no hay clínica) */}
              {!selectedClinic && (
                <>
                  <optgroup label="Independientes">
                    {vets.filter(v => !v.clinic_id).map(v => (
                      <option key={v.id} value={v.id}>{v.name} (Indep.)</option>
                    ))}
                  </optgroup>
                  <optgroup label="En Clínicas">
                    {vets.filter(v => v.clinic_id).map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.clinic_name || 'Clínica'}</option>
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