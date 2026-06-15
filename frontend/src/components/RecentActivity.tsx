import { useEffect, useState, useCallback } from 'react';
import { almacenamientoApi, type DocumentoReciente } from '../api/almacenamiento';
import { getMimeIcon } from '../pages/almacenamiento/utils';

interface RecentActivityProps {
  /** Abre el expediente del requerimiento asociado al documento (HU-N6). */
  onOpenRequerimiento: (requerimientoId: number) => void;
}

const REFRESH_MS = 30000;

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} hr`;
  return `Hace ${days} d`;
}

/**
 * HU-33: Panel de "Actividad Reciente" — últimos documentos subidos al sistema.
 * Se refresca automáticamente por polling cada 30 s.
 */
export default function RecentActivity({ onOpenRequerimiento }: RecentActivityProps) {
  const [items, setItems] = useState<DocumentoReciente[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await almacenamientoApi.getRecientes(20);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Silencioso: el panel no debe romper el dashboard si falla.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargar]);

  return (
    <div className="dashboard-card full-width">
      <div className="card-header">
        <h3>Actividad Reciente</h3>
      </div>

      {loading && items.length === 0 ? (
        <p className="recent-activity-empty">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="recent-activity-empty">Aún no hay documentos cargados.</p>
      ) : (
        <ul className="recent-activity-list">
          {items.map((doc) => (
            <li
              key={doc.id}
              className="recent-activity-item"
              onClick={() => onOpenRequerimiento(doc.requerimientoId)}
              title={`Ver expediente ${doc.codigoTicket ?? ''}`}
            >
              <span className="recent-activity-icon">{getMimeIcon(doc.mimeType)}</span>
              <div className="recent-activity-body">
                <div className="recent-activity-title">{doc.nombreOriginal}</div>
                <div className="recent-activity-meta">
                  {doc.creadoPor || 'Sistema'}
                  {doc.codigoTicket ? ` · ${doc.codigoTicket}` : ''}
                </div>
              </div>
              <span className="recent-activity-time">{formatRelativeTime(doc.creadoEn)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
