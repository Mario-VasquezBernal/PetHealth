import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Edit2, Trash2, AlertCircle } from 'lucide-react';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // ✅ IMPORTANTE: Usar la URL completa de tu API
  const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app';

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // ✅ Usar URL completa
      const response = await axios.get(`${API_URL}/ratings/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ✅ Validar que reviews sea un array
      const reviewsData = response.data.reviews;
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
    } catch (err) {
      console.error('Error cargando reviews:', err);
      setError(err.response?.data?.error || 'Error al cargar tus reseñas');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };



  const handleEditSave = async (reviewId) => {
    try {
      // ✅ URL completa
      const response = await axios.put(
        `${API_URL}/ratings/${reviewId}`,
        {
          rating: editRating,
          comment: editComment || null
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // ✅ Actualizar el estado con la respuesta
      setReviews(reviews.map((r) => 
        r.id === reviewId 
          ? { ...r, rating: response.data.rating.rating, comment: response.data.rating.comment } 
          : r
      ));
      setEditingId(null);
      
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar la reseña');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-lg border border-gray-100">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">Aún no has dejado ninguna reseña</p>
          <p className="text-gray-500">Las reseñas aparecerán aquí después de tus citas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-400 hover:shadow-xl transition-shadow"
            >
              {editingId === review.id ? (
                // Edit Mode
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Calificación
                    </label>
                    <div className="flex gap-2 text-4xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none hover:scale-110 transition-transform"
                        >
                          <span className={editRating >= star ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Comentario
                    </label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Escribe tu opinión sobre la atención recibida..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{editComment.length}/500 caracteres</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditSave(review.id)}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-medium shadow-lg transition-all"
                    >
                      💾 Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {review.veterinarian_name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                        {review.specialty}
                      </p>
                    </div>
                    <div className="flex gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                      <p className="text-gray-700 italic leading-relaxed">"{review.comment}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      <p className="font-medium">
                        📅 {new Date(review.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {review.updated_at !== review.created_at && (
                        <p className="text-gray-400 mt-1">✏️ Editado</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                                          </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;
