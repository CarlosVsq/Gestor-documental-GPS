import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyPermission } from '../common/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

/**
 * ProtectedRoute — HU-25 / HU-10
 * Wrapper que redirige a /login si no hay sesión activa.
 * Muestra un spinner mientras verifica el token.
 * Valida permisos granulares si se especifican, mostrando una vista de error 403 estilizada.
 */
export default function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = hasAnyPermission(user?.permissions, requiredPermissions);
    if (!hasAccess) {
      return (
        <div className="error-403-container">
          <div className="error-403-card">
            <div className="error-403-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1>Acceso Restringido (403)</h1>
            <p>No tienes los permisos necesarios para ver esta sección.</p>
            <div className="error-403-actions">
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
