// ============================================
// APP.JSX
// ============================================
// Componente raíz de la aplicación
// Configura React Router con todas las rutas de la aplicación
// Incluye ToastContainer global para notificaciones
//
// ESTRUCTURA DE RUTAS:
//
// 1. RUTAS PÚBLICAS (sin autenticación):
//    - / → Redirige a /login
//    - /login → Página de inicio de sesión
//    - /register → Página de registro de usuarios
//    - /reset-password?token=xxx → Restablecer contraseña olvidada
//    - /qr/:token → Acceso veterinario simplificado (VetQRAccess)
//    - /vet-access/:token → Acceso veterinario completo (VetAccess)
//
// 2. RUTAS PROTEGIDAS (requieren autenticación - token en localStorage):
//    - /home → Dashboard principal con lista de mascotas
//    - /pets/:id → Detalles completos de una mascota (tabs: resumen, QR, historial)
//    - /pets/:id/edit → Editar información de mascota
//    - /profile → Perfil de usuario
//    - /appointments → Gestión de citas veterinarias
//    - /medical-records → Historial médico de mascotas
//
// MainLayout: Envuelve páginas públicas y protegidas (puede incluir header/footer comunes)
// ProtectedRoute: HOC que verifica autenticación antes de renderizar rutas protegidas
// ToastContainer: Sistema de notificaciones global (errores, éxitos, advertencias)
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import VetQRAccess from './pages/VetQRAccess';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ManageClinics from './pages/ManageClinics';
import ManageVeterinarians from './pages/ManageVeterinarians';
import 'leaflet/dist/leaflet.css';

// Páginas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetails from './pages/PetDetails';
import EditPet from './pages/EditPet';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';

import MedicalRecords from './pages/MedicalRecords';
import ResetPassword from './pages/ResetPassword';
import MyReviewsPage from './pages/MyReviewsPage';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      
      <Routes>
        <Route path="/manage-clinics" element={<ManageClinics />} />
        <Route path="/manage-veterinarians" element={<ManageVeterinarians />} /> 
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/qr/:token" element={<VetQRAccess />} />
        <Route element={<MainLayout />}>
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          

          <Route element={<ProtectedRoute />}>
             <Route path="/home" element={<Home />} />
             <Route path="/pets/:id" element={<PetDetails />} />
             <Route path="/pets/:id/edit" element={<EditPet />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/appointments" element={<Appointments />} />
             <Route path="/medical-records" element={<MedicalRecords />} />
                      <Route path="/my-reviews" element={<MyReviewsPage />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
