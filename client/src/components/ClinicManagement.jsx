import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// 1. IMPORTAMOS LA NUEVA FUNCIÓN deleteClinic
import { getClinics, createClinic, deleteClinic } from '../dataManager'; 

const ClinicManagement = ({ onClose }) => {
    const [clinics, setClinics] = useState([]);
    const [newClinic, setNewClinic] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClinics();
    }, []);

    const loadClinics = async () => {
        try {
            const data = await getClinics();
            if (Array.isArray(data)) setClinics(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar clínicas");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newClinic.name || !newClinic.address) return toast.warning("Nombre y dirección son obligatorios");

        try {
            await createClinic(newClinic);
            toast.success("Clínica creada correctamente ✅");
            setNewClinic({ name: '', address: '', phone: '' }); 
            loadClinics(); 
        } catch (error) {
            console.error(error);
            toast.error("Error al crear la clínica");
        }
    };

    // 2. FUNCIÓN PARA ELIMINAR
    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta clínica?")) {
            try {
                await deleteClinic(id);
                toast.info("Clínica eliminada 🗑️");
                loadClinics(); // Recargamos la lista
            } catch (error) {
                console.error(error);
                toast.error("No se pudo eliminar (Tal vez tiene doctores asignados)");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Gestionar Clínicas</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
                </div>

                {/* Formulario de creación */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-3">Agregar Nueva Clínica</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input 
                            placeholder="Nombre de la Clínica" 
                            className="border p-2 rounded bg-white"
                            value={newClinic.name}
                            onChange={e => setNewClinic({...newClinic, name: e.target.value})}
                        />
                        <input 
                            placeholder="Dirección" 
                            className="border p-2 rounded bg-white"
                            value={newClinic.address}
                            onChange={e => setNewClinic({...newClinic, address: e.target.value})}
                        />
                        <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">
                            Guardar
                        </button>
                    </form>
                </div>

                {/* Lista de Clínicas existentes */}
                <h3 className="font-bold text-gray-700 mb-3">Clínicas Registradas ({clinics.length})</h3>
                <div className="space-y-2">
                    {loading ? <p className="text-center text-gray-400">Cargando...</p> : (
                        clinics.map(clinic => (
                            <div key={clinic.id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{clinic.name}</p>
                                    <p className="text-sm text-gray-500">📍 {clinic.address}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {clinic.id}</span>
                                    
                                    {/* 3. BOTÓN DE ELIMINAR */}
                                    <button 
                                        onClick={() => handleDelete(clinic.id)}
                                        className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded transition-colors"
                                        title="Eliminar clínica"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    {clinics.length === 0 && !loading && (
                        <p className="text-center text-gray-400 py-4 italic">No hay clínicas registradas aún.</p>
                    )}
                </div>

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-medium">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClinicManagement;