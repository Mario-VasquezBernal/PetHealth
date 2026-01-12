import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    getVeterinarians, 
    createVeterinarian, 
    deleteVeterinarian, 
    getClinics 
} from '../dataManager';
import { X, Stethoscope, Building2, Trash2, Plus, UserPlus, AlertCircle } from 'lucide-react';

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
            const [v, c] = await Promise.all([getVeterinarians(), getClinics()]);
            setVets(Array.isArray(v) ? v : []);
            setClinics(Array.isArray(c) ? c : []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.specialty) {
        return toast.warning("Completa nombre y especialidad");
    }

    try {
        // ✅ Solo incluir clinic_id si tiene un valor válido
        const vetData = {
            name: form.name.trim(),
            specialty: form.specialty.trim()
        };

        // ✅ Solo agregar clinic_id si no está vacío
        if (form.clinic_id && form.clinic_id !== '') {
            vetData.clinic_id = form.clinic_id;
        }

        console.log('📤 Enviando datos:', vetData); // Para debug

        await createVeterinarian(vetData);
        toast.success("Doctor registrado ✅");
        setForm({ name: '', specialty: '', clinic_id: '' });
        
        const updatedVets = await getVeterinarians(); 
        setVets(Array.isArray(updatedVets) ? updatedVets : []);
    } catch (error) {
        console.error('❌ Error completo:', error);
        toast.error("Error al crear doctor: " + error.message);
    }
};


    const handleDelete = async (id) => {
        if (window.confirm("¿Eliminar a este doctor?")) {
            try {
                await deleteVeterinarian(id);
                toast.info("Doctor eliminado 🗑️");
                
                const updatedVets = await getVeterinarians();
                setVets(Array.isArray(updatedVets) ? updatedVets : []);
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-primary-900">Gestionar Veterinarios</h2>
                            <p className="text-sm text-primary-600">Directorio médico</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-primary-50 rounded-xl transition-colors text-primary-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Mensaje informativo */}
                {clinics.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">💡 Consejo:</p>
                            <p>Puedes registrar doctores ahora y asignarles una clínica después. También pueden trabajar de forma independiente.</p>
                        </div>
                    </div>
                )}

                {/* Formulario */}
                <div className="bg-gradient-to-br from-primary-50 to-white p-5 rounded-xl mb-6 border border-primary-200">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-primary-900">Nuevo Doctor</h3>
                    </div>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-primary-700 mb-1">Nombre completo *</label>
                                <input 
                                    required 
                                    placeholder="Dr. Juan Pérez" 
                                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary-700 mb-1">Especialidad *</label>
                                <input 
                                    required 
                                    placeholder="Medicina General" 
                                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    value={form.specialty} 
                                    onChange={e => setForm({...form, specialty: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                Clínica (opcional)
                            </label>
                            <select 
                                className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={form.clinic_id} 
                                onChange={e => setForm({...form, clinic_id: e.target.value})}
                            >
                                <option value="">Consultorio independiente / Sin asignar</option>
                                {clinics.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-primary-500 mt-1">
                                Puedes asignar la clínica ahora o después
                            </p>
                        </div>
                        
                        {/* ✅ BOTÓN DE GUARDAR CON ESTILOS INLINE */}
                        <button 
                            type="submit"
                            style={{
                                width: '100%',
                                background: 'linear-gradient(to right, #10b981, #059669)',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            Guardar Doctor
                        </button>
                    </form>
                </div>

                {/* Lista de Veterinarios */}
                <div>
                    <h3 className="font-bold text-primary-900 mb-4 flex items-center justify-between">
                        <span>Directorio Médico</span>
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {vets.length} {vets.length === 1 ? 'doctor' : 'doctores'}
                        </span>
                    </h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="text-primary-500 text-center py-8">Cargando...</p>
                        ) : vets.length === 0 ? (
                            <div className="text-center py-8 bg-primary-50 rounded-xl border border-dashed border-primary-300">
                                <Stethoscope className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                                <p className="text-primary-600">No hay doctores registrados</p>
                            </div>
                        ) : (
                            vets.map(vet => {
                                const clinic = clinics.find(c => c.id === vet.clinic_id);
                                return (
                                    <div 
                                        key={vet.id} 
                                        className="border border-primary-100 p-4 rounded-xl flex justify-between items-center hover:bg-primary-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                                                <Stethoscope className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary-900">{vet.name}</p>
                                                <p className="text-sm text-primary-600">{vet.specialty}</p>
                                                <p className="text-xs text-primary-500 flex items-center gap-1 mt-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {clinic ? clinic.name : '🏠 Consultorio Independiente'}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(vet.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Eliminar doctor"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-right border-t border-primary-100 pt-4">
                    <button 
                        onClick={onClose} 
                        className="bg-primary-100 text-primary-700 px-6 py-2.5 rounded-xl hover:bg-primary-200 font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VetManagement;
