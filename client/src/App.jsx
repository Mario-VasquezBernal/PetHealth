import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Layouts y Componentes
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetails from './pages/PetDetails'; // <--- Importamos la nueva página
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';

function App() {
  return (
    <BrowserRouter>
      {/* Contenedor de Alertas */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <Routes>
        {/* Layout Principal que envuelve todo */}
        <Route element={<MainLayout />}>
          
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Protegidas (Solo usuarios logueados) */}
          <Route element={<ProtectedRoute />}>
             <Route path="/" element={<Home />} />
             
             {/* --- RUTA DE DETALLE DE MASCOTA --- */}
             <Route path="/pet/:id" element={<PetDetails />} />
             {/* ---------------------------------- */}

             <Route path="/profile" element={<Profile />} />
             <Route path="/appointments" element={<Appointments />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;