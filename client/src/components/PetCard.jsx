// ============================================
// PETCARD.JSX
// ============================================
// Card visual para mostrar mascota en grid/lista del home
// Imagen superior (con fallback por especie), info básica y botón "Ver detalles"
// Datos: nombre, tipo/especie, raza, género (♂/♀), peso, edad calculada desde fecha de nacimiento
// Botón eliminar (icono basura) en esquina superior derecha
// Hover effects: imagen zoom, shadow elevado, botones con bg hover
// Link a /pets/:id para ver detalles completos
// ============================================
// ============================================
// PETCARD.JSX
// ============================================

import { Link } from 'react-router-dom';
import { Trash2, ChevronRight, Calendar } from 'lucide-react';
import { getSpeciesProfile, normalizeSpecies } from '../speciesProfiles';

const PetCard = ({ id, name, type, species, breed, birth_date, photo_url, gender, weight, onDelete }) => {

  const normalizedSpecies = normalizeSpecies({ species, type });
  const speciesProfile = getSpeciesProfile(normalizedSpecies);

  const getDefaultImage = (speciesKey) => {
    const images = {
      dog: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      bird: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400',
      rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
      reptile: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400'
    };

    return images[speciesKey] || images.other || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400';
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) return `${Math.max(0, months)} meses`;
    return `${years} año${years > 1 ? 's' : ''}`;
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">

      {/* Imagen */}
      <Link to={`/pets/${id}`} className="block relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
        <img
          src={photo_url || getDefaultImage(normalizedSpecies)}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = getDefaultImage(normalizedSpecies);
          }}
        />

        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700 border border-blue-200 shadow-md">
          {speciesProfile.label}
        </div>
      </Link>

      {/* Contenido */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-600">{breed || 'Raza mixta'}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Eliminar mascota"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              {gender === 'Macho' ? '♂' : '♀'} {gender}
            </span>
            <span className="text-gray-600">{weight ? `${weight}kg` : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{calculateAge(birth_date)}</span>
          </div>
        </div>

        <Link
          to={`/pets/${id}`}
          className="flex items-center justify-between w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-4 py-3 rounded-xl transition-colors"
        >
          <span className="text-sm">Ver detalles</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default PetCard;
