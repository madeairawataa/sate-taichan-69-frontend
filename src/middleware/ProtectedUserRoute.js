// middleware/ProtectedUserRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Tidak login atau role admin => redirect ke home
  if (!token || role === 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedUserRoute;
