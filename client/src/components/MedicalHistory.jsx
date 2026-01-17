// ============================================
// components/MedicalHistory.jsx - ACTUALIZADO
// ============================================
import { useState, useEffect } from 'react';
import { getMedicalRecords } from '../dataManager';
import { 
  FileText, 
  Calendar, 
  Stethoscope, 
  Loader, 
  Weight,
  User,
  Building2,
  MapPin,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

const MedicalHistory = ({ petId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await getMedicalRecords(petId);
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      if (!error.message.includes('No autorizado')) {
        toast.error('Error al cargar historial médico');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVisitTypeColor = (type) => {
    const colors = {
      'rutina': 'bg-green-100 text-green-800 border-green-300',
      'emergencia': 'bg-red-100 text-red-800 border-red-300',
      'seguimiento': 'bg-blue-100 text-blue-800 border-blue-300',
      'cirugia': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getVisitTypeLabel = (type) => {
    const labels = {
      'rutina': '✅ Rutina',
      'emergencia': '🚨 Emergencia',
      'seguimiento': '🔄 Seguimiento',
      'cirugia': '🏥 Cirugía'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="text-center py-12">
          <FileText className="w-20 h-20 text-primary-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-primary-900 mb-2">Sin registros médicos</h3>
          <p className="text-primary-600 mb-6">
            Los registros de consultas veterinarias aparecerán aquí cuando un veterinario escanee el código QR
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Stethoscope className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-bold text-primary-900">Historial Médico</h3>
        <span className="ml-auto bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-4">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="border-2 border-primary-100 rounded-xl p-5 hover:border-primary-300 transition-all hover:shadow-md"
          >
            
            {/* Header del Registro */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-primary-700">
                      {formatDate(record.visit_date)}
                    </span>
                  </div>
                  {record.visit_type && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${getVisitTypeColor(record.visit_type)}`}>
                      {getVisitTypeLabel(record.visit_type)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Doctor y Clínica */}
            {(record.vet_name || record.clinic_name) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {record.vet_name && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">DOCTOR QUE ATENDIÓ</p>
                        <p className="text-blue-900 font-bold">{record.vet_name}</p>
                        {record.vet_specialty && (
                          <p className="text-xs text-blue-600">{record.vet_specialty}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {record.clinic_name && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">CLÍNICA</p>
                        <p className="text-blue-900 font-bold">{record.clinic_name}</p>
                        {record.clinic_address && (
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {record.clinic_address}
                            {record.clinic_city && `, ${record.clinic_city}`}
                          </p>
                        )}
                        {/* ✅ Botón para ver mapa */}
                        {record.location_lat && record.location_lng && (
                          <a
                            href={`https://www.google.com/maps?q=${record.location_lat},${record.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                          >
                            🗺️ Ver ubicación en mapa
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ Motivo de Consulta */}
            {record.visit_reason && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1 flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  MOTIVO DE CONSULTA
                </p>
                <p className="text-primary-900 font-medium">{record.visit_reason}</p>
              </div>
            )}

            {/* Diagnóstico */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-primary-700 mb-1">DIAGNÓSTICO</p>
              <p className="text-primary-900 font-medium">{record.diagnosis}</p>
            </div>

            {/* Tratamiento */}
            {(record.reason || record.treatment) && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1">TRATAMIENTO</p>
                <p className="text-primary-600 text-sm">{record.reason || record.treatment}</p>
              </div>
            )}

            {/* ✅ Hallazgos del Examen */}
            {record.examination_findings && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1">HALLAZGOS DEL EXAMEN</p>
                <p className="text-primary-600 text-sm">{record.examination_findings}</p>
              </div>
            )}

            {/* Notas */}
            {record.notes && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1">NOTAS</p>
                <p className="text-primary-600 text-sm">{record.notes}</p>
              </div>
            )}

            {/* Peso Medido */}
            {record.measured_weight && (
              <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                  <Weight className="w-4 h-4" />
                  PESO REGISTRADO
                </p>
                <p className="text-purple-900 font-bold text-lg">{record.measured_weight} kg</p>
              </div>
            )}

            {/* ✅ Próxima Revisión */}
            {record.follow_up_date && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  PRÓXIMA REVISIÓN
                </p>
                <p className="text-amber-900 font-bold">
                  {new Date(record.follow_up_date).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón para recargar */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={loadRecords}
          className="text-sm text-green-600 font-medium underline hover:text-green-800 transition-colors"
        >
          Actualizar historial
        </button>
      </div>
    </div>
  );
};

export default MedicalHistory;
