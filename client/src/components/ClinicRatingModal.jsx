import { useState, useEffect } from 'react';
import { X, Star, Pencil } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ClinicRatingModal = ({ isOpen, onClose, clinic, onSuccess }) => {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [isEditing, setIsEditing] = useState(false); // ✅ ¿está editando?
  const [loadingReview, setLoadingReview] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // ✅ Al abrir el modal → buscar si ya tiene reseña
  useEffect(() => {
    if (!isOpen || !clinic) return;

    const fetchMyReview = async () => {
      setLoadingReview(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/clinics/${clinic.id}/my-review`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          // Tiene reseña → pre-cargar datos y marcar como edición
          setRating(res.data.rating);
          setComment(res.data.comment || '');
          setIsEditing(true);
        } else {
          // No tiene reseña → limpiar
          setRating(0);
          setComment('');
          setIsEditing(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingReview(false);
      }
    };

    fetchMyReview();
  }, [isOpen, clinic]);

  if (!isOpen || !clinic) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.warning('Selecciona las estrellas');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/clinics/${clinic.id}/rate`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isEditing ? 'Reseña actualizada ✓' : `Has calificado a ${clinic.name} ✓`);
      setRating(0);
      setComment('');
      setIsEditing(false);
      onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al guardar calificación';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* HEADER — cambia si es edición */}
        <div className={`p-4 flex justify-between items-center text-white ${isEditing ? 'bg-emerald-600' : 'bg-blue-600'}`}>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {isEditing && <Pencil size={16} />}
            {isEditing ? 'Editar Reseña' : 'Calificar Experiencia'}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loadingReview ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-1">
                {isEditing ? 'Actualiza tu opinión sobre' : '¿Qué tal fue tu visita a'}
                {' '}<span className="font-bold text-gray-900">{clinic.name}</span>?
              </p>

              {isEditing && (
                <p className="text-xs text-emerald-600 text-center mb-4 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                  ✓ Ya tienes una reseña — puedes actualizarla
                </p>
              )}

              {/* ESTRELLAS */}
              <div className="flex justify-center gap-2 mb-6 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-transform hover:scale-110 focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(rating)}
                  >
                    <Star
                      size={32}
                      className={`${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`}
                    />
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
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all
                      ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {loading ? 'Guardando...' : isEditing ? 'Actualizar Reseña' : 'Enviar Reseña'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicRatingModal;
