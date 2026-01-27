import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../dataManager';
import { User, Mail, Lock, Phone, MapPin, Globe } from 'lucide-react';

const onlyLettersRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ========================
  // VALIDACIONES EN VIVO
  // ========================
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es obligatorio';
        } else if (!onlyLettersRegex.test(value)) {
          newErrors.name = 'Solo se permiten letras y espacios';
        } else if (value.trim().length < 3) {
          newErrors.name = 'Mínimo 3 caracteres';
        } else {
          delete newErrors.name;
        }
        break;

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) newErrors.email = 'Email inválido';
        else delete newErrors.email;
        break;
      }

      case 'password':
        if (value.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        else delete newErrors.password;

        if (formData.confirmPassword && value !== formData.confirmPassword)
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        else delete newErrors.confirmPassword;
        break;

      case 'confirmPassword':
        if (value !== formData.password)
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        else delete newErrors.confirmPassword;
        break;

      case 'phone':
        if (value && !/^[0-9]{10}$/.test(value))
          newErrors.phone = 'Debe tener 10 dígitos';
        else delete newErrors.phone;
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // ========================
  // HANDLE CHANGE
  // ========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🚫 bloquear números en nombre
    if (name === 'name' && /[0-9]/.test(value)) return;

    // solo números en teléfono
    if (name === 'phone' && value && !/^\d*$/.test(value)) return;

    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  // ========================
  // VALIDACIÓN FINAL
  // ========================
  const validateForm = () => {
    const newErrors = {};

    if (!onlyLettersRegex.test(formData.name))
      newErrors.name = 'Solo letras permitidas';

    if (formData.name.trim().length < 3)
      newErrors.name = 'Mínimo 3 caracteres';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email inválido';

    if (formData.password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Las contraseñas no coinciden';

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = 'Teléfono inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================
  // SUBMIT
  // ========================
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Corrige los errores del formulario');
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser(formData);
      localStorage.setItem('token', data.token);

      toast.success('Cuenta creada correctamente 🎉');
      navigate('/home');
    } catch (error) {
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // UI
  // ========================
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-xl">

        <h1 className="text-3xl font-bold text-center mb-6">Crear Cuenta</h1>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* NOMBRE */}
          <div>
            <label className="block mb-1 font-medium">Nombre completo *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* EMAIL */}
          <div>
            <label className="block mb-1 font-medium">Email *</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block mb-1 font-medium">Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* CONFIRM */}
          <div>
            <label className="block mb-1 font-medium">Confirmar contraseña *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* PHONE */}
          <div>
            <label className="block mb-1 font-medium">Teléfono</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>

        </form>

        <p className="text-center mt-4">
          ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
