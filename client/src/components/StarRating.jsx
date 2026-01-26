const StarRating = ({ value = 0 }) => {
  const rating = Math.round(Number(value) * 2) / 2;

  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {rating >= star ? '★' : '☆'}
        </span>
      ))}
      <span className="text-gray-600 text-sm ml-1">
        ({Number(value).toFixed(1)})
      </span>
    </div>
  );
};

export default StarRating;
