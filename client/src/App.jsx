// ============================================
// APP.JSX (ROUTER PRINCIPAL)
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

// Componentes de Estructura y Seguridad
import ProtectedRoute from './components/ProtectedRoute';

// 1. Páginas de Autenticación
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

// 2. Páginas del Dashboard (Protegidas)
import Home from './pages/Home';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import MyReviewsPage from './pages/MyReviewsPage';

// 3. Gestión de Mascotas
import PetDetails from './pages/PetDetails';
import EditPet from './pages/EditPet';

// 4. Directorios y Gestión
import ManageClinics from './pages/ManageClinics';
import ManageVeterinarians from './pages/ManageVeterinarians';
import VetDirectory from './pages/VetDirectory';     // Directorio Doctores
import ClinicDirectory from './pages/ClinicDirectory'; // <--- NUEVO: Directorio Clínicas

// 5. Páginas de Acceso Externo (QR)
import PublicMedicalHistory from './pages/PublicMedicalHistory';
import VetAccessPanel from './pages/VetAccessPanel';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Routes>
        
        {/* BLOQUE 1: RUTAS EXTERNAS (QR) */}
        <Route path="/medical-history/:id" element={<PublicMedicalHistory />} />
        <Route path="/qr/:token" element={<VetAccessPanel />} />

        {/* BLOQUE 2: AUTENTICACIÓN */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* BLOQUE 3: RUTAS PROTEGIDAS (DASHBOARD) */}
        <Route element={<ProtectedRoute />}>
          
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Principal */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          {/* Directorios Públicos */}
          <Route path="/directory" element={<VetDirectory />} />
          <Route path="/clinics-directory" element={<ClinicDirectory />} /> {/* <--- NUEVA RUTA */}

          {/* Mascotas */}
          <Route path="/pets/:id" element={<PetDetails />} />
          <Route path="/pets/:id/edit" element={<EditPet />} />

          {/* Citas y Salud */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/my-reviews" element={<MyReviewsPage />} />

          {/* Gestión (Admin) */}
          <Route path="/manage-clinics" element={<ManageClinics />} />
          <Route path="/manage-veterinarians" element={<ManageVeterinarians />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;