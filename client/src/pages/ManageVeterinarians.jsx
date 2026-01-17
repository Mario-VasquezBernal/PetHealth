import { useState, useEffect } from 'react';
import axios from 'axios';

const ManageVeterinarians = () => {
  const [veterinarians, setVeterinarians] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    license_number: '',
    phone: '',
    email: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  useEffect(() => {
    fetchVeterinarians();
  }, []);

  const fetchVeterinarians = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVeterinarians(res.data.veterinarians || []);
    } catch (error) {
      console.error('Error cargando veterinarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        await axios.put(`${API_URL}/veterinarians/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Veterinario actualizado exitosamente');
      } else {
        await axios.post(`${API_URL}/veterinarians`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Veterinario creado exitosamente');
      }

      setFormData({ name: '', specialty: '', license_number: '', phone: '', email: '' });
      setEditingId(null);
      setShowForm(false);
      fetchVeterinarians();
    } catch (error) {
      console.error('Error guardando veterinario:', error);
      alert('❌ Error al guardar el veterinario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vet) => {
    setFormData({
      name: vet.name,
      specialty: vet.specialty || '',
      license_number: vet.license_number || '',
      phone: vet.phone || '',
      email: vet.email || ''
    });
    setEditingId(vet.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este veterinario?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/veterinarians/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Veterinario eliminado exitosamente');
      fetchVeterinarians();
    } catch (error) {
      console.error('Error eliminando veterinario:', error);
      alert('❌ Error al eliminar el veterinario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">👨‍⚕️ Gestión de Veterinarios</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', specialty: '', license_number: '', phone: '', email: '' });
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg"
          >
            {showForm ? '❌ Cancelar' : '➕ Nuevo Veterinario'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? '✏️ Editar Veterinario' : '➕ Nuevo Veterinario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Dr. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Cirugía, Dermatología"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Licencia
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: VET-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 0987654321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: vet@clinica.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
              >
                {loading ? 'Guardando...' : editingId ? '💾 Actualizar Veterinario' : '➕ Crear Veterinario'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {veterinarians.map((vet) => (
            <div key={vet.id} className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{vet.name}</h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                {vet.specialty && <p>🩺 {vet.specialty}</p>}
                {vet.license_number && <p>🆔 Licencia: {vet.license_number}</p>}
                {vet.phone && <p>📞 {vet.phone}</p>}
                {vet.email && <p>📧 {vet.email}</p>}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vet)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(vet.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {veterinarians.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-xl text-gray-500 mb-2">No hay veterinarios registrados</p>
            <p className="text-sm text-gray-400">Crea tu primer veterinario haciendo clic en "Nuevo Veterinario"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageVeterinarians;
