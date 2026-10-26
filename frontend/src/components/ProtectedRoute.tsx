import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

interface Props {
  children: React.ReactNode;
  role: Role;
}

export function ProtectedRoute({ children, role }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    // Wrong role — redirect to their correct panel
    const target = user.role === 'student' ? '/student' : '/teacher';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
