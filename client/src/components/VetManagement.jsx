import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getVets, createVet, deleteVet, getClinics } from '../dataManager';

const VetManagement = ({ onClose }) => {
    const [vets, setVets] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [form, setForm] = useState({ name: '', specialty: '', clinic_id: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [v, c] = await Promise.all([getVets(), getClinics()]);
            setVets(v);
            setClinics(c);
        } catch (error) {
            console.error(error); // <--- CORRECCIÓN 1
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.clinic_id) return toast.warning("Selecciona una clínica");

        try {
            await createVet(form);
            toast.success("Doctor registrado ✅");
            setForm({ name: '', specialty: '', clinic_id: '' });
            const updatedVets = await getVets(); 
            setVets(updatedVets);
        } catch (error) {
            console.error(error); // <--- CORRECCIÓN 2
            toast.error("Error al crear doctor");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Eliminar a este doctor?")) {
            try {
                await deleteVet(id);
                toast.info("Doctor eliminado 🗑️");
                const updatedVets = await getVets();
                setVets(updatedVets);
            } catch (error) {
                console.error(error); // <--- CORRECCIÓN 3
                toast.error("Error al eliminar");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Gestionar Veterinarios</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
                </div>

                {/* FORMULARIO DE CREACIÓN */}
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100">
                    <h3 className="font-bold text-green-800 mb-3">Nuevo Doctor</h3>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input 
                                required placeholder="Nombre (Dr. Ejemplo)" 
                                className="border p-2 rounded bg-white w-full"
                                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                            />
                            <input 
                                required placeholder="Especialidad" 
                                className="border p-2 rounded bg-white w-full"
                                value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}
                            />
                        </div>
                        <select 
                            required 
                            className="border p-2 rounded bg-white w-full"
                            value={form.clinic_id} onChange={e => setForm({...form, clinic_id: e.target.value})}
                        >
                            <option value="">Selecciona la Clínica</option>
                            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="submit" className="w-full bg-green-600 text-white font-bold p-2 rounded hover:bg-green-700">
                            Guardar Doctor
                        </button>
                    </form>
                </div>

                {/* LISTA DE VETERINARIOS CON BOTÓN BORRAR */}
                <h3 className="font-bold text-gray-700 mb-3">Directorio Médico ({vets.length})</h3>
                <div className="space-y-2">
                    {loading ? <p>Cargando...</p> : vets.map(vet => (
                        <div key={vet.id} className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <p className="font-bold text-gray-800">{vet.name}</p>
                                <p className="text-xs text-gray-500">{vet.specialty}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(vet.id)}
                                className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded transition-colors"
                                title="Eliminar doctor"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-medium">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default VetManagement;