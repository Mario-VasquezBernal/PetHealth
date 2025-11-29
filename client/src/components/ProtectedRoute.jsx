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