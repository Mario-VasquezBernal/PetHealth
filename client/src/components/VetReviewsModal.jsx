import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Star, User, Calendar, MessageCircle, TrendingUp } from 'lucide-react';

// ✅ Mismo StarBar que ClinicReviewsModal
const StarBar = ({ stars, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-3">{stars}</span>
      <Star size={11} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
    </div>
  );
};

const VetReviewsModal = ({ isOpen, onClose, vet }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isOpen && vet) fetchReviews();
  }, [isOpen, vet]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/ratings/veterinarian/${vet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data.ratings || []);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vet) return null;

  // ── Cálculos ──
  const total = reviews.length;
  const average = total > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / total).toFixed(1)
    : '0.0';
  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: reviews.filter(r => Number(r.rating) === s).length
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">

        {/* ── HEADER ── */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-gray-900">Historial de Reseñas</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              <span className="font-semibold text-blue-600">{vet.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* ── RESUMEN ESTADÍSTICO ── */}
        {!loading && total > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-6">

              {/* Promedio grande */}
              <div className="text-center flex-shrink-0">
                <p className="text-5xl font-black text-gray-900 leading-none">{average}</p>
                <div className="flex justify-center gap-0.5 mt-1.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={13}
                      className={s <= Math.round(average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">{total} {total === 1 ? 'reseña' : 'reseñas'}</p>
              </div>

              {/* Barras por estrella */}
              <div className="flex-1 space-y-1.5">
                {starCounts.map(({ stars, count }) => (
                  <StarBar key={stars} stars={stars} count={count} total={total} />
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ── LISTA DE RESEÑAS ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>

          ) : reviews.length > 0 ? reviews.map((review, index) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">

                {/* Avatar + info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-black text-sm">
                      {(review.user_name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-none">
                      {review.user_name || 'Usuario Anónimo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(review.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Badge estrellas */}
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-xl flex-shrink-0">
                  <Star size={13} className="fill-yellow-500 text-yellow-500" />
                  <span className="font-black text-yellow-700 text-sm">{review.rating}</span>
                </div>
              </div>

              {/* Comentario */}
              {review.comment && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5 border-l-2 border-blue-200">
                  "{review.comment}"
                </p>
              )}

              {index < reviews.length - 1 && (
                <div className="mt-3 border-t border-dashed border-gray-100" />
              )}
            </div>

          )) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-700">Aún no hay reseñas</h3>
              <p className="text-sm text-gray-400 mt-1">Sé el primero en calificar a este veterinario.</p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <TrendingUp size={13} /> {total} {total === 1 ? 'opinión registrada' : 'opiniones registradas'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default VetReviewsModal;
