import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Star, User, MessageCircle } from 'lucide-react';

const VetReviewsModal = ({ isOpen, onClose, vet }) => {
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isOpen && vet) fetchReviews();
  }, [isOpen, vet]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // ✅ Endpoint correcto para reseñas de veterinario
      const res = await axios.get(`${API_URL}/ratings/veterinarian/${vet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data.ratings || []);
      setStats(res.data.statistics || null);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vet) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Opiniones de Clientes</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Veterinario: <span className="text-blue-600 font-medium">{vet.name}</span>
            </p>
            {stats && Number(stats.total) > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {Number(stats.average).toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">({stats.total} reseñas)</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-sm text-gray-800">
                      {review.user_name || 'Usuario Anónimo'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Estrellas */}
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s}
                      className={`w-4 h-4 ${s <= review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'}`}
                    />
                  ))}
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aún no hay reseñas</p>
              <p className="text-sm">Sé el primero en calificar a este veterinario.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VetReviewsModal;
