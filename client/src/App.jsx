import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Layouts y Componentes
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetails from './pages/PetDetails';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import VetAccess from './pages/VetAccess';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <Routes>
        <Route element={<MainLayout />}>
          
          {/* 🆕 Ruta raíz - Redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Ruta pública para veterinarios */}
          <Route path="/vet-access/:token" element={<VetAccess />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
             <Route path="/home" element={<Home />} />
             <Route path="/pets/:id" element={<PetDetails />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/appointments" element={<Appointments />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
