import { APP_CONFIG } from '../constants';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../dataManager';
import { Mail, Lock } from 'lucide-react';

import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home', { replace: true });
  }, [navigate]);

  const validateField = (field, value) => {
    let msg = '';

    if (!value.trim()) msg = 'Campo obligatorio';
    else if (field === 'email' && !emailRegex.test(value)) msg = 'Email inválido';
    else if (field === 'password' && value.length < 6) msg = 'Mínimo 6 caracteres';

    setErrors(prev => ({ ...prev, [field]: msg }));
    return msg === '';
  };

  const validateForm = () => {
    const e1 = validateField('email', email);
    const e2 = validateField('password', password);
    return e1 && e2;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('token', data.token);
      toast.success('¡Bienvenido!');
      navigate('/home');
    } catch (error) {
      toast.error(error.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const userEmail = prompt('Ingresa tu email:');
    if (!userEmail) return;

    if (!emailRegex.test(userEmail)) {
      toast.error('Email inválido');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await res.json();
      res.ok ? toast.success('📧 Revisa tu correo') : toast.error(data.error);
    } catch {
      toast.error('Error de conexión');
    }
  };

  // ===============================
  // GOOGLE LOGIN (nuevo)
  // ===============================
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      let idToken;

      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();

        if (!result.credential?.idToken) {
          throw new Error("No se pudo obtener el token de Google");
        }

        idToken = result.credential.idToken;

      } else {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al autenticar con Google");
      }

      localStorage.setItem("token", data.token);
      toast.success("¡Bienvenido!");
      navigate("/home");

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <img src={APP_CONFIG.LOGO_URL} className="w-20 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-blue-600">{APP_CONFIG.APP_NAME}</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <h2 className="text-xl font-bold">Bienvenido 👋</h2>

            {/* EMAIL */}
            <div>
              <label className="text-sm">Correo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    validateField('email', e.target.value);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-xl ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    validateField('password', e.target.value);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-xl ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">o</span>
              </div>
            </div>

            {/* Google button */}
           <button
  type="button"
  onClick={handleGoogleLogin}
  disabled={loading}
  className="w-full border border-gray-300 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
>
  Continuar con Google
</button>


            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 text-sm w-full text-center"
            >
              ¿Olvidaste tu contraseña?
            </button>

            <p className="text-center text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 font-semibold">
                Regístrate
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
