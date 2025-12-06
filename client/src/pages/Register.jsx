import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../dataManager';
import { User, Mail, Lock, Phone, MapPin, Globe } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }

    if (formData.password.length < 6) {
      return toast.warning('La contraseña debe tener al menos 6 caracteres');
    }

    try {
      setLoading(true);
      
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country
      });
      
      localStorage.setItem('token', data.token);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/home');
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-8 px-4">
      <div className="bg-white rounded-card shadow-2xl p-8 w-full max-w-2xl mx-auto border border-primary-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Crear Cuenta 🚀</h1>
          <p className="text-primary-600">Completa tu perfil para empezar.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* Datos de Acceso */}
          <div className="bg-primary-50 p-5 rounded-xl border border-primary-100">
            <h3 className="font-bold text-primary-900 mb-4">DATOS DE ACCESO</h3>
            
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-primary-50 p-5 rounded-xl border border-primary-100">
            <h3 className="font-bold text-primary-900 mb-4">INFORMACIÓN DE CONTACTO</h3>
            
            <div className="space-y-4">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                    placeholder="0999999999"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                    placeholder="Av. Principal 123"
                  />
                </div>
              </div>

              {/* Ciudad y País */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                    placeholder="Quito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    País
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
                      placeholder="Ecuador"
                    />
                  </div>
                </div>
              </div>
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
              'Registrarse'
            )}
          </button>
        </form>

        {/* Login */}
        <div className="mt-6 text-center">
          <p className="text-primary-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 hover:underline transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
