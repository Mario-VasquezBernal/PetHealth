import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import {
  Download, Building2, User, RefreshCw, Copy, Clock, Loader
} from 'lucide-react';
import { generateQRCode } from '../dataManager'; // ✅ CAMBIO: usar el dataManager

const QRGenerator = ({ petId, petName, mode = 'READ_ONLY' }) => {

  const [clinics, setClinics]                   = useState([]);
  const [vets, setVets]                         = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedVetId, setSelectedVetId]       = useState('');
  const [selectedVetName, setSelectedVetName]   = useState('');
  const [selectedClinicName, setSelectedClinicName] = useState('');
  const [generating, setGenerating]             = useState(false); // ✅ CAMBIO: estado de carga
  const [qrResult, setQrResult]                 = useState(null);  // ✅ CAMBIO: guarda respuesta del servidor

  const API_URL      = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const FRONTEND_URL = window.location.origin;

  // =====================
  // CARGA DE CLÍNICAS
  // =====================
  useEffect(() => {
    if (mode === 'WRITE') {
      fetch(`${API_URL}/api/public/clinics`)
        .then(res => res.json())
        .then(data => setClinics(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error clinics:", err));
    }
  }, [mode, API_URL]);

  // =====================
  // VETERINARIOS POR CLÍNICA
  // =====================
  useEffect(() => {
    if (!selectedClinicId || selectedClinicId === 'independent') return;

    fetch(`${API_URL}/api/public/veterinarians/by-clinic/${selectedClinicId}`)
      .then(res => res.json())
      .then(data => setVets(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error vets:", err));

  }, [selectedClinicId, API_URL]);

  // =====================
  // VETERINARIOS INDEPENDIENTES
  // =====================
  useEffect(() => {
    if (selectedClinicId !== 'independent') return;

    const loadIndependentVets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch(`${API_URL}/vet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.veterinarians || []);
        setVets(list.filter(v => v.clinic_id === null || v.clinic_id === undefined));
      } catch (error) {
        console.error(error);
        toast.error("Error cargando médicos independientes");
      }
    };

    loadIndependentVets();
  }, [selectedClinicId, API_URL]);

  const handleClinicChange = (e) => {
    const val    = e.target.value;
    const clinic = clinics.find(c => String(c.id) === String(val));
    setSelectedClinicId(val);
    setSelectedClinicName(clinic?.name || (val === 'independent' ? 'Médico Independiente' : ''));
    setVets([]);
    setSelectedVetId('');
    setSelectedVetName('');
  };

  const handleVetChange = (e) => {
    const vetId = e.target.value;
    const vet   = vets.find(v => String(v.id) === String(vetId));
    setSelectedVetId(vetId);
    setSelectedVetName(vet?.name || '');
  };

  // ✅ CAMBIO PRINCIPAL: llamar al servidor para generar el QR
  const handleGenerateQR = async () => {
    if (!selectedVetId) return;

    try {
      setGenerating(true);

      // ✅ clinicId = null si es independiente (el servidor acepta null)
      const clinicIdToSend = selectedClinicId === 'independent' ? null : selectedClinicId;

      const result = await generateQRCode(petId, {
        vetId:    selectedVetId,
        clinicId: clinicIdToSend,
      });

      // result = { token, qrImage, vetAccessUrl, expiresAt, assignedVet, assignedClinic }
      setQrResult(result);
      toast.success('✅ Pase médico generado');

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al generar el pase médico');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    const svg     = document.getElementById(`qr-code-svg-${mode}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas  = document.createElement("canvas");
    const ctx     = canvas.getContext("2d");
    const img     = new Image();

    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const link    = document.createElement('a');
      link.download = `Pase-${petName}-${mode}.png`;
      link.href     = canvas.toDataURL("image/png");
      link.click();
      toast.success('📸 Código guardado en tu galería');
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleReset = () => {
    setQrResult(null);
    setSelectedClinicId('');
    setSelectedVetId('');
    setSelectedVetName('');
    setSelectedClinicName('');
    setVets([]);
  };

  const isRead = mode === 'READ_ONLY';

  // =====================
  // QR DE SOLO LECTURA
  // =====================
  if (isRead) {
    const readUrl = `${FRONTEND_URL}/medical-history/${petId}`;
    return (
      <div className="flex flex-col items-center">
        <div className="relative p-6 rounded-[2.5rem] bg-white shadow-2xl border-4 border-blue-50">
          <QRCode
            id={`qr-code-svg-${mode}`}
            value={readUrl}
            size={180}
            level="H"
            fgColor="#1e40af"
            bgColor="#ffffff"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 w-full mt-8">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:brightness-110 shadow-md transition-all"
          >
            <Download size={18} /> PNG
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(readUrl); toast.success('🔗 Enlace copiado'); }}
            className="flex items-center justify-center gap-2 py-4 bg-gray-900 rounded-2xl font-bold text-white hover:bg-black shadow-md transition-all"
          >
            <Copy size={18} /> Link
          </button>
        </div>
      </div>
    );
  }

  // =====================
  // QR DE ESCRITURA — FORMULARIO
  // =====================
  if (!qrResult) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5 animate-in fade-in slide-in-from-bottom-2">
        <div className="space-y-4">

          {/* CLÍNICA */}
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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

          {/* DOCTOR */}
          <div className={`relative transition-all ${!selectedClinicId ? 'opacity-30 pointer-events-none' : ''}`}>
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-green-500 transition-all appearance-none"
              value={selectedVetId}
              onChange={handleVetChange}
            >
              <option value="">Selecciona al Doctor</option>
              {vets.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

        </div>

        <button
          onClick={handleGenerateQR}
          disabled={!selectedVetId || generating}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-100 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <><Loader className="w-5 h-5 animate-spin" /> Generando...</>
          ) : (
            'Generar Pase Médico'
          )}
        </button>
      </div>
    );
  }

  // =====================
  // QR DE ESCRITURA — RESULTADO
  // ✅ CAMBIO: usa vetAccessUrl del servidor (que apunta a /qr/:token)
  // =====================
  return (
    <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">

      {/* Info del vet/clínica asignados */}
      <div className="w-full mb-4 p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-center">
        <p className="font-bold text-green-800">
          👨‍⚕️ {qrResult.assignedVet?.name || selectedVetName}
        </p>
        <p className="text-green-700">
          🏥 {qrResult.assignedClinic?.name || selectedClinicName}
        </p>
      </div>

      <div className="relative p-6 rounded-[2.5rem] bg-white shadow-2xl border-4 border-green-50">
        <QRCode
          id={`qr-code-svg-${mode}`}
          value={qrResult.vetAccessUrl} // ✅ CAMBIO: URL del servidor, no construida en frontend
          size={180}
          level="H"
          fgColor="#15803d"
          bgColor="#ffffff"
        />
        <div className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg animate-pulse">
          <Clock size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
        <RefreshCw size={14} className="animate-spin-slow" />
        Expira en 24 horas
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mt-8">
        <button
          onClick={handleDownloadQR}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-green-600 hover:brightness-110 shadow-md transition-all"
        >
          <Download size={18} /> PNG
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(qrResult.vetAccessUrl); toast.success('🔗 Enlace copiado'); }}
          className="flex items-center justify-center gap-2 py-4 bg-gray-900 rounded-2xl font-bold text-white hover:bg-black shadow-md transition-all"
        >
          <Copy size={18} /> Link
        </button>
      </div>

      <button
        onClick={handleReset}
        className="mt-6 text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors uppercase tracking-tighter"
      >
        ← Volver a configurar
      </button>

    </div>
  );
};

export default QRGenerator;
