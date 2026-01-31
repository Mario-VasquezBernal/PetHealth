// ============================================
// COMPONENTS/MEDICALHISTORY.JSX
// ============================================
// Componente interno para visualizar el historial.
// Reemplaza la lista simple con el diseño de tarjetas profesionales.
// Incluye: Signos vitales, badges de tipo de visita y alertas.
// ============================================

import { useState, useEffect } from 'react';
import { 
  Calendar, Weight, Activity, Clock, User, MapPin, 
  Pill, AlertTriangle, Thermometer, Heart, FileText, Stethoscope, StickyNote
} from 'lucide-react';
import { toast } from 'react-toastify';

const MedicalHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Usamos la misma URL base que configures en tu .env
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Si usas el prefijo /api en tu backend, asegúrate de incluirlo aquí
  // Ajusta esto según si tu ruta protegida es /api/medical-records o /medical-records
  const API_URL = `${BASE_URL}/api`; 

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // NOTA: Aquí asumimos que tienes un endpoint protegido o público que devuelve el historial.
        // Si usas el endpoint público que creamos, funcionará perfecto.
        // Si usas uno protegido, asegúrate de enviar el token en los headers.
        const response = await fetch(`${API_URL}/public/pets/${petId}`);
        
        if (!response.ok) throw new Error('Error al cargar historial');
        
        const data = await response.json();
        setHistory(data.records || []);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    if (petId) fetchHistory();
  }, [petId, API_URL]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (history.length === 0) return (
    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900">Historial Vacío</h3>
      <p className="text-gray-500">No hay registros médicos disponibles.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" /> Historial Clínico ({history.length})
        </h3>
      </div>

      {history.map((record, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          
          {/* --- HEADER: FECHA Y TIPO DE VISITA --- */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Fecha de visita</p>
                <p className="text-gray-900 font-bold capitalize">
                  {new Date(record.visit_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(record.visit_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            {/* BADGE TIPO DE VISITA */}
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 
              ${record.visit_type === 'Emergencia' ? 'bg-red-100 text-red-600' : 
                record.visit_type === 'Control' ? 'bg-green-100 text-green-600' : 
                'bg-blue-100 text-blue-600'}`}>
              {record.visit_type === 'Emergencia' && <AlertTriangle size={12}/>}
              {record.visit_type || 'Consulta General'}
            </span>
          </div>

          {/* --- BLOQUE AZUL: DOCTOR Y CLÍNICA --- */}
          <div className="bg-blue-50/50 px-6 py-4 flex flex-col sm:flex-row gap-6 border-b border-blue-100/50">
            <div className="flex-1">
              <p className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1">
                <User size={12}/> Doctor que atendió
              </p>
              <p className="font-bold text-blue-900 text-lg">
                {record.veterinarian_name || 'No especificado'}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1">
                <MapPin size={12}/> Clínica
              </p>
              <p className="font-bold text-blue-900 text-lg">
                {record.clinic_name || 'No especificada'}
              </p>
              {record.clinic_name && (
                 <a 
                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.clinic_name + ' Veterinaria')}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-xs text-blue-600 underline hover:text-blue-800 mt-1 inline-block"
                 >
                   Ver ubicación en mapa
                 </a>
               )}
            </div>
          </div>

          {/* --- CUERPO DEL REPORTE --- */}
          <div className="p-6 space-y-6">
            
            {/* Diagnóstico */}
            <div>
              <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase mb-2">
                <Stethoscope size={14}/> Diagnóstico
              </h4>
              <p className="text-xl font-bold text-gray-900">{record.diagnosis}</p>
            </div>

            {/* Tratamiento (Caja destacada) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase mb-2">
                <Pill size={14}/> Tratamiento
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {record.treatment}
              </p>
            </div>

            {/* Hallazgos / Notas */}
            {record.notes && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase mb-2">
                  <StickyNote size={14}/> Notas / Hallazgos
                </h4>
                <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                  "{record.notes}"
                </p>
              </div>
            )}

            {/* Signos Vitales (Si existen) */}
            {(record.temperature || record.heart_rate) && (
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Signos Vitales</h4>
                <div className="flex gap-4">
                    {record.temperature && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold border border-orange-100">
                        <Thermometer size={14}/> {record.temperature}°C
                      </span>
                    )}
                    {record.heart_rate && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-bold border border-red-100">
                        <Heart size={14}/> {record.heart_rate} bpm
                      </span>
                    )}
                </div>
              </div>
            )}

            {/* Footer: Peso y Próxima Cita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-bold text-purple-400 uppercase mb-1 flex items-center gap-1">
                  <Weight size={12}/> Peso Registrado
                </p>
                <p className="text-2xl font-black text-purple-900 tracking-tight">
                  {record.recorded_weight} <span className="text-lg font-bold text-purple-400">kg</span>
                </p>
              </div>

              {record.next_visit_date ? (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600 uppercase mb-1 flex items-center gap-1">
                      <Clock size={12}/> Próxima Revisión
                    </p>
                    <p className="text-xl font-black text-yellow-900">
                      {new Date(record.next_visit_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center">
                  <p className="text-sm font-medium text-gray-400">Sin próxima cita agendada</p>
                </div>
              )}
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicalHistory;