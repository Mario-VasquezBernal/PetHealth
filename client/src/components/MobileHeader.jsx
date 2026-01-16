// ============================================
// MOBILEHEADER.JSX
// ============================================
// Header sticky para móviles (<lg breakpoint) con 3 elementos:
// - Botón menú hamburguesa (abre sidebar)
// - Indicador de ubicación (Cuenca, Ecuador)
// - Botón "+" para agregar nueva mascota
// Sticky top-0 con z-index 40, fondo blanco, border inferior
// ============================================

import { Menu, PlusCircle, MapPin } from 'lucide-react';

const MobileHeader = ({ onMenuClick, onNewPet }) => {
  return (
    <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="px-4 py-4 flex items-center justify-between">
        <button 
          onClick={onMenuClick}
          className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center"
        >
          <Menu className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" strokeWidth={2} />
          <span className="text-sm font-medium text-gray-900">Cuenca, Ecuador</span>
        </div>
        {onNewPet && (
          <button 
            onClick={onNewPet}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center"
          >
            <PlusCircle className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
