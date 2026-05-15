import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  almacenamientoApi,
  type Documento,
  type SearchFiltros,
} from '../../api/almacenamiento';
import DocumentTree from './components/DocumentTree';
import UploadModal from './components/UploadModal';
import ConfigurarFirmaModal from './components/ConfigurarFirmaModal';
import FirmarDocumentoModal from './components/FirmarDocumentoModal';

// ─── Dialog personalizado — reemplaza browser confirm() / alert() ────────────

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert';
  onConfirm?: () => void;
}

function AppDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  if (!state.open) return null;
  const isConfirm = state.type === 'confirm';
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .15s ease',
      }}
    >
      <div
        style={{
          background: 'white', borderRadius: 'var(--radius-lg)',
          padding: '28px 32px', maxWidth: '420px', width: '90vw',
          boxShadow: 'var(--shadow-xl)',
          animation: 'slideUp .2s ease',
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
          {state.title}
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {isConfirm && (
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          )}
          <button
            className={`btn ${isConfirm ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { state.onConfirm?.(); onClose(); }}
            autoFocus
          >
            {isConfirm ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlmacenamientoPageProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

type View = 'tree' | 'search' | 'requerimiento';

export default function AlmacenamientoPage({ onNotify }: AlmacenamientoPageProps) {
  const { user } = useAuth();
  const FIRMA_KEY = `sgd_firma_${user?.id ?? 'anon'}`;

  // ─── Firma persistente ──────────────────────────────────────────────────────
  const [firmaGuardada, setFirmaGuardada] = useState<string | null>(null);
  const [showConfigFirma, setShowConfigFirma] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FIRMA_KEY);
    if (stored) setFirmaGuardada(stored);
  }, [FIRMA_KEY]);

  // ─── Árbol ─────────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('tree');
  const [treeNodes, setTreeNodes] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);

  // ─── Requerimiento seleccionado ─────────────────────────────────────────────
  const [selectedReq, setSelectedReq] = useState<{
    id: number; codigoTicket: string; storagePath: string;
  } | null>(null);
  const [reqDocumentos, setReqDocumentos] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // ─── Paginación para documentos ─────────────────────────────────────────────
  const [docPage, setDocPage] = useState(1);
  const DOCS_PER_PAGE = 20;

  // ─── Búsqueda ───────────────────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<{ data: Documento[]; total: number } | null>(null);
  const [searching, setSearching] = useState(false);

  // ─── Modales ────────────────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Cambio de estado inline
  const [updatingEstado, setUpdatingEstado] = useState<number | null>(null);

  // Modal de firma de documento
  const [docAFirmar, setDocAFirmar] = useState<Documento | null>(null);

  // ─── Dialog personalizado ───────────────────────────────────────────────────
  const [dialog, setDialog] = useState<DialogState>({
    open: false, title: '', message: '', type: 'alert',
  });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ open: true, title, message, type: 'confirm', onConfirm });

  // ─── Carga del árbol ────────────────────────────────────────────────────────
  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      setTreeNodes(await almacenamientoApi.getTree());
    } catch {
      onNotify('Error al cargar el árbol de documentos', 'error');
    } finally {
      setLoadingTree(false);
    }
  }, [onNotify]);

  useEffect(() => { loadTree(); }, [loadTree]);

  // ─── Selección de requerimiento ─────────────────────────────────────────────
  const handleSelectRequerimiento = useCallback(async (
    id: number, codigoTicket: string, storagePath: string,
  ) => {
    setSelectedReq({ id, codigoTicket, storagePath });
    setView('requerimiento');
    setDocPage(1);
    setLoadingDocs(true);
    try {
      setReqDocumentos(await almacenamientoApi.getByRequerimiento(id));
    } catch {
      onNotify('Error al cargar documentos', 'error');
    } finally {
      setLoadingDocs(false);
    }
  }, [onNotify]);

  // ─── Búsqueda ───────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (filtros: SearchFiltros) => {
    setSearching(true);
    setView('search');
    setDocPage(1);
    try {
      setSearchResults(await almacenamientoApi.search(filtros));
    } catch {
      onNotify('Error en la búsqueda', 'error');
    } finally {
      setSearching(false);
    }
  }, [onNotify]);

  // ─── Descarga ───────────────────────────────────────────────────────────────
  const handleDownload = async (doc: Documento) => {
    try {
      const { blob, filename } = await almacenamientoApi.downloadBlob(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      onNotify('Error al descargar el documento', 'error');
    }
  };

  // ─── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = (doc: Documento) => {
    showConfirm(
      'Eliminar documento',
      `¿Estás seguro de que deseas eliminar "${doc.nombreOriginal}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await almacenamientoApi.delete(doc.id);
          onNotify('Documento eliminado correctamente', 'success');
          if (selectedReq) handleSelectRequerimiento(selectedReq.id, selectedReq.codigoTicket, selectedReq.storagePath);
          loadTree();
        } catch {
          onNotify('Error al eliminar el documento', 'error');
        }
      },
    );
  };

  // ─── Cambiar estado ─────────────────────────────────────────────────────────
  const handleUpdateEstado = (doc: Documento) => {
    const siguiente = doc.estadoDocumento === 'BORRADOR' ? 'OFICIAL' : 'OBSOLETO';
    showConfirm(
      'Cambiar estado',
      `¿Cambiar "${doc.nombreOriginal}" de ${doc.estadoDocumento} → ${siguiente}?`,
      async () => {
        setUpdatingEstado(doc.id);
        try {
          const updated = await almacenamientoApi.updateEstado(doc.id, siguiente as any);
          setReqDocumentos((prev) => prev.map((d) => d.id === doc.id ? updated : d));
          if (view === 'search' && searchResults) {
            setSearchResults((prev) => prev ? {
              ...prev,
              data: prev.data.map((d) => d.id === doc.id ? updated : d),
            } : null);
          }
          onNotify(`Estado actualizado: ${siguiente}`, 'success');
        } catch (err: any) {
          onNotify(err.message || 'Error al cambiar estado', 'error');
        } finally {
          setUpdatingEstado(null);
        }
      },
    );
  };

  // ─── PDF de cierre ──────────────────────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!selectedReq) return;
    setGeneratingPdf(true);
    try {
      const { documentoId, sha256Hash } = await almacenamientoApi.generatePdf(
        selectedReq.id, selectedReq.storagePath, firmaGuardada || undefined,
      );
      onNotify(`PDF inmutable generado · ID: ${documentoId} · SHA256: ${sha256Hash.substring(0, 16)}…`, 'success');
      handleSelectRequerimiento(selectedReq.id, selectedReq.codigoTicket, selectedReq.storagePath);
      loadTree();
    } catch (err: any) {
      onNotify(err.message || 'Error al generar PDF', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ─── Helpers de render ──────────────────────────────────────────────────────
  const formatBytes = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;
  const getMimeIcon = (mime: string) =>
    mime.includes('pdf') ? '📄' : mime.includes('image') ? '🖼️' : mime.includes('word') ? '📝' : mime.includes('sheet') ? '📊' : '📁';

  const SIGUIENTE_ESTADO: Record<string, string> = { BORRADOR: 'OFICIAL', OFICIAL: 'OBSOLETO' };

  const estadoBadge = (estado: string) => {
    const cls = estado === 'BORRADOR' ? 'badge-warning' : estado === 'OFICIAL' ? 'badge-success' : 'badge-gray';
    return <span className={`badge ${cls}`}>{estado}</span>;
  };

  const renderDocumentList = (docs: Documento[], emptyMsg: string) => {
    if (docs.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
          </svg>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginTop: '8px' }}>{emptyMsg}</p>
        </div>
      );
    }
    
    // Ordenar los documentos: más recientes primero, y paginarlos
    const sortedDocs = [...docs].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
    const totalPages = Math.ceil(sortedDocs.length / DOCS_PER_PAGE);
    const paginatedDocs = sortedDocs.slice((docPage - 1) * DOCS_PER_PAGE, docPage * DOCS_PER_PAGE);

    return (
      <div className="doc-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Archivo</th><th>Tipo</th><th>Tamaño</th><th>Estado</th>
              {view === 'search' && <th>Requerimiento</th>}
              <th>Fecha</th><th>SHA-256</th><th style={{ minWidth: '160px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getMimeIcon(doc.mimeType)}</span>
                    <span style={{ fontSize: '0.83rem', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.nombreOriginal}
                    </span>
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {doc.mimeType.split('/')[1]?.toUpperCase() || doc.mimeType}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{formatBytes(Number(doc.tamañoBytes))}</td>
                <td>{estadoBadge(doc.estadoDocumento)}</td>
                {view === 'search' && (
                  <td style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 500 }}>
                    {(doc as any).codigoTicket || `#${doc.requerimientoId}`}
                  </td>
                )}
                <td style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  {new Date(doc.creadoEn).toLocaleDateString('es-CL')}
                </td>
                <td>
                  {doc.sha256Hash
                    ? <span title={doc.sha256Hash} style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--gray-400)', cursor: 'help' }}>{doc.sha256Hash.substring(0, 10)}…</span>
                    : <span style={{ color: 'var(--gray-300)', fontSize: '0.72rem' }}>—</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {/* Avanzar estado */}
                    {SIGUIENTE_ESTADO[doc.estadoDocumento] && (
                      <button
                        className="btn btn-ghost btn-xs"
                        title={`Marcar como ${SIGUIENTE_ESTADO[doc.estadoDocumento]}`}
                        onClick={() => handleUpdateEstado(doc)}
                        disabled={updatingEstado === doc.id}
                        style={{ fontSize: '0.7rem', color: doc.estadoDocumento === 'BORRADOR' ? '#0891b2' : '#92400e', borderColor: 'currentColor' }}
                      >
                        {updatingEstado === doc.id
                          ? <span className="spinner" style={{ borderTopColor: 'currentColor', width: '10px', height: '10px', borderWidth: '2px' }} />
                          : `→ ${SIGUIENTE_ESTADO[doc.estadoDocumento]}`}
                      </button>
                    )}
                    {/* Firmar (solo PDFs) */}
                    {doc.mimeType === 'application/pdf' && (
                      <button
                        className="btn btn-ghost btn-xs"
                        title={firmaGuardada ? 'Firmar documento' : 'Configura tu firma primero'}
                        onClick={() => setDocAFirmar(doc)}
                        style={{ color: '#7c3aed' }}
                      >
                        ✍️
                      </button>
                    )}
                    {/* Descargar */}
                    <button className="btn btn-ghost btn-xs" onClick={() => handleDownload(doc)} title="Descargar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    {/* Eliminar */}
                    <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(doc)} title="Eliminar" style={{ color: 'var(--danger)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', paddingBottom: '10px' }}>
            <button className="btn btn-secondary btn-xs" disabled={docPage === 1} onClick={() => setDocPage(p => p - 1)}>
              Anterior
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              Página {docPage} de {totalPages}
            </span>
            <button className="btn btn-secondary btn-xs" disabled={docPage === totalPages} onClick={() => setDocPage(p => p + 1)}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="almacenamiento-layout page-content">
      {/* ─── Sidebar: árbol + búsqueda ─────────────────────────────────────── */}
      <aside className="almacenamiento-sidebar">
        {/* Botón firma + búsqueda */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text" placeholder="Buscar..." className="form-input"
              style={{ paddingLeft: '30px', height: '34px', fontSize: '0.83rem' }}
              onChange={(e) => {
                const q = e.target.value;
                if (q.length >= 2) handleSearch({ q, page: 1, limit: 20 });
                else if (q.length === 0) { setView('tree'); setSearchResults(null); }
              }}
            />
          </div>
          <button
            className="btn btn-ghost btn-xs"
            title={firmaGuardada ? 'Actualizar firma guardada' : 'Configurar firma digital'}
            onClick={() => setShowConfigFirma(true)}
            style={{ flexShrink: 0, position: 'relative', color: firmaGuardada ? '#166534' : 'var(--gray-500)', padding: '6px 8px' }}
          >
            ✍️
            {firmaGuardada && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', border: '1px solid white' }} />
            )}
          </button>
        </div>

        {/* Árbol */}
        <div className="tree-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 2px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Expedientes</span>
            <button className="btn btn-ghost btn-xs" onClick={loadTree} title="Actualizar">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          {loadingTree
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><span className="spinner spinner-lg" /></div>
            : <DocumentTree nodes={treeNodes} onSelectRequerimiento={handleSelectRequerimiento} selectedRequerimientoId={selectedReq?.id} />}
        </div>
      </aside>

      {/* ─── Main: contenido ────────────────────────────────────────────────── */}
      <main className="almacenamiento-main">
        {view === 'requerimiento' && selectedReq && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{selectedReq.codigoTicket}</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{reqDocumentos.length} documentos</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf || reqDocumentos.length === 0}
                  title={firmaGuardada ? 'El PDF incluirá tu firma guardada' : 'Se generará sin firma (configura tu firma primero)'}
                >
                  {generatingPdf ? <><span className="spinner" /> Generando…</> : <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    PDF de Cierre{firmaGuardada ? ' ✍️' : ''}
                  </>}
                </button>
                <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Cargar Documentos
                </button>
              </div>
            </div>
            {loadingDocs
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><span className="spinner spinner-lg" /></div>
              : renderDocumentList(reqDocumentos, 'Sin documentos. Haz clic en "Cargar Documentos".')}
          </>
        )}

        {view === 'search' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Resultados de búsqueda</h2>
              {searchResults && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>{searchResults.total} documentos encontrados</p>}
            </div>
            {searching
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><span className="spinner spinner-lg" /></div>
              : searchResults ? renderDocumentList(searchResults.data, 'Sin resultados para estos filtros.') : null}
          </>
        )}

        {view === 'tree' && (
          <div className="empty-state" style={{ padding: '80px 0' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h3 style={{ color: 'var(--gray-400)', fontWeight: 500, marginTop: '12px', fontSize: '1rem' }}>Selecciona un expediente</h3>
            <p style={{ color: 'var(--gray-300)', fontSize: '0.85rem' }}>Navega por el árbol de la izquierda</p>
          </div>
        )}
      </main>

      {/* ─── Modales ─────────────────────────────────────────────────────────── */}

      {showUpload && selectedReq && (
        <UploadModal
          requerimientoId={selectedReq.id}
          codigoTicket={selectedReq.codigoTicket}
          storagePath={selectedReq.storagePath}
          onSuccess={(docs: Documento[]) => {
            onNotify(`${docs.length} documento${docs.length !== 1 ? 's' : ''} cargado${docs.length !== 1 ? 's' : ''} exitosamente`, 'success');
            setShowUpload(false);
            handleSelectRequerimiento(selectedReq.id, selectedReq.codigoTicket, selectedReq.storagePath);
            loadTree();
          }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showConfigFirma && (
        <ConfigurarFirmaModal
          userId={user?.id ?? 0}
          onClose={() => setShowConfigFirma(false)}
          onSaved={(dataUrl) => {
            setFirmaGuardada(dataUrl);
            setShowConfigFirma(false);
            onNotify('Firma guardada correctamente', 'success');
          }}
        />
      )}

      {docAFirmar && (
        <FirmarDocumentoModal
          documento={docAFirmar}
          firmaGuardada={firmaGuardada}
          onSuccess={() => {
            onNotify('Documento firmado descargado correctamente', 'success');
            setDocAFirmar(null);
          }}
          onClose={() => setDocAFirmar(null)}
          onNeedFirma={() => { setDocAFirmar(null); setShowConfigFirma(true); }}
        />
      )}

      {/* Dialog personalizado centrado */}
      <AppDialog state={dialog} onClose={closeDialog} />
    </div>
  );
}
