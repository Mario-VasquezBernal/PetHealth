// ============================================
// COMPONENTS/MEDICALHISTORY.JSX
// ============================================

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, MapPin,
  Pill, AlertTriangle, Thermometer, Heart, FileText, Stethoscope, StickyNote, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

const MedicalHistory = ({ petId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api`;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/public/pets/${petId}?t=${Date.now()}`);
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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200 px-4">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Historial Vacío</h3>
        <p className="text-sm text-gray-500">No hay registros médicos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-black text-gray-800 text-lg sm:text-xl flex items-center gap-2 px-2">
        <Activity className="text-blue-600" /> Historial Clínico ({history.length})
      </h3>

      {history.map((record, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* HEADER: FECHA Y TIPO DE VISITA */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600 flex-shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Fecha de visita</p>
                <p className="text-sm sm:text-base text-gray-900 font-bold capitalize">
                  {new Date(record.visit_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[11px] text-gray-400">
                  {new Date(record.visit_date).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <span
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                record.visit_type === 'Emergencia'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {record.visit_type === 'Emergencia' && <AlertTriangle size={12} />}
              {record.visit_type || 'Consulta General'}
            </span>
          </div>

          {/* DOCTOR Y CLÍNICA */}
          <div className="bg-blue-50/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-blue-100/50">
            <div className="flex-1">
              <p className="text-[11px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                <User size={12} /> Doctor que atendió
              </p>
              <p className="font-bold text-blue-900 text-base sm:text-lg break-words">
                {record.veterinarian_name || 'No especificado'}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                <MapPin size={12} /> Clínica
              </p>
              <p className="font-bold text-blue-900 text-base sm:text-lg break-words">
                {record.clinic_name || 'No especificada'}
              </p>
              {record.clinic_name && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    record.clinic_name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] sm:text-xs text-blue-500 underline"
                >
                  Ver ubicación en mapa
                </a>
              )}
            </div>
          </div>

          {/* CUERPO DEL REPORTE */}
          <div className="px-4 sm:px-6 py-5 space-y-5">
            {/* Diagnóstico */}
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                <Stethoscope size={14} /> Diagnóstico
              </h4>
              <p className="text-base sm:text-lg font-bold text-gray-900 break-words">
                {record.diagnosis}
              </p>
            </div>

            {/* Tratamiento */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase mb-2">
                <Pill size={14} /> Tratamiento
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                {record.treatment}
              </p>
            </div>

            {/* Notas / Hallazgos */}
            {record.notes && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <h4 className="flex items-center gap-2 text-[11px] font-black text-yellow-700 uppercase mb-2">
                  <StickyNote size={14} /> Notas / Hallazgos
                </h4>
                <p className="text-sm text-yellow-900 italic break-words">"{record.notes}"</p>
              </div>
            )}

            {/* Signos Vitales */}
            {(record.temperature || record.heart_rate) && (
              <div>
                <h4 className="text-[11px] font-black text-gray-400 uppercase mb-2">
                  Signos Vitales
                </h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {record.temperature && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs sm:text-sm font-bold border border-orange-100">
                      <Thermometer size={14} /> {record.temperature}°C
                    </span>
                  )}
                  {record.heart_rate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm font-bold border border-red-100">
                      <Heart size={14} /> {record.heart_rate} bpm
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Peso y Próxima Cita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-[11px] font-bold text-purple-600 uppercase mb-1">
                  Peso registrado
                </p>
                <p className="text-lg font-black text-purple-900">
                  {record.recorded_weight ? `${record.recorded_weight} kg` : 'No registrado'}
                </p>
              </div>

              {record.next_visit_date ? (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <p className="text-[11px] font-bold text-yellow-600 uppercase mb-1 flex items-center gap-1">
                    <Clock size={12} /> Próxima Revisión
                  </p>
                  <p className="text-lg font-black text-yellow-900">
                    {new Date(record.next_visit_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center">
                  <p className="text-sm font-medium text-gray-400 text-center">
                    Sin próxima cita agendada
                  </p>
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
