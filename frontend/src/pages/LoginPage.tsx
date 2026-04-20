import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage — HU-25
 * Diseño inspirado en la referencia: card centrada con panel diagonal
 * izquierdo y formulario a la derecha. Colores navy + verde.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Subtle background shapes */}
      <div className="login-bg">
        <div className="login-bg-glow login-bg-glow-1" />
        <div className="login-bg-glow login-bg-glow-2" />
      </div>

      <div className="login-card">
        {/* Left Panel - Diagonal branding */}
        <div className="login-card-left">
          <div className="login-diagonal-shape login-shape-1" />
          <div className="login-diagonal-shape login-shape-2" />
          <div className="login-diagonal-shape login-shape-3" />

          <div className="login-card-left-content">
            <h1 className="login-welcome-title">
              BIENVENIDO<br />DE VUELTA!
            </h1>
            <p className="login-welcome-desc">
              Sistema de Gestión Documental para centralizar y controlar la documentación técnica.
            </p>
            <div className="login-welcome-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>GPS — UBB 2026</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-card-right">
          <div className="login-card-right-inner">
            <h2 className="login-form-title">Iniciar Sesión</h2>

            <form className="login-card-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="login-error" id="login-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="login-input-group">
                <input
                  id="login-email"
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  required
                />
                <label htmlFor="login-email">Correo electrónico</label>
                <div className="login-input-icon-right">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="login-input-line" />
              </div>

              {/* Password field */}
              <div className="login-input-group">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <label htmlFor="login-password">Contraseña</label>
                <div
                  className="login-input-icon-right login-input-icon-clickable"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </div>
                <div className="login-input-line" />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="login-submit-btn"
                id="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="login-btn-spinner" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>

            <p className="login-hint-text">
              Credenciales: <strong>admin@sgd.cl</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
