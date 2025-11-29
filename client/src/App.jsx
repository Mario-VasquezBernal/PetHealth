import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos obligatorios
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetails from './pages/PetDetails';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      {/* Contenedor de Alertas (Aparecen arriba a la derecha) */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
             <Route path="/" element={<Home />} />
             <Route path="/pet/:id" element={<PetDetails />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/appointments" element={<Appointments />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;