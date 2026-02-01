// ============================================
// SIDEBAR.JSX
// – Animación de entrada (wrapper + overlay + aside)
// – Feedback táctil en botones
// – Botón cerrar con área táctil correcta
// – Separador visual antes de “Gestión”
// – aria-current en ítems activos
// – Animación en “Nueva Mascota” (mobile)
// – Sin tocar tu lógica de navegación
// ============================================

import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PlusCircle,
  Calendar,
  X,
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

const Sidebar = ({ sidebarOpen, setSidebarOpen, onNewPet }) => {
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
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  active:scale-[0.98] active:bg-blue-100
                  ${
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
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25
                         active:scale-[0.98]"
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
                aria-current={isActive('/profile') ? 'page' : undefined}
                onClick={() => navigate('/profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
                  active:scale-[0.98]
                  ${
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
      {/* SIDEBAR MOBILE (con animación) */}
      {/* ============================= */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Overlay con fade */}
        <div
          onClick={() => setSidebarOpen(false)}
          className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Panel con slide */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto flex flex-col z-50
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <LogoHeader />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 -m-2 rounded-lg active:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* MENÚ PRINCIPAL MOBILE */}
          <nav className="p-4 space-y-1">
            {menuItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    active:scale-[0.98] active:bg-blue-100
                    ${
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

          {/* Separador visual */}
          <hr className="mx-4 my-2 border-gray-200" />

          {/* SECCIÓN GESTIÓN - MOBILE */}
          <div className="px-8 pt-1 pb-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Gestión
            </p>
          </div>

          <nav className="px-4 pb-4 space-y-1">
            {menuItems.slice(5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    active:scale-[0.98] active:bg-blue-100
                    ${
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

          {/* NUEVA MASCOTA - MOBILE (animada) */}
          {onNewPet && (
            <div
              className={`p-4 border-t border-gray-100
                transform transition-all duration-300 ease-out
                ${sidebarOpen
                  ? 'opacity-100 scale-100 translate-y-0 delay-150'
                  : 'opacity-0 scale-95 translate-y-2'
                }
              `}
            >
              <button 
                onClick={() => {
                  onNewPet();
                  setSidebarOpen(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25
                           active:scale-[0.98]"
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
                  aria-current={isActive('/profile') ? 'page' : undefined}
                  onClick={() => {
                    navigate('/profile');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
                    active:scale-[0.98]
                    ${
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
    </>
  );
};

export default Sidebar;
