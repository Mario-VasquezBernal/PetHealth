import { useState } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ClinicRatingModal = ({ isOpen, onClose, clinic, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0); 
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !clinic) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.warning('Selecciona las estrellas');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ CORRECCIÓN: Quitamos "/api"
      await axios.post(`${API_URL}/clinics/${clinic.id}/rate`, 
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Has calificado a ${clinic.name}`);
      onSuccess(); 
      onClose();   
      
      setRating(0);
      setComment('');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar calificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">Calificar Experiencia</h3>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-center mb-4">
            ¿Qué tal fue tu visita a <span className="font-bold text-gray-900">{clinic.name}</span>?
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(rating)}
              >
                <Star size={32} className={`${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`}/>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
              rows="3"
              placeholder="Escribe tu comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar Reseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClinicRatingModal;