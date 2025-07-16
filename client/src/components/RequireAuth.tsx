import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';

export default function RequireAuth({ children }: { children: ReactElement }) {

  const token = localStorage.getItem('token');
  const loc = useLocation();

  if (!token) {
    return <Navigate to={`/login?sessionExpired=1&returnTo=${encodeURIComponent(loc.pathname)}`} />;
  }

  return children;
}
