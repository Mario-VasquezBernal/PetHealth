import React from 'react';
import { Link } from 'react-router-dom';

const PetCard = ({ id, name, type, age, breed, gender, weight, image, onDelete }) => { 
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group">
      
      {/* Botón de Eliminar */}
      <button 
        onClick={() => onDelete(id)}
        className="absolute top-3 right-3 bg-red-100 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
        title="Eliminar mascota"
      >
        🗑️
      </button>

      {/* Imagen de cabecera */}
      <div className="h-48 w-full bg-blue-50 overflow-hidden flex items-center justify-center relative">
        {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
            <span className="text-6xl">
                {type === 'Perro' ? '🐶' : type === 'Gato' ? '🐱' : '🐾'}
            </span>
        )}
        
        {/* Etiqueta de Género */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
            {gender === 'Macho' ? '♂️' : '♀️'} {breed || type}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {age} años
            </span>
        </div>
        
        {/* Detalles adicionales */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 mt-2">
            <span className="flex items-center gap-1">
                ⚖️ {weight} kg
            </span>
            <span>•</span>
            <span className="truncate max-w-[150px]">
                {breed || 'Sin raza'}
            </span>
        </div>

        <div className="border-t border-gray-100 pt-3">
            <Link 
            to={`/pet/${id}`} 
            className="block text-center w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                Ver Historial Médico
            </Link>
        </div>
      </div>
    </div>
  );
};

export default PetCard;