import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* El Navbar siempre se ve */}
      <Navbar />
      
      {/* Aquí se cargará Home, Perfil, etc. según la ruta */}
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;