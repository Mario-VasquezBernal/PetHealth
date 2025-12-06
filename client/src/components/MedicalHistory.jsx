import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getMedicalRecords } from '../dataManager';
import { 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  Weight,
  Pill,
  Syringe,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const MedicalHistory = ({ petId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState(null);

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
      console.error(error);
      toast.error('Error al cargar historial médico');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTreatmentIcon = (type) => {
    switch (type) {
      case 'VACCINE': return <Syringe className="w-4 h-4 text-blue-600" />;
      case 'MEDICATION': return <Pill className="w-4 h-4 text-orange-600" />;
      case 'PROCEDURE': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'DEWORMING': return <AlertCircle className="w-4 h-4 text-green-600" />;
      default: return <Pill className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-bold text-primary-900 mb-2">
          Sin registros médicos
        </h3>
        <p className="text-primary-600">
          Los registros de consultas veterinarias aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-primary-600" />
        <h3 className="text-lg font-bold text-primary-900">
          Historial Médico ({records.length})
        </h3>
      </div>

      {records.map((record) => (
        <div 
          key={record.id}
          className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden hover:shadow-card-hover transition-all"
        >
          {/* Header del registro */}
          <div 
            onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
            className="p-4 cursor-pointer hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-900">
                    {formatDate(record.visit_date)}
                  </span>
                </div>
                <h4 className="text-base font-bold text-primary-900 mb-1">
                  {record.reason || 'Consulta General'}
                </h4>
                <div className="flex flex-wrap gap-3 text-sm text-primary-600">
                  {record.vet_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{record.vet_name}</span>
                    </div>
                  )}
                  {record.clinic_name && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{record.clinic_name}</span>
                    </div>
                  )}
                  {record.measured_weight && (
                    <div className="flex items-center gap-1">
                      <Weight className="w-4 h-4" />
                      <span>{record.measured_weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="text-primary-600 p-2 hover:bg-primary-100 rounded-lg transition-colors">
                {expandedRecord === record.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Detalles expandidos */}
          {expandedRecord === record.id && (
            <div className="px-4 pb-4 pt-2 border-t border-primary-100 bg-primary-50/30">
              {/* Diagnóstico */}
              {record.diagnosis && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-primary-700 mb-1">DIAGNÓSTICO</p>
                  <p className="text-sm text-primary-900">{record.diagnosis}</p>
                </div>
              )}

              {/* Notas */}
              {record.notes && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-primary-700 mb-1">NOTAS</p>
                  <p className="text-sm text-primary-600">{record.notes}</p>
                </div>
              )}

              {/* Tratamientos */}
              {record.treatments && record.treatments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary-700 mb-2">TRATAMIENTOS</p>
                  <div className="space-y-2">
                    {record.treatments.map((treatment, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 bg-white p-3 rounded-lg border border-primary-100"
                      >
                        {getTreatmentIcon(treatment.type)}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary-900">
                            {treatment.name}
                          </p>
                          {treatment.dosage && (
                            <p className="text-xs text-primary-600">
                              Dosis: {treatment.dosage}
                            </p>
                          )}
                          {treatment.next_due_date && (
                            <p className="text-xs text-orange-600 mt-1">
                              Próxima dosis: {new Date(treatment.next_due_date).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MedicalHistory;
