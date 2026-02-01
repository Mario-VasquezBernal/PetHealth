// ============================================
// SIDEBAR.JSX  (CORREGIDO – sin eliminar tu lógica)
// Fix: Leaflet quedaba por encima → se añade z-50 al aside móvil
// ============================================
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PlusCircle,
  Calendar,
  X,
  MapPin,
  Home as HomeIcon,
  User,
  Building2,
  Stethoscope,
  Star,
  Search
} from 'lucide-react';
import { APP_CONFIG } from '../constants';

const LogoHeader = () => (
  <div className="flex items-center gap-3">
    <img
      src={APP_CONFIG.LOGO_URL}
      alt={APP_CONFIG.APP_NAME}
      className="w-10 h-10 object-contain rounded-lg"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
    <div>
      <h2 className="text-lg font-bold text-gray-900">{APP_CONFIG.APP_NAME}</h2>
      <p className="text-xs text-gray-500">{APP_CONFIG.APP_SUBTITLE}</p>
    </div>
  </div>
);

const Sidebar = ({ user, sidebarOpen, setSidebarOpen, onNewPet }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: HomeIcon, label: 'Inicio', path: '/home' },
    { icon: Search, label: 'Directorio Médico', path: '/directory' },
    { icon: Building2, label: 'Top Clínicas', path: '/clinics-directory' },
    { icon: Calendar, label: 'Citas', path: '/appointments' },
    { icon: Star, label: 'Mis Reseñas', path: '/my-reviews' },
    { icon: Building2, label: 'Gestionar Clínicas', path: '/manage-clinics' },
    { icon: Stethoscope, label: 'Gestionar Vets', path: '/manage-veterinarians' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ============================= */}
      {/* SIDEBAR DESKTOP */}
      {/* ============================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-gray-200 fixed h-screen z-40">
        <div className="p-6 border-b border-gray-100">
          <LogoHeader />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {onNewPet && (
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={onNewPet}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25"
            >
              <PlusCircle className="w-5 h-5" strokeWidth={2.5} />
              Nueva Mascota
            </button>
          </div>
        )}

        <div className="border-t-2 border-gray-200 bg-gray-50">
          <div className="p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-3">
              Configuración
            </p>
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive('/profile')
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-emerald-50'
                }`}
              >
                <User className="w-5 h-5" strokeWidth={2} />
                <span className="font-medium text-sm">Mi Perfil</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================= */}
      {/* SIDEBAR MOBILE */}
      {/* ============================= */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* 
            FIX IMPORTANTE:
            Se añade z-50 al aside para que siempre quede
            por encima del mapa de Leaflet
          */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto flex flex-col z-50">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <LogoHeader />
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12}/> Cuenca, EC
                </p>
              </div>
            </div>

            {/* MENÚ PRINCIPAL MOBILE */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* NUEVA MASCOTA - MOBILE */}
            {onNewPet && (
              <div className="p-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    onNewPet();
                    setSidebarOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25"
                >
                  <PlusCircle className="w-5 h-5" strokeWidth={2.5} />
                  Nueva Mascota
                </button>
              </div>
            )}

            {/* CONFIGURACIÓN - MOBILE */}
            <div className="border-t-2 border-gray-200 bg-gray-50 mt-auto">
              <div className="p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-3">
                  Configuración
                </p>
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      navigate('/profile');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      isActive('/profile')
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-emerald-50'
                    }`}
                  >
                    <User className="w-5 h-5" strokeWidth={2} />
                    <span className="font-medium text-sm">Mi Perfil</span>
                  </button>
                </div>
              </div>
            </div>

          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
