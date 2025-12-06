import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../dataManager';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return toast.warning('Por favor completa todos los campos');
    }

    try {
      setLoading(true);
      
      const data = await loginUser({
        email: formData.email,
        password: formData.password
      });
      
      localStorage.setItem('token', data.token);
      toast.success('¡Bienvenido!');
      navigate('/home');
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-2xl p-8 w-full max-w-md border border-primary-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Bienvenido 👋</h1>
          <p className="text-primary-600">Ingresa tus datos para acceder.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Registro */}
        <div className="mt-6 text-center">
          <p className="text-primary-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 hover:underline transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
