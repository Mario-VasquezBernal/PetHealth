import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../dataManager';

const Profile = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Cargar datos al entrar
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data) setFormData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      await updateUserProfile(formData);
      setMessage({ text: '¡Perfil actualizado con éxito! ✅', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error al actualizar el perfil ❌', type: 'error' });
    }
  };

  if (loading) return <div className="text-center p-10">Cargando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      
      {/* BOTÓN VOLVER AL DASHBOARD */}
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-2 font-medium transition-colors hover:text-blue-800">
        &larr; Volver al Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Mi Perfil 👤</h1>
            <p className="opacity-90">Mantén tu información actualizada</p>
        </div>

        <div className="p-8">
            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email (Solo lectura) */}
                <div>
                    <label className="block text-sm font-medium text-gray-500">Correo Electrónico (No editable)</label>
                    <input 
                        type="email" 
                        value={formData.email} 
                        disabled 
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 mt-1 cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                        <input name="city" type="text" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Dirección</label>
                        <input name="address" type="text" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">País</label>
                        <input name="country" type="text" value={formData.country} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                    </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 font-medium">
                        Cancelar
                    </Link>

                    <button className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;