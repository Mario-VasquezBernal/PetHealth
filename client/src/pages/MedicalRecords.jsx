// ============================================
// MEDICALRECORDS.JSX
// ============================================
// Página de historial médico de mascotas
// Muestra un selector (dropdown) de todas las mascotas del usuario
// Al seleccionar una mascota, muestra su historial médico completo
// Utiliza el componente MedicalHistory para renderizar los registros
// Si no hay mascotas, muestra mensaje de estado vacío
// Preselecciona la primera mascota automáticamente
// ============================================

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getPets, getUserProfile } from '../dataManager';
import MedicalHistory from '../components/MedicalHistory';
import { 
  FileText, 
  Dog, 
  Cat, 
  Stethoscope,
  ChevronDown,
  MapPin
} from 'lucide-react';

const MedicalRecords = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [petsData, userData] = await Promise.all([
        getPets(),
        getUserProfile()
      ]);
      
      if (Array.isArray(petsData) && petsData.length > 0) {
        setPets(petsData);
        setSelectedPet(petsData[0]);
      } else {
        setPets([]);
      }
      setUser(userData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesIcon = (species) => {
    const speciesLower = species?.toLowerCase() || '';
    if (speciesLower.includes('perro')) return Dog;
    if (speciesLower.includes('gato')) return Cat;
    return Stethoscope;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <Sidebar 
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      <div className="flex-1 lg:ml-72">
        
        <MobileHeader 
          onMenuClick={() => setSidebarOpen(true)}
          onNewPet={null}
        />

        {/* Header Desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-900" strokeWidth={2} />
              <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Historial Médico</h1>
                <p className="text-gray-600">Consultas y registros veterinarios</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : pets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay mascotas registradas</h3>
              <p className="text-gray-600 mb-6">Agrega una mascota para ver su historial médico</p>
            </div>
          ) : (
            <>
              {/* Selector de Mascota */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecciona una mascota
                </label>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-400 transition-all shadow-md hover:shadow-lg"
                  >
                    {selectedPet && (
                      <div className="flex items-center gap-3">
                        {selectedPet.photo_url ? (
                          <img 
                            src={selectedPet.photo_url} 
                            alt={selectedPet.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            {(() => {
                              const Icon = getSpeciesIcon(selectedPet.species || selectedPet.type);
                              return <Icon className="w-6 h-6 text-blue-600" strokeWidth={2} />;
                            })()}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-bold text-gray-900">{selectedPet.name}</p>
                          <p className="text-sm text-gray-600">
                            {selectedPet.species || selectedPet.type} • {selectedPet.breed || 'Sin raza'}
                          </p>
                        </div>
                      </div>
                    )}
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                      strokeWidth={2}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 max-h-80 overflow-y-auto">
                      {pets.map((pet) => {
                        const Icon = getSpeciesIcon(pet.species || pet.type);
                        return (
                          <button
                            key={pet.id}
                            onClick={() => {
                              setSelectedPet(pet);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                              selectedPet?.id === pet.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            {pet.photo_url ? (
                              <img 
                                src={pet.photo_url} 
                                alt={pet.name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Icon className="w-6 h-6 text-blue-600" strokeWidth={2} />
                              </div>
                            )}
                            <div className="text-left flex-1">
                              <p className="font-bold text-gray-900">{pet.name}</p>
                              <p className="text-sm text-gray-600">
                                {pet.species || pet.type} • {pet.breed || 'Sin raza'}
                              </p>
                            </div>
                            {selectedPet?.id === pet.id && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Componente de Historial Médico */}
              {selectedPet && (
                <MedicalHistory petId={selectedPet.id} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MedicalRecords;
