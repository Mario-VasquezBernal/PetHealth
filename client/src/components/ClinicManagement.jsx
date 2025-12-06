import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getClinics, createClinic, deleteClinic } from '../dataManager';
import { X, Building2, MapPin, Phone, Trash2, Plus } from 'lucide-react';

const ClinicManagement = ({ onClose }) => {
    const [clinics, setClinics] = useState([]);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const c = await getClinics();
            setClinics(Array.isArray(c) ? c : []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando clínicas");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name) return toast.warning("El nombre es obligatorio");

        try {
            await createClinic(form);
            toast.success("Clínica registrada ✅");
            setForm({ name: '', address: '', phone: '' });
            
            const updated = await getClinics();
            setClinics(Array.isArray(updated) ? updated : []);
        } catch (error) {
            console.error(error);
            toast.error("Error al crear clínica");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Eliminar esta clínica?")) {
            try {
                await deleteClinic(id);
                toast.info("Clínica eliminada 🗑️");
                
                const updated = await getClinics();
                setClinics(Array.isArray(updated) ? updated : []);
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
                            <Building2 className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-primary-900">Gestionar Clínicas</h2>
                            <p className="text-sm text-primary-600">Directorio de centros veterinarios</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-primary-50 rounded-xl transition-colors text-primary-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Formulario */}
                <div className="bg-gradient-to-br from-primary-50 to-white p-5 rounded-xl mb-6 border border-primary-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Plus className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-primary-900">Nueva Clínica</h3>
                    </div>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">Nombre de la clínica *</label>
                            <input 
                                required 
                                placeholder="Ej: Veterinaria San Francisco" 
                                className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    Dirección
                                </label>
                                <input 
                                    placeholder="Calle Principal #123" 
                                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    value={form.address} 
                                    onChange={e => setForm({...form, address: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    Teléfono
                                </label>
                                <input 
                                    type="tel"
                                    placeholder="(555) 123-4567" 
                                    className="w-full border border-primary-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    value={form.phone} 
                                    onChange={e => setForm({...form, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold p-3 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Guardar Clínica
                        </button>
                    </form>
                </div>

                {/* Lista de Clínicas */}
                <div>
                    <h3 className="font-bold text-primary-900 mb-4 flex items-center justify-between">
                        <span>Directorio de Clínicas</span>
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {clinics.length} clínicas
                        </span>
                    </h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="text-primary-500 text-center py-8">Cargando...</p>
                        ) : clinics.length === 0 ? (
                            <div className="text-center py-8 bg-primary-50 rounded-xl border border-dashed border-primary-300">
                                <Building2 className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                                <p className="text-primary-600">No hay clínicas registradas</p>
                            </div>
                        ) : (
                            clinics.map(clinic => (
                                <div 
                                    key={clinic.id} 
                                    className="border border-primary-100 p-4 rounded-xl flex justify-between items-start hover:bg-primary-50 transition-colors group"
                                >
                                    <div className="flex gap-3 flex-1">
                                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                                            <Building2 className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-primary-900 mb-1">{clinic.name}</p>
                                            {clinic.address && (
                                                <p className="text-sm text-primary-600 flex items-start gap-1">
                                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    {clinic.address}
                                                </p>
                                            )}
                                            {clinic.phone && (
                                                <p className="text-sm text-primary-600 flex items-center gap-1 mt-1">
                                                    <Phone className="w-4 h-4" />
                                                    {clinic.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(clinic.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                        title="Eliminar clínica"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
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

export default ClinicManagement;
