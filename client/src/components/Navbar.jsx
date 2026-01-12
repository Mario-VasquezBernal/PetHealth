import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Calendar, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Inicio', icon: Heart },
    { path: '/appointments', label: 'Citas', icon: Calendar },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="bg-white border-b border-primary-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
{/* Logo */}
<Link to="/" className="flex items-center gap-3 group">
  <div className="relative">
    {/* Glow effect */}
    <div 
      className="absolute inset-0 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"
      style={{
        background: 'linear-gradient(135deg, #10b981, #059669)'
      }}
    ></div>
    
    {/* Logo container */}
    <div 
      className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
      }}
    >
      {/* Icono compuesto  logo */}
      <div className="relative">
        <Heart className="w-6 h-6 text-white" fill="white" strokeWidth={2} />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
  
  <div className="flex flex-col leading-none">
    <span 
      className="text-2xl font-extrabold tracking-tight"
      style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      PetHealth
    </span>
    <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
      Care Center
    </span>
  </div>
</Link>




          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all ml-2"
            >
              <LogOut className="w-5 h-5" />
              Salir
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-primary-50 text-primary-700"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-primary-100">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
