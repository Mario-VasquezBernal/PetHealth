import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../dataManager'; // Importamos la función

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.type]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    try {
      const data = await loginUser(formData.email, formData.password);
      
      // 1. Guardar el token en el navegador
      localStorage.setItem('token', data.token);
      
      // 2. Redirigir al Dashboard
      navigate('/');
      
    } catch (err) {
      setError('Credenciales incorrectas o error de conexión');
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Bienvenido 👋</h1>
          <p className="text-gray-500 mt-2">Ingresa tus datos para acceder.</p>
        </div>

        {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
            Ingresar
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;