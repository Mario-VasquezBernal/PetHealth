import { useState, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code'; 
import { toast } from 'react-toastify';
import { 
  Download, 
  Building2, 
  User, 
  RefreshCw, 
  Copy, 
  Clock
} from 'lucide-react';

const QRGenerator = ({ petId, petName, mode = 'READ_ONLY' }) => {

  const [clinics, setClinics] = useState([]);
  const [vets, setVets] = useState([]); 
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedVetName, setSelectedVetName] = useState('');
  const [timestamp, setTimestamp] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const FRONTEND_URL = window.location.origin;

  /* =========================
     CARGA DE CLÍNICAS
  ==========================*/
  useEffect(() => {
    if (mode === 'WRITE') {
      fetch(`${API_URL}/api/public/clinics`)
        .then(res => res.json())
        .then(data => setClinics(data || []))
        .catch(err => console.error("Error clinics:", err));
    }
  }, [mode, API_URL]);

  /* =========================
     VETERINARIOS POR CLÍNICA
  ==========================*/
  useEffect(() => {
    if (!selectedClinicId) return;

    // 👉 si es independiente NO entra aquí
    if (selectedClinicId === 'independent') return;

    fetch(`${API_URL}/api/public/veterinarians/by-clinic/${selectedClinicId}`)
      .then(res => res.json())
      .then(data => setVets(data || []))
      .catch(err => console.error("Error vets:", err));

  }, [selectedClinicId, API_URL]);

  /* =========================
     VETERINARIOS INDEPENDIENTES
  ==========================*/
  useEffect(() => {
    if (selectedClinicId !== 'independent') return;

    const loadIndependentVets = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/veterinarians`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        const list = data.veterinarians || data || [];

        const independents = list.filter(v =>
          v.clinic_id === 'independent' || !v.clinic_id
        );

        setVets(independents);

      } catch (error) {
        console.error(error);
        toast.error("Error cargando médicos independientes");
      }
    };

    loadIndependentVets();

  }, [selectedClinicId, API_URL]);

  const handleClinicChange = (e) => {
    setSelectedClinicId(e.target.value);
    setVets([]); 
    setSelectedVetName('');
  };

  const qrValue = useMemo(() => {

    if (mode === 'READ_ONLY') {
      return `${FRONTEND_URL}/medical-history/${petId}`;
    }

    if (!timestamp) return '';

    const params = new URLSearchParams({
      clinic_id: selectedClinicId,
      vet: selectedVetName,
      expires: (timestamp + (20 * 60 * 1000)).toString(),
    }).toString();
    
    return `${FRONTEND_URL}/vet-access/${petId}?${params}`;

  }, [petId, mode, selectedClinicId, selectedVetName, timestamp, FRONTEND_URL]);

  const handleDownloadQR = () => {

    const svg = document.getElementById(`qr-code-svg-${mode}`);
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width; 
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `Pase-${petName}-${mode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success('📸 Código guardado en tu galería');
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const isRead = mode === 'READ_ONLY';

  return (
    <div className="w-full max-w-sm mx-auto">
      {!isRead && !timestamp ? (

        /* FORMULARIO DE CONFIGURACIÓN */
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5 animate-in fade-in slide-in-from-bottom-2">

          <div className="space-y-4">

            {/* DONDE ES LA ATENCIÓN */}
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <select 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                value={selectedClinicId}
                onChange={handleClinicChange}
              >
                <option value="">¿Dónde es la atención?</option>
                <option value="independent">🏠 Médico Independiente</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* SELECT DOCTOR (MISMO SELECT, MISMA UI) */}
            <div
              className={`relative transition-all ${
                !selectedClinicId ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <select 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                value={selectedVetName}
                onChange={(e) => setSelectedVetName(e.target.value)}
              >
                <option value="">Selecciona al Doctor</option>

                {vets.map(v => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}

              </select>
            </div>

          </div>

          <button 
            onClick={() => setTimestamp(Date.now())}
            disabled={!selectedVetName}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-100 transition-all transform active:scale-95 disabled:opacity-50"
          >
            Generar Pase Médico
          </button>

        </div>

      ) : (

        /* VISTA DEL QR GENERADO */
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">

          <div className={`relative p-6 rounded-[2.5rem] bg-white shadow-2xl border-4 ${isRead ? 'border-blue-50' : 'border-green-50'}`}>
            <QRCode 
              id={`qr-code-svg-${mode}`}
              value={qrValue} 
              size={180}
              level="H" 
              fgColor={isRead ? '#1e40af' : '#15803d'}
              bgColor="#ffffff"
            />

            {!isRead && (
              <div className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg animate-pulse">
                <Clock size={18} />
              </div>
            )}
          </div>

          {!isRead && (
            <div className="mt-4 flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
              <RefreshCw size={14} className="animate-spin-slow" />
              Expira en 20 minutos
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 w-full mt-8">
            <button 
              onClick={handleDownloadQR}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all hover:brightness-110 shadow-md ${isRead ? 'bg-blue-600' : 'bg-green-600'}`}
            >
              <Download size={18} /> PNG
            </button>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(qrValue);
                toast.success('🔗 Enlace copiado al portapapeles');
              }}
              className="flex items-center justify-center gap-2 py-4 bg-gray-900 rounded-2xl font-bold text-white transition-all hover:bg-black shadow-md"
            >
              <Copy size={18} /> Link
            </button>
          </div>

          <button 
            onClick={() => {
              setTimestamp(null);
              setSelectedClinicId('');
              setSelectedVetName('');
              setVets([]);
            }}
            className="mt-6 text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors uppercase tracking-tighter"
          >
            ← Volver a configurar
          </button>

        </div>
      )}
    </div>
  );
};

export default QRGenerator;
