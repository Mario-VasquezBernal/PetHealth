// ============================================
// PUBLICMEDICALHISTORY.JSX
// ============================================
// Vista pública de "Hoja de Vida" de la mascota.
// Diseño profesional tipo tarjeta médica.
// Muestra signos vitales, tipo de visita y alertas visuales.
// ============================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, Weight, Activity, AlertCircle, FileText, 
  Clock, User, MapPin, Pill, AlertTriangle, Thermometer, Heart 
} from 'lucide-react';

const PublicMedicalHistory = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api`; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/public/pets/${id}`);
        if (!response.ok) throw new Error('Error al cargar');
        const data = await response.json();
        setPet(data.pet);
        setHistory(data.records || []);
      } catch (err) {
        console.error(err);
        setError('Mascota no encontrada');
      } finally {
        setLoading(false);
      }
    };
    if(id) fetchData();
  }, [id, API_URL]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !pet) return <div className="min-h-screen flex items-center justify-center"><p>{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white pt-10 pb-20 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="max-w-md mx-auto relative z-10 text-center">
          <div className="w-28 h-28 mx-auto bg-white p-1 rounded-full shadow-2xl mb-4">
            <img src={pet.photo_url || 'https://via.placeholder.com/150'} alt={pet.name} className="w-full h-full object-cover rounded-full"/>
          </div>
          <h1 className="text-4xl font-black mb-1">{pet.name}</h1>
          <p className="text-blue-200 font-medium text-lg">{pet.breed} • {calculateAge(pet.birth_date)}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-12 relative z-20 space-y-8">
        
        {/* TARJETA DE RESUMEN BIOLÓGICO */}
        <div className="bg-white rounded-3xl shadow-lg p-6 grid grid-cols-3 gap-4 border border-blue-50">
          <div className="text-center"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Peso</p><p className="text-xl font-black text-gray-800 flex justify-center gap-1"><Weight size={18} className="text-blue-500"/> {pet.weight}kg</p></div>
          <div className="text-center border-l border-gray-100"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Sexo</p><p className="text-xl font-black text-gray-800 capitalize">{pet.gender}</p></div>
          <div className="text-center border-l border-gray-100"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Castrado</p><p className={`text-xl font-black ${pet.is_sterilized ? 'text-green-600' : 'text-orange-500'}`}>{pet.is_sterilized ? 'Sí' : 'No'}</p></div>
        </div>

        {/* ALERGIAS */}
        {pet.allergies && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-2xl shadow-sm flex gap-4">
            <AlertCircle className="text-orange-600 flex-shrink-0 mt-1" size={24} />
            <div><h3 className="font-bold text-orange-900 text-lg">Alergias</h3><p className="text-orange-800">{pet.allergies}</p></div>
          </div>
        )}

        {/* LISTA DE HISTORIAL MÉDICO (DISEÑO PROFESIONAL) */}
        <div>
          <h3 className="font-black text-gray-800 text-xl mb-6 flex items-center gap-2 px-2"><Activity className="text-blue-600" /> Historial Clínico</h3>

          <div className="space-y-6">
            {history.length > 0 ? (
              history.map((record, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  
                  {/* HEADER DE TARJETA: FECHA Y TIPO */}
                  <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg text-gray-600"><Calendar size={20} /></div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Fecha de visita</p>
                        <p className="text-gray-900 font-bold capitalize">{new Date(record.visit_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${record.visit_type === 'Emergencia' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {record.visit_type === 'Emergencia' && <AlertTriangle size={12}/>}
                      {record.visit_type || 'Consulta General'}
                    </span>
                  </div>

                  {/* INFO DEL DOCTOR (FONDO AZUL CLARO) */}
                  <div className="bg-blue-50/50 px-6 py-4 flex flex-col sm:flex-row gap-6 border-b border-blue-100/50">
                    <div className="flex-1">
                      <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center gap-1"><User size={12}/> Doctor que atendió</p>
                      <p className="font-bold text-blue-900 text-lg">{record.veterinarian_name}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={12}/> Clínica</p>
                      <p className="font-bold text-blue-900 text-lg">{record.clinic_name}</p>
                    </div>
                  </div>

                  {/* CUERPO DEL REPORTE */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Motivo / Diagnóstico</h4>
                      <p className="text-xl font-bold text-gray-900">{record.diagnosis}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase mb-2"><Pill size={14}/> Tratamiento</h4>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">{record.treatment}</p>
                    </div>

                    {/* SIGNOS VITALES */}
                    {(record.temperature || record.heart_rate) && (
                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Signos Vitales</h4>
                        <div className="flex gap-4">
                           {record.temperature && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold border border-orange-100"><Thermometer size={14}/> {record.temperature}°C</span>}
                           {record.heart_rate && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-bold border border-red-100"><Heart size={14}/> {record.heart_rate} bpm</span>}
                        </div>
                      </div>
                    )}

                    {/* FOOTER: PESO Y PRÓXIMA CITA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-xs font-bold text-purple-400 uppercase mb-1 flex items-center gap-1"><Weight size={12}/> Peso Registrado</p>
                        <p className="text-xl font-black text-purple-900">{record.recorded_weight} kg</p>
                      </div>

                      {record.next_visit_date ? (
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                           <p className="text-xs font-bold text-yellow-600 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Próxima Revisión</p>
                           <p className="text-xl font-black text-yellow-900">{new Date(record.next_visit_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center">
                          <p className="text-sm font-medium text-gray-400">Sin próxima cita</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Historial Vacío</h3>
                <p className="text-gray-500">No hay registros médicos disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateAge = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " años";
};

export default PublicMedicalHistory;