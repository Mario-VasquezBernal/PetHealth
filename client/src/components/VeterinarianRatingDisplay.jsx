import React from 'react';

const VeterinarianRatingDisplay = ({ veterinarian, ratings }) => {
  const averageRating = veterinarian?.average_rating || 0;
  const totalRatings = veterinarian?.total_ratings || 0;

  // Calcular distribución de estrellas
  const ratingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!ratings || ratings.length === 0) return distribution;
    
    ratings.forEach((rating) => {
      distribution[rating.rating]++;
    });
    return distribution;
  };

  const distribution = ratingDistribution();

  // Barra de estrellas
  const StarBar = ({ stars, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="w-12 text-sm font-semibold">{stars} ★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-yellow-400 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-sm text-gray-600 text-right">{count}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Rating Header */}
      <div className="mb-6 border-b pb-4">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold text-blue-600">
              {averageRating.toFixed(1)}
            </div>
            <p className="text-gray-600 text-sm">de 5 estrellas</p>
          </div>
          <div className="flex-1">
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-sm">
              {totalRatings} calificaci{totalRatings !== 1 ? 'ones' : 'ón'}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      {totalRatings > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Distribución de calificaciones</h3>
          <StarBar stars={5} count={distribution[5]} total={totalRatings} />
          <StarBar stars={4} count={distribution[4]} total={totalRatings} />
          <StarBar stars={3} count={distribution[3]} total={totalRatings} />
          <StarBar stars={2} count={distribution[2]} total={totalRatings} />
          <StarBar stars={1} count={distribution[1]} total={totalRatings} />
        </div>
      )}

      {/* Recent Reviews */}
      {ratings && ratings.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-4">Reseñas Recientes</h3>
          <div className="space-y-4">
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="border-l-4 border-yellow-400 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-semibold">{rating.user_name}</p>
                {rating.comment && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{rating.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No ratings */}
      {(!ratings || ratings.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aún no hay calificaciones para este veterinario</p>
        </div>
      )}
    </div>
  );
};

export default VeterinarianRatingDisplay;
