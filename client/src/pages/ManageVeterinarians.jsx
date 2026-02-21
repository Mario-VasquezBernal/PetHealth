// ============================================
// PAGES/MANAGEVETERINARIANS.JSX
// ============================================
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import { Stethoscope, Building2, Phone, Mail, ClipboardList, Plus, X } from 'lucide-react';
import StarRating from '../components/StarRating';

// Colores por especialidad
const SPECIALTY_COLORS = {
  'Cirugía':             'bg-red-100 text-red-700',
  'Cirugía General':     'bg-red-100 text-red-700',
  'Dermatología':        'bg-orange-100 text-orange-700',
  'Cardiología':         'bg-pink-100 text-pink-700',
  'Nutrición':           'bg-yellow-100 text-yellow-700',
  'Odontología':         'bg-purple-100 text-purple-700',
  'Oftalmología':        'bg-cyan-100 text-cyan-700',
  'Oncología':           'bg-rose-100 text-rose-700',
  'Neurología':          'bg-violet-100 text-violet-700',
  'Ortopedia':           'bg-amber-100 text-amber-700',
  'Veterinario General': 'bg-blue-100 text-blue-700',
  default:               'bg-blue-100 text-blue-700',
};

const getSpecialtyColor = (specialty) => {
  if (!specialty) return SPECIALTY_COLORS.default;
  return SPECIALTY_COLORS[specialty] || SPECIALTY_COLORS.default;
};

