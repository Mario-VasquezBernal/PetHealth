import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getPetById, deletePetFromStorage, getMedicalRecords, getUserProfile } from '../dataManager';
import QRGenerator from '../components/QRGenerator';
import MedicalHistory from '../components/MedicalHistory';
import WeightPrediction from '../components/WeightPrediction';
import HealthRiskCalculator from '../components/HealthRiskCalculator';
import HealthAIPredictor from '../components/HealthAIPredictor';
import StyledQRCard from '../components/StyledQRCard';

import { normalizeSpecies, getSpeciesProfile } from '../speciesProfiles';

import { 
  Calendar, 
  Weight, 
  Heart,
  AlertCircle,
  Edit,
  Trash2,
  Cake,
  Stethoscope,
  QrCode,
  FileText,
  Activity,
  TrendingUp,
  RefreshCw,
  MapPin
} from 'lucide-react';

const PetDetails = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const [medicalStats, setMedicalStats] = useState({
    totalRecords: 0,
    lastVisit: null
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [petData, userData] = await Promise.all([
        getPetById(id),
        getUserProfile()
      ]);
      setPet(petData);
      setUser(userData);
      await loadMedicalStats();
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalStats = async () => {
    try {
      const records = await getMedicalRecords(id);
      if (records.records && records.records.length > 0) {
        setMedicalStats({
          totalRecords: records.records.length,
          lastVisit: records.records[0].visit_date
        });
      }
    } catch {
      console.log('No hay registros médicos aún');
    }
  };

  const reloadAllData = async () => {
    try {
      setRefreshing(true);
      const freshPetData = await getPetById(id, true);
      setPet(freshPetData);
      await loadMedicalStats();
      toast.success('✅ Datos actualizados correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar datos');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar a ${pet.name}?`)) {
      try {
        await deletePetFromStorage(id);
        toast.success("Mascota eliminada");
        navigate('/home');
      } catch (error) {
        console.error(error);
        toast.error("Error al eliminar");
      }
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) return `${months} meses`;
    if (months < 0) return `${years - 1} años y ${12 + months} meses`;
    return `${years} años ${months > 0 ? `y ${months} meses` : ''}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDefaultImage = (speciesKey) => {
    const images = {
      dog: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
      cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
      bird: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800',
      rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800',
      reptile: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800'
    };

    return images[speciesKey] || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />
        <div className="flex-1 lg:ml-72 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mascota no encontrada</h2>
            <button onClick={() => navigate('/home')} className="text-blue-600 hover:underline">Volver al inicio</button>
          </div>
        </div>
      </div>
    );
  }

  const normalizedSpecies = normalizeSpecies(pet);
  const speciesProfile = getSpeciesProfile(normalizedSpecies);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNewPet={null} />

      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} onNewPet={null} />

        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-900" strokeWidth={2} />
              <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-1 space-y-4">

              {/* tarjeta mascota */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50">
                  <img 
                    src={pet.photo_url || getDefaultImage(normalizedSpecies)} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = getDefaultImage(normalizedSpecies); }}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-blue-700 border border-blue-200 shadow-md">
                    {speciesProfile.label}
                  </div>
                </div>
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{pet.name}</h1>
                  <p className="text-gray-600 text-lg mb-4">{pet.breed || 'Raza mixta'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/pets/${id}/edit`)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-all">
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-all">
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {/* info básica */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" /> Información Básica
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm flex items-center gap-2"><Cake className="w-4 h-4" /> Edad</span>
                    <span className="font-semibold text-gray-900">{calculateAge(pet.birth_date)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Género</span>
                    <span className="font-semibold text-gray-900">{pet.gender}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm flex items-center gap-2"><Weight className="w-4 h-4" /> Peso</span>
                    <span className="font-semibold text-gray-900">{pet.weight ? `${pet.weight} kg` : 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Esterilizado</span>
                    <span className="font-semibold text-gray-900">{pet.is_sterilized ? 'Sí' : 'No'}</span>
                  </div>
                </div>

                {pet.allergies && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> ALERGIAS / NOTAS
                    </p>
                    <p className="text-sm text-orange-800 bg-orange-50 p-2 rounded-lg">
                      {pet.allergies}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="lg:col-span-2 space-y-6">

              {/* tabs */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                <div className="grid grid-cols-3 gap-2">

                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                      activeTab === 'summary'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Heart className="w-5 h-5" /> Resumen
                  </button>

                  <button
                    onClick={() => setActiveTab("qr")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                      activeTab === 'qr'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5" /> Pase Médico
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                      activeTab === 'history'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <FileText className="w-5 h-5" /> Historial
                  </button>

                </div>
              </div>

              <div>

                {activeTab === 'summary' && (
                  <div className="space-y-6">

                    <div className="flex justify-end">
                      <button
                        onClick={reloadAllData}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl border border-blue-200 font-medium text-sm transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Actualizando...' : 'Actualizar datos'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-600 uppercase">Última Consulta</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {medicalStats.lastVisit ? formatDate(medicalStats.lastVisit) : 'Sin registro'}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-xl border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-5 h-5 text-orange-600" />
                          <p className="text-xs font-semibold text-orange-600 uppercase">Consultas</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">
                          {medicalStats.totalRecords}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Weight className="w-5 h-5 text-purple-600" />
                          <p className="text-xs font-semibold text-purple-600 uppercase">Peso Actual</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {pet.weight ? `${pet.weight} kg` : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-xl border border-cyan-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Cake className="w-5 h-5 text-cyan-600" />
                          <p className="text-xs font-semibold text-cyan-600 uppercase">Edad</p>
                        </div>
                        <p className="text-lg font-bold text-cyan-900">
                          {calculateAge(pet.birth_date)}
                        </p>
                      </div>
                    </div>

                    <WeightPrediction petId={id} pet={pet} />

                    <HealthRiskCalculator pet={pet} />
                    <HealthAIPredictor petId={pet.id} pet={pet} />


                    {/* QR SOLO LECTURA */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">

                        <div className="flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2">
                            QR de Identificación
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Muestra este código para que cualquier profesional lea el historial de {pet.name}.
                          </p>
                        </div>

                        <StyledQRCard
                          title="QR de identificación"
                          subtitle="Acceso al historial en modo lectura"
                          mode="READ_ONLY"
                          petName={pet.name}
                        >
                          <QRGenerator
                            petId={id}
                            petName={pet.name}
                            mode="READ_ONLY"
                          />
                        </StyledQRCard>

                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'qr' && (
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-in zoom-in-95 duration-300">

                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Stethoscope size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Configurar Pase Médico
                    </h2>

                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Selecciona el lugar y el médico para generar el acceso de registro de consulta.
                    </p>

                    <StyledQRCard
                      title="Pase médico"
                      subtitle="Seleccione un médico antes de generar el pase"
                      mode="WRITE"
                      petName={pet.name}
                    >
                      <QRGenerator
                        petId={id}
                        petName={pet.name}
                        mode="WRITE"
                      />
                    </StyledQRCard>

                  </div>
                )}

                {activeTab === 'history' && (
                  <MedicalHistory petId={id} />
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PetDetails;
