import { useState, useEffect } from 'react';
import FirmaCanvas from './FirmaCanvas';

interface ConfigurarFirmaModalProps {
  userId: number;
  onClose: () => void;
  onSaved: (dataUrl: string) => void;
}

/**
 * ConfigurarFirmaModal — Modal para dibujar y persistir la firma del usuario (HU-11)
 *
 * La firma se guarda en localStorage bajo la clave sgd_firma_{userId}.
 * Persiste entre sesiones. Se puede actualizar o eliminar aquí mismo.
 */
export default function ConfigurarFirmaModal({ userId, onClose, onSaved }: ConfigurarFirmaModalProps) {
  const STORAGE_KEY = `sgd_firma_${userId}`;
  const [currentFirma, setCurrentFirma] = useState<string | null>(null);
  const [newFirma, setNewFirma] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrentFirma(stored);
  }, [STORAGE_KEY]);

  const handleSave = () => {
    if (!newFirma) return;
    localStorage.setItem(STORAGE_KEY, newFirma);
    setCurrentFirma(newFirma);
    setSaved(true);
    onSaved(newFirma);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!confirm('¿Eliminar tu firma guardada? Tendrás que dibujarla de nuevo.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setCurrentFirma(null);
    setNewFirma(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '660px', width: '95vw' }}
      >
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid var(--gray-200)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Configurar Firma Digital</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
              Tu firma se guardará localmente y se usará para firmar documentos y el PDF de cierre.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Firma actual guardada */}
          {currentFirma && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>
                  ✓ Firma guardada actualmente
                </span>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={handleDelete}
                  style={{ color: 'var(--danger)', fontSize: '0.76rem' }}
                >
                  Eliminar firma
                </button>
              </div>
              <img
                src={currentFirma}
                alt="Firma actual"
                style={{ maxWidth: '280px', maxHeight: '80px', border: '1px solid var(--gray-200)', borderRadius: '4px', background: 'white', display: 'block' }}
              />
            </div>
          )}

          {/* Canvas para nueva firma */}
          <div style={{ marginBottom: '4px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              {currentFirma ? 'Dibuja una nueva firma para reemplazar la actual:' : 'Dibuja tu firma a continuación:'}
            </p>
            <FirmaCanvas
              onSave={(dataUrl) => setNewFirma(dataUrl)}
              onClear={() => setNewFirma(null)}
              width={580}
              height={180}
            />
          </div>

          {newFirma && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--accent-50)', border: '1px solid var(--accent-200)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--accent-700)' }}>
              ✓ Firma lista para guardar — haz clic en "Guardar firma" para confirmar
            </div>
          )}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!newFirma || saved}
          >
            {saved ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ¡Guardada!
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar firma
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
