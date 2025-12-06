import { Link } from 'react-router-dom';
import { Trash2, ChevronRight, Calendar } from 'lucide-react';

const PetCard = ({ id, name, type, breed, birth_date, photo_url, gender, weight, onDelete }) => {
  
  const getDefaultImage = (species) => {
    const images = {
      'Perro': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      'Gato': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      'Ave': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400',
      'Conejo': 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400',
    };
    return images[species] || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400';
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) return `${months} meses`;
    return `${years} año${years > 1 ? 's' : ''}`;
  };

  return (
    <div className="group bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-hover transition-all border border-primary-100">
      
      {/* Imagen */}
      <Link to={`/pets/${id}`} className="block relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
        <img 
          src={photo_url || getDefaultImage(type)} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = getDefaultImage(type);
          }}
        />
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary-700 border border-primary-200">
          {type}
        </div>
      </Link>

      {/* Contenido */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-900 mb-1">{name}</h3>
            <p className="text-sm text-primary-600">{breed || 'Raza mixta'}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Eliminar mascota"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary-600 flex items-center gap-1">
              {gender === 'Macho' ? '♂' : '♀'} {gender}
            </span>
            <span className="text-primary-600">{weight ? `${weight}kg` : 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-primary-500">
            <Calendar className="w-4 h-4" />
            <span>{calculateAge(birth_date)}</span>
          </div>
        </div>

        <Link 
          to={`/pets/${id}`}
          className="flex items-center justify-between w-full bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 px-4 rounded-xl transition-colors group"
        >
          <span className="text-sm">Ver detalles</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default PetCard;
