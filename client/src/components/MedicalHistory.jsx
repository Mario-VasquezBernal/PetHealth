import { useState, useEffect } from 'react';
import { getMedicalRecords } from '../dataManager';
import { FileText, Calendar, Stethoscope, AlertCircle, Loader, Weight } from 'lucide-react'; // ✅ Agregar Weight
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
      // No mostrar error si es primera vez sin registros
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
      day: 'numeric'
    });
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
      <div className="flex items-center gap-2 mb-6">
        <Stethoscope className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-bold text-primary-900">Historial Médico</h3>
        <span className="ml-auto bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="space-y-4">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="border-2 border-primary-100 rounded-xl p-4 hover:border-primary-300 transition-colors"
          >
            {/* Fecha */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">
                {formatDate(record.visit_date)}
              </span>
            </div>

            {/* Diagnóstico */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-primary-700 mb-1">DIAGNÓSTICO</p>
              <p className="text-primary-900 font-medium">{record.diagnosis}</p>
            </div>

            {/* Tratamiento/Razón */}
            {(record.reason || record.treatment) && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1">TRATAMIENTO</p>
                <p className="text-primary-600 text-sm">{record.reason || record.treatment}</p>
              </div>
            )}

            {/* Notas */}
            {record.notes && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-primary-700 mb-1">NOTAS</p>
                <p className="text-primary-600 text-sm">{record.notes}</p>
              </div>
            )}

            {/* ✅ Peso medido (Destacado con ícono) */}
            {record.measured_weight && (
              <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                  <Weight className="w-4 h-4" />
                  PESO REGISTRADO
                </p>
                <p className="text-purple-900 font-bold text-lg">{record.measured_weight} kg</p>
              </div>
            )}

            {/* Veterinario y Clínica */}
            {(record.vet_name || record.clinic_name) && (
              <div className="mt-3 pt-3 border-t border-primary-100 flex flex-wrap gap-4 text-xs text-primary-600">
                {record.vet_name && (
                  <span>
                    <strong>Veterinario:</strong> {record.vet_name}
                  </span>
                )}
                {record.clinic_name && (
                  <span>
                    <strong>Clínica:</strong> {record.clinic_name}
                  </span>
                )}
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
          style={{
            fontSize: '0.875rem',
            color: '#059669',
            fontWeight: '500',
            textDecoration: 'underline',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            transition: 'all 0.2s',
            opacity: 1,
            visibility: 'visible'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#047857';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#059669';
          }}
        >
          Actualizar historial
        </button>
      </div>
    </div>
  );
};

export default MedicalHistory;
