import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { configApi, type SessionConfig } from '../api/config';

export function useIdleTimer() {
  const { isAuthenticated, logout } = useAuth();
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0); // en segundos

  const warningTimerRef = useRef<any>(null);
  const logoutTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Cargar configuración de sesión desde backend
  useEffect(() => {
    if (!isAuthenticated) return;

    configApi.getSessionConfig()
      .then(setConfig)
      .catch(err => console.error('Error al cargar configuración de sesión:', err));
  }, [isAuthenticated]);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);

    if (!config || !isAuthenticated) return;

    const { timeout_warning_ms, timeout_logout_ms } = config;
    const warningTime = timeout_warning_ms;
    const logoutTime = timeout_logout_ms;

    // Timer para mostrar la advertencia
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      const remainingSecs = Math.max(0, Math.floor((logoutTime - warningTime) / 1000));
      setRemainingTime(remainingSecs);

      // Iniciar cuenta regresiva en segundos
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningTime);

    // Timer para realizar el logout automático
    logoutTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = '/login?reason=inactivity';
    }, logoutTime);
  }, [config, isAuthenticated, logout]);

  // Escuchar eventos para resetear inactividad si no está en modo Warning
  useEffect(() => {
    if (!isAuthenticated || !config || showWarning) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'visibilitychange'];
    
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Inicializar timers al montar o cambiar configs
    resetTimers();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, config, showWarning, resetTimers]);

  return {
    showWarning,
    remainingTime,
    warningMessage: config?.warning_message || 'Tu sesión está a punto de expirar por inactividad.',
    resetTimers,
  };
}
