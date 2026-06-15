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

  // Ref para leer el estado del aviso dentro de los listeners SIN volverlo
  // dependencia del efecto. Antes `showWarning` era dependencia del efecto de
  // listeners: al aparecer el aviso, el cleanup limpiaba el contador y el timer
  // de logout (congelando el contador y evitando el cierre de sesión).
  const showWarningRef = useRef(false);
  // Ref siempre apuntando al último `resetTimers`, para invocarlo desde el
  // efecto de listeners sin que su identidad re-monte dicho efecto.
  const resetTimersRef = useRef<() => void>(() => {});

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Cargar configuración de sesión desde backend
  useEffect(() => {
    if (!isAuthenticated) return;

    configApi.getSessionConfig()
      .then(setConfig)
      .catch(err => console.error('Error al cargar configuración de sesión:', err));
  }, [isAuthenticated]);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    if (!config || !isAuthenticated) return;

    const { timeout_warning_ms, timeout_logout_ms } = config;

    // Timer para mostrar la advertencia
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      const remainingSecs = Math.max(0, Math.round((timeout_logout_ms - timeout_warning_ms) / 1000));
      setRemainingTime(remainingSecs);

      // Cuenta regresiva en segundos. Este intervalo ahora sobrevive a la
      // aparición del aviso (ver nota sobre showWarningRef).
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeout_warning_ms);

    // Timer para el logout automático al agotarse la cuenta regresiva
    logoutTimerRef.current = setTimeout(() => {
      clearTimers();
      logout();
      window.location.href = '/login?reason=inactivity';
    }, timeout_logout_ms);
  }, [config, isAuthenticated, logout, clearTimers]);

  // Mantener la ref de resetTimers actualizada en cada cambio de identidad.
  useEffect(() => {
    resetTimersRef.current = resetTimers;
  }, [resetTimers]);

  // Efecto de listeners de actividad. Depende solo de [isAuthenticated, config]
  // (vía clearTimers estable), NO de showWarning, para no desmontarse cuando
  // aparece el aviso.
  useEffect(() => {
    if (!isAuthenticated || !config) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'visibilitychange'];

    const handleActivity = () => {
      // Mientras se muestra el aviso, la actividad NO reinicia el contador:
      // el usuario debe pulsar "Continuar Sesión" explícitamente.
      if (showWarningRef.current) return;
      resetTimersRef.current();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Inicializar timers al montar o al cargar la configuración.
    resetTimersRef.current();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [isAuthenticated, config, clearTimers]);

  return {
    showWarning,
    remainingTime,
    warningMessage: config?.warning_message || 'Tu sesión está a punto de expirar por inactividad.',
    resetTimers,
  };
}
