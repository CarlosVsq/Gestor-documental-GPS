import React from 'react';

interface IdleWarningModalProps {
  remainingTime: number; // en segundos
  message: string;
  onContinue: () => void;
  onLogout: () => void;
}

export default function IdleWarningModal({
  remainingTime,
  message,
  onContinue,
  onLogout,
}: IdleWarningModalProps) {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content idle-warning-modal" onClick={e => e.stopPropagation()}>
        <div className="idle-warning-header">
          <div className="idle-warning-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>Advertencia de Inactividad</h3>
        </div>
        <div className="idle-warning-body">
          <p>{message}</p>
          <div className="idle-countdown-display">
            La sesión expirará automáticamente en: <span className="countdown-timer">{formatTime(remainingTime)}</span>
          </div>
        </div>
        <div className="idle-warning-footer">
          <button className="btn btn-secondary" onClick={onLogout}>
            Cerrar Sesión
          </button>
          <button className="btn btn-primary" onClick={onContinue}>
            Continuar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
