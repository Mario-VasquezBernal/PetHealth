import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { generateQRCode } from '../dataManager';
import { QrCode, RefreshCw, Clock, Download, Share2, X } from 'lucide-react';

const QRGenerator = ({ petId, petName }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

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

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      const data = await generateQRCode(petId);
      setQrData(data);
      toast.success('Código QR generado exitosamente');
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
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-primary-600" />
          </div>
          <p className="text-primary-600 mb-4">
            Genera un código QR para que el veterinario pueda registrar la consulta
          </p>
          <button
            onClick={handleGenerateQR}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 transition-colors font-medium shadow-md"
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
      ) : (
        <div className="space-y-4">
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
              <li>El veterinario escanea y registra la consulta</li>
              <li>El código expira en 15 minutos</li>
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 px-4 rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white py-2.5 px-4 rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Copiar Link
            </button>
            
            <button
              onClick={handleGenerateQR}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-500 text-white py-2.5 px-4 rounded-xl hover:bg-gray-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Renovar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
