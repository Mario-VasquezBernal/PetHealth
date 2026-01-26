import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MyReviews from '../components/MyReviews';
import { getUserProfile } from '../dataManager';
import { MapPin, Star } from 'lucide-react';

const MyReviewsPage = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Declarar la función ANTES del useEffect
  const loadUser = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  };

  useEffect(() => {
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar con props necesarios */}
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewPet={null}
      />

      {/* Contenedor principal con margen para el sidebar */}
      <div className="flex-1 lg:ml-72">
        {/* Header móvil */}
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

        {/* Contenido principal */}
        <main className="px-4 lg:px-8 py-8">
          {/* Header de la página */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Mis Reseñas</h1>
                <p className="text-gray-600">Gestiona tus opiniones sobre veterinarios</p>
              </div>
            </div>
          </div>

          {/* Componente de reviews */}
          <MyReviews />
        </main>
      </div>
    </div>
  );
};

export default MyReviewsPage;
