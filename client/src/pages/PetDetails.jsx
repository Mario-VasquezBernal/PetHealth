import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPetById, deletePetFromStorage } from '../dataManager';
import QRGenerator from '../components/QRGenerator';
import MedicalHistory from '../components/MedicalHistory';
import { 
  ArrowLeft, 
  Calendar, 
  Weight, 
  Heart,
  AlertCircle,
  Edit,
  Trash2,
  Cake,
  Stethoscope,
  QrCode,
  FileText
} from 'lucide-react';

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'qr', 'history'

  useEffect(() => {
  loadPet();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);


  const loadPet = async () => {
    try {
      setLoading(true);
      const data = await getPetById(id);
      setPet(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la mascota");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar a ${pet.name}?`)) {
      try {
        await deletePetFromStorage(id);
        toast.success("Mascota eliminada");
        navigate('/');
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

  const getDefaultImage = (species) => {
    const images = {
      'Perro': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
      'Gato': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
      'Ave': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800',
      'Conejo': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800',
    };
    return images[species] || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Mascota no encontrada</h2>
          <Link to="/" className="text-primary-600 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Info de la Mascota */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Card de Imagen */}
            <div className="bg-white rounded-card overflow-hidden shadow-card border border-primary-100">
              <div className="relative aspect-square bg-gradient-to-br from-primary-100 to-primary-50">
                <img 
                  src={pet.photo_url || getDefaultImage(pet.type || pet.species)} 
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = getDefaultImage(pet.type || pet.species);
                  }}
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-primary-700 border border-primary-200">
                  {pet.type || pet.species}
                </div>
              </div>
              
              <div className="p-6">
                <h1 className="text-3xl font-bold text-primary-900 mb-2">{pet.name}</h1>
                <p className="text-primary-600 text-lg mb-4">{pet.breed || 'Raza mixta'}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/pets/${id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 rounded-xl hover:bg-primary-600 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl hover:bg-red-600 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Card de Info Básica */}
            <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
              <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary-600" />
                Información Básica
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 text-sm flex items-center gap-2">
                    <Cake className="w-4 h-4" />
                    Edad
                  </span>
                  <span className="font-semibold text-primary-900">{calculateAge(pet.birth_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 text-sm">Género</span>
                  <span className="font-semibold text-primary-900">{pet.gender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 text-sm flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Peso
                  </span>
                  <span className="font-semibold text-primary-900">{pet.weight ? `${pet.weight} kg` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 text-sm">Esterilizado</span>
                  <span className="font-semibold text-primary-900">{pet.is_sterilized ? 'Sí' : 'No'}</span>
                </div>
              </div>

              {pet.allergies && (
                <div className="mt-4 pt-4 border-t border-primary-100">
                  <p className="text-xs font-semibold text-primary-700 mb-1">ALERGIAS / NOTAS</p>
                  <p className="text-sm text-primary-600">{pet.allergies}</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tabs (QR y Historial) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Navegación de Tabs */}
            <div className="bg-white rounded-card shadow-card border border-primary-100 p-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'info'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Resumen
                </button>
                
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'qr'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  Código QR
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'history'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Historial
                </button>
              </div>
            </div>

            {/* Contenido de Tabs */}
            <div>
              {activeTab === 'info' && (
                <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-4">Resumen de {pet.name}</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-primary-700 mb-1">INFORMACIÓN GENERAL</p>
                      <p className="text-primary-600">
                        {pet.name} es un/a {pet.species} {pet.breed ? `de raza ${pet.breed}` : 'de raza mixta'}, 
                        de {calculateAge(pet.birth_date)} de edad.
                      </p>
                    </div>
                    
                    {pet.allergies && (
                      <div>
                        <p className="text-sm font-semibold text-primary-700 mb-1">CONDICIONES MÉDICAS</p>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-orange-800 text-sm">{pet.allergies}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <p className="text-sm text-primary-800">
                        💡 <strong>Tip:</strong> Usa el código QR para que el veterinario registre las consultas médicas directamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <QRGenerator petId={id} petName={pet.name} />
              )}

              {activeTab === 'history' && (
                <MedicalHistory petId={id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetails;
