import React from 'react';
import type { Notificacion } from '../api/notificaciones';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notificaciones: Notificacion[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notificaciones,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPanelProps) {
  if (!isOpen) return null;

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr`;
    return `Hace ${diffDays} d`;
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'DOCUMENT_UPLOADED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case 'STATE_CHANGED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        );
      case 'REQUIREMENT_CLOSED':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
    }
  };

  return (
    <>
      <div className="notification-panel-backdrop" onClick={onClose} />
      <aside className="notification-panel">
        <div className="notification-panel-header">
          <div className="notification-panel-title">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && <span className="unread-counter-tag">{unreadCount} no leídas</span>}
          </div>
          <button className="notification-panel-close-btn" onClick={onClose} aria-label="Cerrar panel">
            ×
          </button>
        </div>

        <div className="notification-panel-actions">
          {unreadCount > 0 && (
            <button className="btn-text-action" onClick={onMarkAllAsRead}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="notification-panel-content">
          {notificaciones.length === 0 ? (
            <div className="notification-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="notification-list">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                  onClick={() => !notif.leida && onMarkAsRead(notif.id)}
                >
                  <div className={`notification-item-icon ${notif.tipo.toLowerCase()}`}>
                    {getIcon(notif.tipo)}
                  </div>
                  <div className="notification-item-body">
                    <div className="notification-item-title">{notif.titulo}</div>
                    <div className="notification-item-message">{notif.mensaje}</div>
                    <div className="notification-item-time">{formatRelativeTime(notif.creadaEn)}</div>
                  </div>
                  {!notif.leida && (
                    <div className="notification-unread-dot" title="Marcar como leída" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
