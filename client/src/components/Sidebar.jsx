// ============================================
// SIDEBAR.JSX
// ============================================
// Barra lateral de navegación con versión desktop (fixed, siempre visible) y móvil (overlay)
// Secciones: Logo/header, info de usuario (nombre + ubicación), menú principal (Inicio/Citas/Historial),
// botón "Nueva Mascota", configuración (Mi Perfil + Cerrar Sesión)
// Desktop: sidebar fijo 288px (w-72), móvil: overlay con backdrop oscuro, cierra al navegar
// Resalta ruta activa con bg azul, logout remueve token y redirige a /login
// Props: user (datos usuario), sidebarOpen/setSidebarOpen (control móvil), onNewPet (callback agregar mascota)
// ============================================

import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  PlusCircle,
  Calendar,
  X,
  Heart,
  MapPin,
  Home as HomeIcon,
  User,
  LogOut,
  Building2,
  Stethoscope
} from 'lucide-react';

const Sidebar = ({ 
  user, 
  sidebarOpen, 
  setSidebarOpen, 
  onNewPet 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.info('Sesión cerrada');
  };

  // ✅ SIN HISTORIAL
  const menuItems = [
    { icon: HomeIcon, label: 'Inicio', path: '/home' },
    { icon: Calendar, label: 'Citas', path: '/appointments' },
    { icon: Building2, label: 'Clínicas', path: '/manage-clinics' },
    { icon: Stethoscope, label: 'Veterinarios', path: '/manage-veterinarians' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-gray-200 fixed h-screen z-40">
        
        {/* Logo / Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="currentColor" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PetHealth</h2>
              <p className="text-xs text-gray-500">Control Veterinario</p>
            </div>
          </div>
        </div>

        {/* Usuario Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.full_name || user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Cuenca, Ecuador
              </p>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
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
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Botón Nueva Mascota */}
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

        {/* Sección de Configuración */}
        <div className="border-t-2 border-gray-200 bg-gray-50">
          <div className="p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-3">
              Configuración
            </p>
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive('/profile')
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <User className="w-5 h-5" strokeWidth={2} />
                <span className="font-medium text-sm">Mi Perfil</span>
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* SIDEBAR MÓVIL */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
            
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" fill="currentColor" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">PetHealth</h2>
                    <p className="text-xs text-gray-500">Control Veterinario</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.full_name || user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Cuenca, Ecuador
                  </p>
                </div>
              </div>
            </div>

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
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

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

            <div className="border-t-2 border-gray-200 bg-gray-50">
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive('/profile')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-700 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <User className="w-5 h-5" strokeWidth={2} />
                    <span className="font-medium text-sm">Mi Perfil</span>
                  </button>

                  <button 
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm">Cerrar Sesión</span>
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