// Avatar con iniciales + color por nombre
const VetAvatar = ({ name }) => {
  const initials = name
    ? name.trim().split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : '?';

  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
    'bg-emerald-500', 'bg-cyan-500', 'bg-teal-500',
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500',
  ];

  const color = name ? colors[name.charCodeAt(0) % colors.length] : colors[0];

  return (
    <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const ManageVeterinarians = () => {
  const [user, setUser]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [veterinarians, setVeterinarians] = useState([]);
  const [clinics, setClinics]           = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [errors, setErrors]             = useState({});
  const [editingId, setEditingId]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [consultCounts, setConsultCounts] = useState({});
  const [search, setSearch]             = useState('');

  const [formData, setFormData] = useState({
    name: '', specialty: '', phone: '', email: '', clinic_id: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch clínicas
  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/public/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(res.data || []);
    } catch (err) {
      console.error('Error cargando clínicas:', err);
    }
  }, [API_URL]);

  // Fetch vets
  const fetchVeterinarians = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vets = res.data.veterinarians || res.data || [];
      vets.sort((a, b) => Number(b.average_rating) - Number(a.average_rating));
      setVeterinarians(vets);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando lista de veterinarios');
    }
  }, [API_URL]);

  // Fetch contador consultas
  const fetchConsultCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/veterinarians/consult-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const map = {};
      (res.data || []).forEach(r => { map[r.vet_id] = parseInt(r.count); });
      setConsultCounts(map);
    } catch {
      // endpoint opcional, silencioso
    }
  }, [API_URL]);

  useEffect(() => {
    getUserProfile().then(setUser).catch(console.error);
    fetchClinics();
    fetchVeterinarians();
    fetchConsultCounts();
  }, [fetchVeterinarians, fetchClinics, fetchConsultCounts]);

  // Validación campos
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'name') {
      if (!value.trim()) newErrors.name = 'El nombre es obligatorio';
      else if (value.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';
      else delete newErrors.name;
    }

    if (name === 'phone') {
      if (value && !/^\d{10}$/.test(value)) newErrors.phone = '10 dígitos requeridos';
      else delete newErrors.phone;
    }

    if (name === 'email') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Email no válido';
      else delete newErrors.email;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (formData.name.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = '10 dígitos requeridos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', specialty: '', phone: '', email: '', clinic_id: '' });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error('Corrige los errores');

    setLoading(true);
    try {
      const token   = localStorage.getItem('token');
      const payload = { ...formData, clinic_id: formData.clinic_id || 'independent' };

      if (editingId) {
        await axios.put(`${API_URL}/veterinarians/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario actualizado');
      } else {
        await axios.post(`${API_URL}/veterinarians`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Veterinario creado');
      }

      resetForm();
      fetchVeterinarians();
      fetchConsultCounts();
    } catch {
      toast.error('Error al guardar veterinario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vet) => {
    setFormData({
      name:      vet.name,
      specialty: vet.specialty  || '',
      phone:     vet.phone      || '',
      email:     vet.email      || '',
      clinic_id: vet.clinic_id  || ''
    });
    setErrors({});
    setEditingId(vet.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar veterinario?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/veterinarians/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Veterinario eliminado');
      fetchVeterinarians();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Filtro búsqueda
  const filtered = veterinarians.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.specialty || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.clinic_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 lg:px-8 py-8">

          {/* HEADER RESPONSIVE */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Gestión de Veterinarios</h1>
                <p className="text-sm text-gray-600">Vincula doctores a tus clínicas registradas</p>
              </div>
            </div>
            <button
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl font-semibold shadow text-sm transition-colors ${
                showForm
                  ? 'bg-gray-400 hover:bg-gray-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Veterinario</>}
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{veterinarians.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total vets</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {veterinarians.filter(v => v.clinic_id).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">En clínica</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-orange-500">
                {veterinarians.filter(v => !v.clinic_id).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Independientes</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-violet-600">
                {Object.values(consultCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Consultas QR</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* FORMULARIO */}
            {showForm && (
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  {editingId ? '✏️ Editar Veterinario' : '➕ Nuevo Veterinario'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                      Lugar de Trabajo
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                      <select
                        name="clinic_id"
                        value={formData.clinic_id}
                        onChange={handleChange}
                        className="w-full pl-10 border p-2.5 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Seleccione lugar --</option>
                        <option value="independent">🏠 Independiente / A Domicilio</option>
                        {clinics.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nombre completo *"
                      className={`w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                      Especialidad
                    </label>
                    <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      className="w-full border p-2.5 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Sin especialidad --</option>
                      <option>Veterinario General</option>
                      <option>Cirugía</option>
                      <option>Cirugía General</option>
                      <option>Cardiología</option>
                      <option>Dermatología</option>
                      <option>Nutrición</option>
                      <option>Odontología</option>
                      <option>Oftalmología</option>
                      <option>Oncología</option>
                      <option>Neurología</option>
                      <option>Ortopedia</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Teléfono (10 dígitos)"
                      maxLength={10}
                      inputMode="numeric"
                      className={`w-full pl-9 border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className={`w-full pl-9 border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <button
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Veterinario'}
                  </button>
                </form>
              </div>
            )}

            {/* LISTA DE VETS */}
            <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, especialidad o clínica..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />

              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No se encontraron veterinarios</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(vet => (
                    <div
                      key={vet.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${
                        vet.clinic_name ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {vet.clinic_name || 'Independiente'}
                      </div>

                      <div className="flex items-center gap-3 mb-3 mt-3">
                        <VetAvatar name={vet.name} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{vet.name}</h3>
                          <StarRating
                            value={Number(vet.average_rating || 0)}
                            total={vet.total_ratings || 0}
                          />
                        </div>
                      </div>

                      {vet.specialty && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getSpecialtyColor(vet.specialty)}`}>
                          🩺 {vet.specialty}
                        </span>
                      )}

                      <div className="space-y-1 text-sm text-gray-500 mb-3">
                        {vet.phone && (
                          <p className="flex items-center gap-2">
                            <Phone size={13} className="text-gray-400" /> {vet.phone}
                          </p>
                        )}
                        {vet.email && (
                          <p className="flex items-center gap-2 truncate">
                            <Mail size={13} className="text-gray-400" /> {vet.email}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2 mb-3">
                        <ClipboardList size={15} className="text-indigo-500" />
                        <span className="text-xs text-indigo-700 font-semibold">
                          {consultCounts[vet.id] ?? 0} consultas registradas
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vet)}
                          className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-xl font-bold transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(vet.id)}
                          className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-xl font-bold transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageVeterinarians;
