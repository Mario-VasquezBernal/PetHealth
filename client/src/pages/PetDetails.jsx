import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPetById, deletePetFromStorage, getMedicalRecords } from '../dataManager';
import QRGenerator from '../components/QRGenerator';
import MedicalHistory from '../components/MedicalHistory';
import WeightPrediction from '../components/WeightPrediction';
import HealthRiskCalculator from '../components/HealthRiskCalculator';

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
  FileText,
  Activity,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [medicalStats, setMedicalStats] = useState({
    totalRecords: 0,
    lastVisit: null
  });

  useEffect(() => {
    loadPet();
    loadMedicalStats();
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
          <Link to="/home" className="text-primary-600 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <Link 
          to="/home" 
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
                    type="button"
                    onClick={() => navigate(`/pets/${id}/edit`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#10B981',
                      color: '#ffffff',
                      padding: '0.625rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: 1,
                      visibility: 'visible'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10B981';
                    }}
                  >
                    <Edit style={{ width: '1rem', height: '1rem', opacity: 1 }} />
                    <span style={{ opacity: 1, visibility: 'visible' }}>Editar</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleDelete}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      padding: '0.625rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: 1,
                      visibility: 'visible'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                    }}
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem', opacity: 1 }} />
                    <span style={{ opacity: 1, visibility: 'visible' }}>Eliminar</span>
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
                  <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    ALERGIAS / NOTAS
                  </p>
                  <p className="text-sm text-orange-800 bg-orange-50 p-2 rounded-lg">{pet.allergies}</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Navegación de Tabs */}
            <div className="bg-white rounded-card shadow-card border border-primary-100 p-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('summary');
                    reloadAllData();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === 'summary' ? '#10B981' : 'transparent',
                    color: activeTab === 'summary' ? '#ffffff' : '#059669',
                    boxShadow: activeTab === 'summary' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 1,
                    visibility: 'visible'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'summary') {
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'summary') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Heart style={{ width: '1.25rem', height: '1.25rem', opacity: 1 }} />
                  <span style={{ opacity: 1, visibility: 'visible' }}>Resumen</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === 'qr' ? '#10B981' : 'transparent',
                    color: activeTab === 'qr' ? '#ffffff' : '#059669',
                    boxShadow: activeTab === 'qr' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 1,
                    visibility: 'visible'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'qr') {
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'qr') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <QrCode style={{ width: '1.25rem', height: '1.25rem', opacity: 1 }} />
                  <span style={{ opacity: 1, visibility: 'visible' }}>Código QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: activeTab === 'history' ? '#10B981' : 'transparent',
                    color: activeTab === 'history' ? '#ffffff' : '#059669',
                    boxShadow: activeTab === 'history' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 1,
                    visibility: 'visible'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'history') {
                      e.currentTarget.style.backgroundColor = '#F0FDF4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'history') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <FileText style={{ width: '1.25rem', height: '1.25rem', opacity: 1 }} />
                  <span style={{ opacity: 1, visibility: 'visible' }}>Historial</span>
                </button>
              </div>
            </div>

            {/* Contenido de Tabs */}
            <div>
              {/* TAB: RESUMEN */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  
                  {/* Botón de actualizar */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={reloadAllData}
                      disabled={refreshing}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: refreshing ? '#D1FAE5' : '#F0FDF4',
                        color: '#059669',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #A7F3D0',
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        opacity: 1,
                        visibility: 'visible'
                      }}
                      onMouseEnter={(e) => {
                        if (!refreshing) {
                          e.currentTarget.style.backgroundColor = '#DCFCE7';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!refreshing) {
                          e.currentTarget.style.backgroundColor = '#F0FDF4';
                        }
                      }}
                    >
                      <RefreshCw style={{ width: '1rem', height: '1rem', opacity: 1 }} className={refreshing ? 'animate-spin' : ''} />
                      <span style={{ opacity: 1, visibility: 'visible' }}>
                        {refreshing ? 'Actualizando...' : 'Actualizar datos'}
                      </span>
                    </button>
                  </div>

                  {/* Grid de Estadísticas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card: Última Consulta */}
                    <div className="bg-white p-5 rounded-card shadow-card border border-primary-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <p className="text-xs font-semibold text-primary-600">ÚLTIMA CONSULTA</p>
                      </div>
                      <p className="text-2xl font-bold text-primary-900">
                        {medicalStats.lastVisit ? formatDate(medicalStats.lastVisit) : 'Sin registro'}
                      </p>
                    </div>

                    {/* Card: Total Consultas */}
                    <div className="bg-white p-5 rounded-card shadow-card border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        <p className="text-xs font-semibold text-orange-600">CONSULTAS</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">{medicalStats.totalRecords}</p>
                    </div>

                    {/* Card: Peso */}
                    <div className="bg-white p-5 rounded-card shadow-card border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Weight className="w-5 h-5 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-600">PESO ACTUAL</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{pet.weight ? `${pet.weight} kg` : 'N/A'}</p>
                    </div>

                    {/* Card: Edad */}
                    <div className="bg-white p-5 rounded-card shadow-card border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Cake className="w-5 h-5 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-600">EDAD</p>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{calculateAge(pet.birth_date)}</p>
                    </div>
                  </div>

                  {/* ✅ PREDICCIÓN DE PESO */}
                  <WeightPrediction petId={id} />

                  {/* ✅ ANÁLISIS DE RIESGO */}
                  <HealthRiskCalculator pet={pet} />

                  {/* Alerta de Alergias */}
                  {pet.allergies && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-orange-900 mb-1">⚠️ Alergias / Condiciones Médicas</h4>
                          <p className="text-orange-800">{pet.allergies}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Card */}
                  <div className="bg-white rounded-card shadow-card border border-primary-100 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-900 mb-2">Dashboard de {pet.name}</h3>
                        <p className="text-primary-600 mb-4">
                          Aquí puedes ver un resumen rápido del estado de salud de {pet.name}. 
                          Para registrar una nueva consulta, genera un código QR y muéstralo al veterinario.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('qr')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            opacity: 1,
                            visibility: 'visible'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10B981';
                          }}
                        >
                          <QrCode style={{ width: '1.25rem', height: '1.25rem', opacity: 1 }} />
                          <span style={{ opacity: 1, visibility: 'visible' }}>Generar Código QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CÓDIGO QR */}
              {activeTab === 'qr' && (
                <QRGenerator petId={id} petName={pet.name} />
              )}

              {/* TAB: HISTORIAL */}
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
