import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPetById, getMedicalHistory, addMedicalRecord, updatePet } from '../dataManager'; // Importamos updatePet

const PetDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Nuevo modal para editar

  // Formularios
  const [recordForm, setRecordForm] = useState({ type: 'Vacuna', date: '', description: '' });
  const [editForm, setEditForm] = useState({}); // Formulario de edición

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
        const [petData, historyData] = await Promise.all([
            getPetById(id),
            getMedicalHistory(id)
        ]);
        setPet(petData);
        // Inicializamos el formulario de edición con los datos actuales
        setEditForm(petData);
        setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
        console.error(error);
        toast.error("Error cargando el expediente.");
    } finally {
        setLoading(false);
    }
  };

  // Guardar Registro Médico
  const handleAddRecord = async (e) => {
      e.preventDefault();
      if(!recordForm.date || !recordForm.description) return toast.warning("Completa los campos");

      try {
          await addMedicalRecord(id, recordForm);
          toast.success("Registro añadido 📝");
          setIsRecordModalOpen(false);
          setRecordForm({ type: 'Vacuna', date: '', description: '' });
          loadData();
      } catch (error) {
          console.error(error);
          toast.error("Error al guardar registro");
      }
  };

  // Guardar Edición de Mascota
  const handleEditPet = async (e) => {
      e.preventDefault();
      try {
          await updatePet(id, editForm);
          toast.success("Datos actualizados ✅");
          setIsEditModalOpen(false);
          loadData(); // Recargar datos para ver cambios
      } catch (error) {
          console.error(error);
          toast.error("Error al actualizar mascota");
      }
  };

  if (loading) return <div className="p-10 text-center">Cargando expediente...</div>;
  if (!pet) return <div className="p-10 text-center text-red-500">Mascota no encontrada</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver</Link>
      
      {/* TARJETA DE PERFIL */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row mb-8 relative group">
          
          {/* Botón de Editar (Visible siempre o al hacer hover) */}
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 right-4 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 p-2 rounded-full transition-colors z-10"
            title="Editar datos"
          >
            ✏️
          </button>

          <div className="h-64 md:h-auto md:w-1/3 bg-gray-200 relative">
              {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🐶</div>
              )}
          </div>
          
          <div className="p-8 flex-1">
              <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">{pet.name}</h1>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase">{pet.type}</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                      <p className="text-gray-500 text-sm">Raza</p>
                      <p className="font-semibold text-lg">{pet.breed || 'Mestizo'}</p>
                  </div>
                  <div>
                      <p className="text-gray-500 text-sm">Edad / Nacimiento</p>
                      <p className="font-semibold text-lg">{new Date(pet.birth_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                      <p className="text-gray-500 text-sm">Peso</p>
                      <p className="font-semibold text-lg">{pet.weight} kg</p>
                  </div>
                  <div>
                      <p className="text-gray-500 text-sm">Estado</p>
                      <p className="font-semibold text-lg">{pet.is_sterilized ? 'Esterilizado ✅' : 'No esterilizado'}</p>
                  </div>
                  {pet.allergies && (
                      <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100">
                          <p className="text-red-500 text-sm font-bold">Alergias / Notas:</p>
                          <p className="text-red-700">{pet.allergies}</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* HISTORIAL MÉDICO */}
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Historial Médico</h2>
          <button 
            onClick={() => setIsRecordModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow flex items-center gap-2 font-bold"
          >
            + Agregar Registro
          </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          {history.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                  <p>No hay registros médicos aún.</p>
                  <p className="text-sm">Agrega vacunas, cirugías o consultas aquí.</p>
              </div>
          ) : (
              <div className="space-y-4">
                  {history.map((record) => (
                      <div key={record.id} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 
                              ${record.type === 'Vacuna' ? 'bg-blue-100 text-blue-600' : 
                                record.type === 'Cirugía' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                              {record.type === 'Vacuna' ? '💉' : record.type === 'Cirugía' ? '🏥' : '💊'}
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                              <h4 className="font-bold text-gray-800">{record.type}: {record.description}</h4>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* --- MODAL 1: NUEVO REGISTRO MÉDICO --- */}
      {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Nuevo Registro Médico</h3>
                  <form onSubmit={handleAddRecord} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Tipo</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={recordForm.type}
                            onChange={e => setRecordForm({...recordForm, type: e.target.value})}
                          >
                              <option value="Vacuna">Vacuna</option>
                              <option value="Desparasitación">Desparasitación</option>
                              <option value="Cirugía">Cirugía</option>
                              <option value="Consulta">Consulta / Enfermedad</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Fecha</label>
                          <input 
                            type="date" 
                            className="w-full border p-2 rounded"
                            required
                            value={recordForm.date}
                            onChange={e => setRecordForm({...recordForm, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Descripción</label>
                          <textarea 
                            className="w-full border p-2 rounded"
                            rows="3"
                            required
                            placeholder="Detalles..."
                            value={recordForm.description}
                            onChange={e => setRecordForm({...recordForm, description: e.target.value})}
                          ></textarea>
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setIsRecordModalOpen(false)} className="flex-1 bg-gray-100 p-2 rounded">Cancelar</button>
                          <button type="submit" className="flex-1 bg-green-600 text-white font-bold p-2 rounded">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- MODAL 2: EDITAR MASCOTA (NUEVO) --- */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Editar Datos de {pet.name}</h3>
                  <form onSubmit={handleEditPet} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Nombre</label>
                            <input 
                                className="w-full border p-2 rounded" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Tipo</label>
                            <select 
                                className="w-full border p-2 rounded bg-white" 
                                value={editForm.type} 
                                onChange={e => setEditForm({...editForm, type: e.target.value})}
                            >
                                <option value="Perro">Perro</option>
                                <option value="Gato">Gato</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Raza</label>
                            <input 
                                className="w-full border p-2 rounded" 
                                value={editForm.breed} 
                                onChange={e => setEditForm({...editForm, breed: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Peso (kg)</label>
                            <input 
                                type="number" step="0.1"
                                className="w-full border p-2 rounded" 
                                value={editForm.weight} 
                                onChange={e => setEditForm({...editForm, weight: e.target.value})} 
                            />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Fecha Nacimiento</label>
                            {/* Ajuste para que la fecha se vea bien en el input date (YYYY-MM-DD) */}
                            <input 
                                type="date"
                                className="w-full border p-2 rounded" 
                                value={editForm.birth_date ? new Date(editForm.birth_date).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditForm({...editForm, birth_date: e.target.value})} 
                            />
                        </div>
                        <div className="flex items-center mt-6">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 mr-2"
                                checked={editForm.is_sterilized} 
                                onChange={e => setEditForm({...editForm, is_sterilized: e.target.checked})} 
                            />
                            <label className="text-sm font-medium">¿Esterilizado?</label>
                        </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium">Alergias / Notas</label>
                          <textarea 
                            className="w-full border p-2 rounded"
                            rows="2"
                            value={editForm.allergies || ''} 
                            onChange={e => setEditForm({...editForm, allergies: e.target.value})} 
                          />
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 p-2 rounded hover:bg-gray-200">Cancelar</button>
                          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">Guardar Cambios</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default PetDetails;