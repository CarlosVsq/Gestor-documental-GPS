import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { almacenamientoApi, type Documento } from '../../../api/almacenamiento';
import { triggerBlobDownload } from '../utils';

// Worker local vía Vite con sufijo para invalidar caché del navegador
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl + '?v=2';

interface FirmarDocumentoModalProps {
  documento: Documento;
  firmaGuardada: string | null;
  onSuccess: () => void;
  onClose: () => void;
  onNeedFirma: () => void;
}

interface SigBox {
  xPct: number;   // 0-1 desde la izquierda
  yPct: number;   // 0-1 desde abajo (coordenada PDF, no pantalla)
  wPct: number;   // 0-1 ancho
  hPct: number;   // 0-1 alto
}

const DEFAULT_SIG: SigBox = { xPct: 0.55, yPct: 0.04, wPct: 0.38, hPct: 0.10 };

/**
 * FirmarDocumentoModal v2
 *
 * Renderiza el PDF real en un canvas usando pdf.js.
 * El usuario puede:
 *  - Seleccionar la página (si hay más de una)
 *  - Arrastrar la caja de firma para posicionarla
 *  - Redimensionar la caja desde la esquina inferior derecha
 */
export default function FirmarDocumentoModal({
  documento,
  firmaGuardada,
  onSuccess,
  onClose,
  onNeedFirma,
}: FirmarDocumentoModalProps) {
  // ─── Estado del PDF ────────────────────────────────────────────────────────
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // ─── Canvas y renderizado ──────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 460, h: 650 });

  // ─── Caja de firma (arrastrable) ──────────────────────────────────────────
  const [sigBox, setSigBox] = useState<SigBox>(DEFAULT_SIG);
  const dragState = useRef<{
    type: 'move' | 'resize';
    startX: number; startY: number;
    startBox: SigBox;
  } | null>(null);

  // ─── Carga ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ─── Cargar PDF al abrir ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingPdf(true);
      setPdfError(null);
      try {
        const { blob } = await almacenamientoApi.downloadBlob(documento.id);
        if (cancelled) return;
        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (e: any) {
        console.error('Error al cargar PDF:', e);
        if (!cancelled) setPdfError(`Error: ${e.message || 'No se pudo cargar la vista previa'}`);
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documento.id]);

  // ─── Renderizar página actual ──────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      if (cancelled) return;

      // Calculamos la escala basándonos en el contenedor padre estático (que no cambia de tamaño con el canvas)
      // Tiene 12px de padding por lado, total 24px de margen de seguridad
      const availableW = scrollContainerRef.current ? scrollContainerRef.current.clientWidth - 24 : 460;
      const viewport0 = page.getViewport({ scale: 1 });
      
      // Ajustamos el canvas para que ocupe todo el ancho disponible, con límite de zoom de 1.5x
      const scale = Math.min(availableW / viewport0.width, 1.5);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setCanvasSize({ w: viewport.width, h: viewport.height });

      await page.render({ canvasContext: ctx, viewport }).promise;
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, currentPage]);

  // ─── Dragging logic ────────────────────────────────────────────────────────
  // Convierte píxeles de canvas → coordenadas relativas PDF
  const pxToRel = useCallback((px: number, py: number) => ({
    xPct: Math.max(0, Math.min(1, px / canvasSize.w)),
    // PDF y=0 está abajo; canvas y=0 está arriba
    yFromBottom: Math.max(0, Math.min(1, (canvasSize.h - py) / canvasSize.h)),
  }), [canvasSize]);

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    dragState.current = {
      type,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startBox: { ...sigBox },
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = (mx - dragState.current.startX) / canvasSize.w;
      const dy = (my - dragState.current.startY) / canvasSize.h;
      const sb = dragState.current.startBox;

      if (dragState.current.type === 'move') {
        setSigBox({
          ...sb,
          xPct: Math.max(0, Math.min(1 - sb.wPct, sb.xPct + dx)),
          yPct: Math.max(0, Math.min(1 - sb.hPct, sb.yPct - dy)), // inversión Y
        });
      } else {
        // Resize: ajustar ancho y alto
        setSigBox({
          ...sb,
          wPct: Math.max(0.05, Math.min(1 - sb.xPct, sb.wPct + dx)),
          hPct: Math.max(0.03, Math.min(1 - sb.yPct, sb.hPct + dy)),
        });
      }
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [canvasSize]);

  // ─── Posición del overlay en píxeles ──────────────────────────────────────
  // PDF y=0 abajo → en pantalla: top = canvasH - (yPct + hPct) * canvasH
  const overlayLeft  = sigBox.xPct * canvasSize.w;
  const overlayTop   = canvasSize.h - (sigBox.yPct + sigBox.hPct) * canvasSize.h;
  const overlayW     = sigBox.wPct * canvasSize.w;
  const overlayH     = sigBox.hPct * canvasSize.h;

  // ─── Firmar ────────────────────────────────────────────────────────────────
  const handleFirmar = async () => {
    if (!firmaGuardada) { onNeedFirma(); return; }
    setLoading(true);
    try {
      const { blob, filename } = await almacenamientoApi.firmarDocumento(documento.id, firmaGuardada, {
        pagina: currentPage - 1,  // 0-indexed para el backend
        xPct: sigBox.xPct,
        yPct: sigBox.yPct,
        anchoPct: sigBox.wPct,
        altoPct: sigBox.hPct,
      });
      triggerBlobDownload(blob, filename);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al firmar el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px', width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Firmar Documento</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {documento.nombreOriginal}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px', marginLeft: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* ─── Panel izquierdo: controles ─────────────────────────────── */}
          <div style={{ width: '260px', flexShrink: 0, padding: '16px 20px', borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>

            {/* Firma guardada */}
            {firmaGuardada ? (
              <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>✓ Tu firma</p>
                <img src={firmaGuardada} alt="Firma" style={{ width: '100%', maxHeight: '50px', objectFit: 'contain', background: 'white', border: '1px solid var(--gray-200)', borderRadius: '3px' }} />
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9a3412' }}>Sin firma configurada.</p>
                <button className="btn btn-ghost btn-xs" onClick={onNeedFirma} style={{ marginTop: '8px', color: '#c2410c', textDecoration: 'underline', fontSize: '0.8rem' }}>
                  Configurar ahora
                </button>
              </div>
            )}

            {/* Selector de página */}
            {totalPages > 1 && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>Página a firmar</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    ‹
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 1 && v <= totalPages) setCurrentPage(v);
                    }}
                    className="form-input"
                    style={{ width: '54px', height: '32px', textAlign: 'center', fontSize: '0.9rem', padding: '0 6px' }}
                  />
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    ›
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--gray-400)' }}>de {totalPages} páginas</p>
              </div>
            )}
            {totalPages === 1 && !loadingPdf && !pdfError && (
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
                1 página (sin selección necesaria)
              </div>
            )}

            {/* Ajuste fino de tamaño */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>Tamaño de firma</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Ancho {Math.round(sigBox.wPct * 100)}%</label>
                  <input type="range" min={5} max={80} value={Math.round(sigBox.wPct * 100)}
                    onChange={(e) => setSigBox((s) => ({ ...s, wPct: parseInt(e.target.value) / 100 }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Alto {Math.round(sigBox.hPct * 100)}%</label>
                  <input type="range" min={3} max={40} value={Math.round(sigBox.hPct * 100)}
                    onChange={(e) => setSigBox((s) => ({ ...s, hPct: parseInt(e.target.value) / 100 }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            </div>

            {/* Presets rápidos */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>Posición rápida</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Pie der.', box: { xPct: 0.55, yPct: 0.04, wPct: 0.38, hPct: 0.10 } },
                  { label: 'Pie izq.', box: { xPct: 0.04, yPct: 0.04, wPct: 0.38, hPct: 0.10 } },
                  { label: 'Centro inf.', box: { xPct: 0.28, yPct: 0.04, wPct: 0.44, hPct: 0.10 } },
                  { label: 'Centro', box: { xPct: 0.28, yPct: 0.45, wPct: 0.44, hPct: 0.10 } },
                  { label: 'Cabecera der.', box: { xPct: 0.55, yPct: 0.88, wPct: 0.38, hPct: 0.10 } },
                ].map(({ label, box }) => (
                  <button
                    key={label}
                    className="btn btn-ghost btn-xs"
                    onClick={() => setSigBox(box)}
                    style={{ textAlign: 'left', fontSize: '0.8rem', padding: '6px 8px', justifyContent: 'flex-start' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instrucciones */}
            <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--gray-600)' }}>¿Cómo posicionar?</strong><br />
              Arrastra el recuadro verde sobre el PDF. También puedes redimensionarlo desde la esquina ↘.
            </div>
          </div>

          {/* ─── Panel derecho: canvas del PDF ──────────────────────────── */}
          <div ref={scrollContainerRef} style={{ flex: 1, overflow: 'auto', background: '#525659', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12px' }}>
            {loadingPdf && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'white', padding: '60px 0' }}>
                <span className="spinner spinner-lg" style={{ borderTopColor: 'white' }} />
                <span style={{ fontSize: '0.85rem' }}>Cargando vista previa…</span>
              </div>
            )}

            {pdfError && (
              <div style={{ color: '#fca5a5', textAlign: 'center', padding: '40px 20px', fontSize: '0.85rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {pdfError}
              </div>
            )}

            {!loadingPdf && !pdfError && (
              <div ref={containerRef} style={{ position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', userSelect: 'none' }}>
                {/* Canvas con el PDF renderizado */}
                <canvas ref={canvasRef} style={{ display: 'block' }} />

                {/* Overlay de la firma (arrastrable) */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                  style={{
                    position: 'absolute',
                    left: overlayLeft,
                    top: overlayTop,
                    width: overlayW,
                    height: overlayH,
                    border: '2px solid #16a34a',
                    background: 'rgba(22, 163, 74, 0.12)',
                    cursor: 'move',
                    borderRadius: '3px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {firmaGuardada && (
                    <img
                      src={firmaGuardada}
                      alt="Firma"
                      draggable={false}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                    />
                  )}
                  {!firmaGuardada && (
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, pointerEvents: 'none' }}>FIRMA</span>
                  )}

                  {/* Handle de resize — esquina inferior derecha */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize'); }}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: '14px', height: '14px',
                      background: '#16a34a',
                      cursor: 'nwse-resize',
                      borderRadius: '2px 0 2px 0',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'block', margin: '2px' }}>
                      <path d="M3 8 L8 3 M6 8 L8 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Etiqueta de posición actual */}
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'rgba(0,0,0,0.55)', color: 'white',
                  fontSize: '10px', padding: '2px 6px', borderRadius: '3px',
                  pointerEvents: 'none',
                }}>
                  x:{Math.round(sigBox.xPct * 100)}% y:{Math.round(sigBox.yPct * 100)}% · pág. {currentPage}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
            ℹ️ Se descargará una copia firmada. El original queda intacto.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleFirmar}
              disabled={loading || !firmaGuardada || loadingPdf}
              title={!firmaGuardada ? 'Configura tu firma primero' : ''}
            >
              {loading ? (
                <><span className="spinner" /> Firmando…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.827 2.827 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  Firmar y descargar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
