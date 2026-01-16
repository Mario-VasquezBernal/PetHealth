// ============================================
// PROTECTEDROUTE.JSX
// ============================================
// HOC (Higher Order Component) que protege rutas privadas verificando token JWT en localStorage
// Si NO existe token → redirige a /login con replace (no deja volver atrás)
// Si SÍ existe token → renderiza <Outlet /> (rutas hijas protegidas)
// Usado en App.jsx para envolver rutas como /home, /pets/:id, /profile, /appointments, etc.
// ============================================

import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 1. Buscamos el token en la memoria del navegador
  const token = localStorage.getItem('token');

  // 2. Si NO hay token, lo mandamos al Login
  // 'replace' evita que pueda volver atrás con el botón del navegador
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si SÍ hay token, le dejamos pasar
  return <Outlet />;
};

export default ProtectedRoute;