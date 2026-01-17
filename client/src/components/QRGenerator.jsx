// ============================================
// QRGENERATOR.JSX
// ============================================
// Genera código QR temporal (15 minutos) para acceso veterinario sin login
// Muestra imagen QR, contador regresivo de expiración y botones de acción
// Permite: descargar QR como imagen PNG, copiar URL de acceso directo, renovar QR
// Estado vacío muestra botón para generar, estado con QR muestra imagen + timer + acciones
// Timer actualizado cada segundo, marca "⚠️ Expirado" cuando llega a 0
// QR funciona escaneándolo o compartiendo el vetAccessUrl
// ============================================
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { generateQRCode } from '../dataManager';
import { QrCode, RefreshCw, Clock, Download, Share2, User, Building2 } from 'lucide-react';

const QRGenerator = ({ petId, petName }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // ✅ NUEVO: Estados para veterinarios y clínicas
  const [veterinarians, setVeterinarians] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');

  // Cargar opciones al montar el componente
  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (qrData?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(qrData.expiresAt);
        const diff = expires - now;

        if (diff <= 0) {
          setTimeRemaining('Expirado');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [qrData]);

  // ✅ NUEVO: Cargar veterinarios y clínicas
  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/qr/options`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar opciones');

      const data = await response.json();
      setVeterinarians(data.veterinarians || []);
      setClinics(data.clinics || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar veterinarios y clínicas');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleGenerateQR = async () => {
    // ✅ VALIDACIÓN: Asegurar que se seleccionen vet y clínica
    if (!selectedVet || !selectedClinic) {
      toast.warning('⚠️ Debes seleccionar un veterinario y una clínica');
      return;
    }

    try {
      setLoading(true);
      // ✅ NUEVO: Enviar vetId y clinicId
      const data = await generateQRCode(petId, {
        vetId: selectedVet,
        clinicId: selectedClinic
      });
      setQrData(data);
      toast.success('✅ Código QR generado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al generar código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qrImage) return;
    
    const link = document.createElement('a');
    link.href = qrData.qrImage;
    link.download = `QR-${petName}-${Date.now()}.png`;
    link.click();
    toast.info('Código QR descargado');
  };

  const handleCopyLink = () => {
    if (!qrData?.vetAccessUrl) return;
    
    navigator.clipboard.writeText(qrData.vetAccessUrl);
    toast.success('Enlace copiado al portapapeles');
  };

  if (loadingOptions) {
    return (
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
          <p className="text-primary-600">Cargando opciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-bold text-primary-900">Acceso Veterinario</h3>
        </div>
        {qrData && timeRemaining && (
          <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-primary-600" />
            <span className={`text-sm font-semibold ${
              timeRemaining === 'Expirado' ? 'text-red-600' : 'text-primary-700'
            }`}>
              {timeRemaining === 'Expirado' ? '⚠️ Expirado' : timeRemaining}
            </span>
          </div>
        )}
      </div>

      {!qrData ? (
        <div className="space-y-4">
          {/* ✅ NUEVO: Selects para Veterinario y Clínica */}
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-3">
              📋 Selecciona el veterinario y clínica que atenderá a {petName}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Veterinario *
                </label>
                <select
                  value={selectedVet}
                  onChange={(e) => setSelectedVet(e.target.value)}
                  className="w-full border-2 border-blue-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Seleccionar veterinario...</option>
                  {veterinarians.map(vet => (
                    <option key={vet.id} value={vet.id}>
                      {vet.name} {vet.specialty ? `- ${vet.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Clínica *
                </label>
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                  className="w-full border-2 border-blue-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Seleccionar clínica...</option>
                  {clinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name} {clinic.address ? `- ${clinic.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botón de generar */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGenerateQR}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Generar Código QR
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ✅ NUEVO: Mostrar doctor y clínica asignados */}
          <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-2">✅ QR generado para:</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-green-700 font-medium">Doctor:</p>
                <p className="text-green-900 font-bold">{qrData.assignedVet?.name}</p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Clínica:</p>
                <p className="text-green-900 font-bold">{qrData.assignedClinic?.name}</p>
              </div>
            </div>
          </div>

          {/* Imagen QR */}
          <div className="flex justify-center bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-dashed border-primary-200">
            <img 
              src={qrData.qrImage} 
              alt="Código QR" 
              className="w-64 h-64 rounded-lg shadow-lg"
            />
          </div>

          {/* Instrucciones */}
          <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-800 mb-2">
              <strong>📱 Instrucciones:</strong>
            </p>
            <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
              <li>Muestra este código QR al veterinario</li>
              <li>El QR ya contiene la info del doctor y clínica</li>
              <li>El código expira en 24 horas</li>
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              Copiar Link
            </button>
            
            <button
              type="button"
              onClick={() => {
                setQrData(null);
                setSelectedVet('');
                setSelectedClinic('');
              }}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Nuevo QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
