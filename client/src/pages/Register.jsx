import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../dataManager';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  
  // 1. Estado inicial con TODOS los campos
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ⚠️ FUNCIÓN handleSubmit DENTRO DEL COMPONENTE Y CON LÓGICA DE LIMPIEZA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar error visual
    
    // 2. LIMPIEZA DE DATOS CRUCIAL
    const cleanData = {
        ...formData,
        email: formData.email.trim(), // Elimina espacios en blanco
    };

    try {
      // 3. Envío al backend
      const data = await registerUser(cleanData); 
      
      localStorage.setItem('token', data.token);
      toast.success("¡Registro exitoso! Bienvenido 🥳", { autoClose: 5000 });
      navigate('/');
    } catch (err) {
      console.error(err);
      // Muestra el error específico del servidor (ej: "El usuario ya existe")
      // Si el servidor devolvió un objeto de error, intentamos leer su mensaje.
      setError(err.message || 'Error al registrar. El correo podría ya estar en uso.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta 🚀</h1>
          <p className="text-gray-500 mt-2">Completa tu perfil para empezar.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-center text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- SECCIÓN 1: DATOS DE LA CUENTA --- */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Datos de Acceso</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input name="name" type="text" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Juan Pérez" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="juan@ejemplo.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="********" />
                </div>
            </div>
          </div>

          {/* --- SECCIÓN 2: DATOS DE CONTACTO --- */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Información de Contacto</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input name="phone" type="tel" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="099 123 4567" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <input name="address" type="text" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Av. Principal 123" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                        <input name="city" type="text" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cuenca" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">País</label>
                        <input name="country" type="text" required onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ecuador" />
                    </div>
                </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg mt-6">
            Registrarse
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;