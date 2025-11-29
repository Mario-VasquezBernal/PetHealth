import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          🐾 PetHealth
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link to="/appointments" className="text-gray-600 hover:text-blue-600 font-medium">
                📅 Citas
              </Link>

              <Link to="/profile" className="text-gray-600 hover:text-blue-600 font-medium">
                👤 Perfil
              </Link>
              
              <button 
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
              >
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-500/30">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;