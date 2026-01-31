// ============================================
// PAGES/VETDIRECTORY.JSX
// ============================================
// Pantalla pública que muestra el ranking de doctores.
// CORRECCIÓN: Apunta a la ruta '/veterinarians' sin '/api' para coincidir con el servidor.
// ============================================

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Stethoscope, Star } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';

const VetDirectory = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para la lista de doctores
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el buscador
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 1. Cargar Perfil y Directorio al iniciar
  useEffect(() => {
    const initData = async () => {
      try {
        // Cargar Usuario
        const userData = await getUserProfile();
        setUser(userData);

        // Cargar Directorio Público
        const token = localStorage.getItem('token');
        
        // ✅ CORRECCIÓN AQUÍ: Quitamos "/api" para que coincida con tu server
        console.log("📡 Buscando doctores en:", `${API_URL}/veterinarians/directory/all`);
        
        const res = await axios.get(`${API_URL}/veterinarians/directory/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Manejo robusto de la respuesta (por si el backend envía array u objeto)
        const vetsData = res.data.veterinarians || res.data || [];
        setVets(vetsData);

      } catch (error) {
        console.error("🔥 Error cargando directorio:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [API_URL]);

  // 2. Lógica de Filtrado (Buscador)
  const filteredVets = vets.filter(vet => {
    const term = searchTerm.toLowerCase();
    return (
      vet.name.toLowerCase().includes(term) ||
      (vet.specialty && vet.specialty.toLowerCase().includes(term)) ||
      (vet.clinic_name && vet.clinic_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar y Header (Navegación) */}
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 lg:p-8">
          
          {/* --- ENCABEZADO Y BUSCADOR --- */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Directorio Médico</h1>
            <p className="text-gray-600 mb-6">Encuentra a los mejores especialistas para tu mascota.</p>

            {/* Barra de Búsqueda */}
            <div className="relative max-w-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="Buscar por doctor, especialidad o clínica..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* --- LISTADO DE TARJETAS --- */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {filteredVets.length > 0 ? (
                filteredVets.map(vet => (
                  <div key={vet.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                    
                    {/* Header de Tarjeta */}
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar (Iniciales) */}
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                            {vet.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">{vet.name}</h3>
                            <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                              <Stethoscope size={14}/> {vet.specialty || 'Veterinario General'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="flex flex-col items-end">
                           <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                             <Star size={14} className="text-amber-500 fill-amber-500"/>
                             <span className="font-bold text-amber-900 text-sm">{Number(vet.average_rating).toFixed(1)}</span>
                           </div>
                           <span className="text-xs text-gray-400 mt-1">{vet.total_ratings} reseñas</span>
                        </div>
                      </div>

                      {/* Info de Ubicación */}
                      <div className="space-y-2 mt-4 pl-1">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Building2 size={16} className="text-gray-400 mt-0.5 flex-shrink-0"/>
                          <span className="font-medium">{vet.clinic_name || 'Atención Independiente'}</span>
                        </div>
                        {vet.clinic_name && (
                          <div className="flex items-center gap-2 text-xs text-blue-500 ml-6 cursor-pointer hover:underline">
                            <MapPin size={12}/> Ver ubicación
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="mt-6 pt-4 border-t border-gray-50">
                      <button className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                        Ver Perfil y Opiniones
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                  <h3 className="text-lg font-bold text-gray-900">No se encontraron resultados</h3>
                  <p className="text-gray-500">Intenta con otro nombre o especialidad.</p>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VetDirectory;