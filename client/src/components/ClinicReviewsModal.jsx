// ============================================
// COMPONENTS/CLINICREVIEWSMODAL.JSX
// ============================================
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Star, User, Calendar, MessageCircle } from 'lucide-react';

const ClinicReviewsModal = ({ isOpen, onClose, clinic }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // URL Base (Asegúrate de que coincida con tu configuración actual)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isOpen && clinic) {
      fetchReviews();
    }
  }, [isOpen, clinic]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Petición al backend para traer reseñas de esta clínica
      const res = await axios.get(`${API_URL}/clinics/${clinic.id}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data || []);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !clinic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Opiniones de Clientes</h2>
            <p className="text-sm text-gray-500">Clínica: <span className="font-semibold text-blue-600">{clinic.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* BODY (LISTA DE RESEÑAS) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  
                  {/* Info Usuario y Fecha */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{review.user_name || 'Usuario Anónimo'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12}/> {new Date(review.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Estrellas */}
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={14} className="fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-yellow-700 text-sm">{review.rating}</span>
                    </div>
                  </div>

                  {/* Comentario */}
                  <div className="pl-[52px]">
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl rounded-tl-none">
                      <MessageCircle size={14} className="inline mr-2 text-gray-400 mb-0.5"/>
                      {review.comment || "Sin comentario escrito."}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <MessageCircle size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-600">Aún no hay reseñas</h3>
              <p className="text-sm text-gray-400">Sé el primero en calificar esta clínica.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 bg-white text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClinicReviewsModal;