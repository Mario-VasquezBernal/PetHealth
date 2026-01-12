import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../dataManager';
import { Heart, Mail, Lock } from 'lucide-react';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  // Si ya hay sesión iniciada, no permitir ver /login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }


    setLoading(true);
    try {
      const data = await loginUser({ email, password });


      localStorage.setItem('token', data.token);
      toast.success('¡Bienvenido!');
      navigate('/home');
    } catch (error) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    const userEmail = prompt('Ingresa tu email para recuperar tu contraseña:');
    
    if (!userEmail) return;

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('📧 Revisa tu correo para restablecer tu contraseña', {
          autoClose: 5000
        });
      } else {
        toast.error(data.error || 'Error al enviar email');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión. Intenta de nuevo.');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-4 shadow-xl">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            PetHealth
          </h1>
          <p className="text-gray-600 text-lg">Cuida a tus mascotas con amor</p>
        </div>


        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Bienvenido 👋</h2>
              <p className="text-gray-600">Ingresa tus datos para acceder</p>
            </div>


            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>


            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 focus:ring-4 focus:ring-emerald-300 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>


            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>


            {/* Register Link */}
            <p className="text-center text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};


export default Login;
