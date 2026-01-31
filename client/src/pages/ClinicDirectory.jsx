// ============================================
// PAGES/CLINICDIRECTORY.JSX (ACTUALIZADO)
// ============================================
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Phone, Star, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import { getUserProfile } from '../dataManager';
import ClinicRatingModal from '../components/ClinicRatingModal'; // Modal para Calificar
import ClinicReviewsModal from '../components/ClinicReviewsModal'; // Modal para Ver Detalles (NUEVO)

const ClinicDirectory = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADOS PARA EL MODAL DE CALIFICAR
  const [ratingClinic, setRatingClinic] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // ESTADOS PARA EL MODAL DE VER DETALLES (NUEVO)
  const [detailsClinic, setDetailsClinic] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchClinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // Ruta corregida sin /api
      const res = await axios.get(`${API_URL}/clinics/directory/ranking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.clinics || res.data || [];
      setClinics(data);
    } catch (error) {
      console.error("Error cargando clínicas:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const initData = async () => {
      const userData = await getUserProfile();
      setUser(userData);
      fetchClinics();
    };
    initData();
  }, [fetchClinics]);

  // Manejador: Abrir calificar
  const handleRateClick = (clinic) => {
    setRatingClinic(clinic);
    setIsRatingOpen(true);
  };

  // Manejador: Abrir detalles (comentarios)
  const handleDetailsClick = (clinic) => {
    setDetailsClinic(clinic);
    setIsDetailsOpen(true);
  };

  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 lg:ml-72">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 lg:p-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clínicas Mejor Valoradas</h1>
            <p className="text-gray-600 mb-6">Ranking oficial basado en opiniones de usuarios.</p>

            <div className="relative max-w-xl shadow-sm">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Buscar clínica o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
             <div className="text-center py-20 flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500">Cargando clínicas...</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClinics.map(clinic => (
                <div key={clinic.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between">
                  
                  {/* Tarjeta Content */}
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Building2 className="text-blue-600" size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                          <Star size={16} className="text-yellow-500 fill-yellow-500"/>
                          <span className="font-bold text-yellow-800">{clinic.average_rating}</span>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{clinic.total_ratings} opiniones</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{clinic.name}</h3>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-gray-500 flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0"/> 
                        {clinic.address || 'Dirección no registrada'}
                      </p>
                      {clinic.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone size={16}/> {clinic.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex gap-3 pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleRateClick(clinic)}
                      className="flex-1 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 font-bold text-xs hover:bg-yellow-100 transition-all flex items-center justify-center gap-1"
                    >
                      <Star size={14} className="fill-yellow-600 text-yellow-600"/> Calificar
                    </button>

                    <button 
                      onClick={() => handleDetailsClick(clinic)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                    >
                      Ver Detalles <ArrowRight size={14}/>
                    </button>
                  </div>

                </div>
              ))}
              
              {filteredClinics.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-400">
                  No se encontraron clínicas disponibles.
                </div>
              )}
            </div>
          )}

          {/* 1. MODAL PARA CALIFICAR */}
          <ClinicRatingModal 
            isOpen={isRatingOpen} 
            onClose={() => setIsRatingOpen(false)} 
            clinic={ratingClinic}
            onSuccess={fetchClinics} 
          />

          {/* 2. MODAL PARA VER COMENTARIOS (NUEVO) */}
          <ClinicReviewsModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            clinic={detailsClinic}
          />

        </main>
      </div>
    </div>
  );
};

export default ClinicDirectory;