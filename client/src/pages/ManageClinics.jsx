import { useState, useEffect } from 'react';
import axios from 'axios';

const ManageClinics = () => {
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    latitude: '',
    longitude: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data.clinics || []);
    } catch (error) {
      console.error('Error cargando clínicas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        await axios.put(`${API_URL}/clinics/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Clínica actualizada exitosamente');
      } else {
        await axios.post(`${API_URL}/clinics`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Clínica creada exitosamente');
      }

      setFormData({ name: '', address: '', city: '', phone: '', latitude: '', longitude: '' });
      setEditingId(null);
      setShowForm(false);
      fetchClinics();
    } catch (error) {
      console.error('Error guardando clínica:', error);
      alert('❌ Error al guardar la clínica');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic) => {
    setFormData({
      name: clinic.name,
      address: clinic.address,
      city: clinic.city || '',
      phone: clinic.phone || '',
      latitude: clinic.latitude || '',
      longitude: clinic.longitude || ''
    });
    setEditingId(clinic.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta clínica?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clinics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Clínica eliminada exitosamente');
      fetchClinics();
    } catch (error) {
      console.error('Error eliminando clínica:', error);
      alert('❌ Error al eliminar la clínica');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🏥 Gestión de Clínicas</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', address: '', city: '', phone: '', latitude: '', longitude: '' });
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg"
          >
            {showForm ? '❌ Cancelar' : '➕ Nueva Clínica'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? '✏️ Editar Clínica' : '➕ Nueva Clínica'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Clínica *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Clínica Veterinaria El Bosque"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Cuenca"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Av. González Suárez 123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: 07-1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitud (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="-2.9001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="-79.0059"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
              >
                {loading ? 'Guardando...' : editingId ? '💾 Actualizar Clínica' : '➕ Crear Clínica'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{clinic.name}</h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>📍 {clinic.address}</p>
                <p>🏙️ {clinic.city || 'Sin ciudad'}</p>
                {clinic.phone && <p>📞 {clinic.phone}</p>}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(clinic)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(clinic.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {clinics.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-xl text-gray-500 mb-2">No hay clínicas registradas</p>
            <p className="text-sm text-gray-400">Crea tu primera clínica haciendo clic en "Nueva Clínica"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClinics;
