import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute: React.FC = () => {
  const { token, authMode } = useAuth();

  console.log(`[PrivateRoute] Token: ${token}, AuthMode: ${authMode}`);
  if (!token) {
    console.log('[PrivateRoute] No token. Redirecting to login.');
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
