import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getPetById, addMedicalRecord } from '../dataManager';
import QRCode from "react-qr-code";

const PetDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [pet, setPet] = useState(null);
  // Agregamos vet_name al estado del formulario
  const [newRecord, setNewRecord] = useState({ type: 'Consulta', detail: '', vet_name: '' });
  const [isExpired, setIsExpired] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    const loadPetData = async () => {
        const expiresAt = searchParams.get('expires');
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
            setIsExpired(true);
            return;
        }
    
        const foundPet = await getPetById(id); 
        setPet(foundPet);
    
        const twentyMinutesFromNow = Date.now() + (20 * 60 * 1000);
        const generatedUrl = `${window.location.origin}/pet/${id}?expires=${twentyMinutesFromNow}`;
        setQrUrl(generatedUrl);
    };
    loadPetData();
  }, [id, searchParams]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    const recordData = {
        type: newRecord.type,
        detail: newRecord.detail,
        vet_name: newRecord.vet_name // Enviamos el nombre del doctor
    };

    try {
        const savedRecord = await addMedicalRecord(pet.id, recordData);
        const updatedHistory = [savedRecord, ...(pet.history || [])];
        const updatedPet = { ...pet, history: updatedHistory };
        setPet(updatedPet);
        setNewRecord({ ...newRecord, detail: '', vet_name: '' }); // Limpiamos campos
    } catch (error) {
        console.error("Error al guardar historial:", error);
    }
  };

  if (isExpired) return <div className="p-10 text-center">Enlace caducado ⏳</div>;
  if (!pet) return <div className="p-10 text-center">Cargando datos...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver al inicio</Link>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        {/* Encabezado */}
        <div className="flex items-center gap-6 mb-8 border-b pb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
             {pet.image ? <img src={pet.image} className="w-full h-full object-cover" /> : <span className="text-5xl">🐾</span>}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{pet.name}</h1>
            <p className="text-gray-500 text-lg">{pet.type} • {pet.age} años</p>
          </div>
        </div>

        {/* Sección QR */}
        <div className="mb-8 bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-200">
           <div>
             <h3 className="font-bold text-gray-800">📱 QR Temporal</h3>
             <p className="text-sm text-gray-500">Comparte acceso seguro por 20 minutos.</p>
           </div>
           <div className="bg-white p-2 rounded shadow-sm">
             {qrUrl && <QRCode size={60} value={qrUrl} />}
           </div>
        </div>

        {/* FORMULARIO NUEVO (Con Veterinario) */}
        <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-3">📝 Agregar Historial</h3>
            <form onSubmit={handleAddRecord} className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <select 
                        className="p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 bg-white w-1/3"
                        value={newRecord.type}
                        onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                    >
                        <option value="Consulta">Consulta</option>
                        <option value="Vacuna">Vacuna</option>
                        <option value="Cirugía">Cirugía</option>
                        <option value="Medicación">Medicación</option>
                    </select>
                    
                    <input 
                        type="text" 
                        placeholder="Dr. Atendió (Opcional)" 
                        className="p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 flex-1"
                        value={newRecord.vet_name}
                        onChange={(e) => setNewRecord({...newRecord, vet_name: e.target.value})}
                    />
                </div>

                <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Detalles del diagnóstico o tratamiento..." 
                        className="flex-1 p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500"
                        value={newRecord.detail}
                        onChange={(e) => setNewRecord({...newRecord, detail: e.target.value})}
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700">
                        Guardar
                    </button>
                </div>
            </form>
        </div>

        {/* LISTA HISTORIAL (Mostrando Veterinario) */}
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial Médico</h2>
            {pet.history && pet.history.length > 0 ? (
              <ul className="space-y-3">
                {pet.history.map((item, index) => (
                  <li key={index} className="flex flex-col sm:flex-row sm:justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {item.type === 'Vacuna' ? '💉' : item.type === 'Cirugía' ? '🏥' : '🩺'}
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">{item.type}</span>
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Dr. {item.vet_name}</span>
                            </div>
                            <span className="text-gray-600">{item.detail}</span>
                        </div>
                      </div>
                      <span className="text-blue-600 font-medium text-sm mt-2 sm:mt-0">
                        {item.date}
                      </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-center">No hay registros médicos.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PetDetails;