import { useState, useCallback, useRef } from 'react';
import type { Documento } from '../../../api/almacenamiento';
import { almacenamientoApi, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '../../../api/almacenamiento';
import FirmaCanvas from './FirmaCanvas';

interface UploadModalProps {
  requerimientoId: number;
  codigoTicket: string;
  storagePath?: string | null;
  onSuccess: (docs: Documento[]) => void;
  onClose: () => void;
}

const MAX_FILE_SIZE_MB = 50; // Sincronizado con MAX_FILE_SIZE_MB en .env
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * UploadModal — Modal de carga de documentos (HU-07, HU-08)
 *
 * Soporta:
 * - Drag & drop de múltiples archivos
 * - Barra de progreso por carga masiva
 * - Validación de tipo MIME y tamaño (50 MB)
 * - Canvas de firma opcional
 */
export default function UploadModal({
  requerimientoId,
  codigoTicket,
  storagePath,
  onSuccess,
  onClose,
}: UploadModalProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ exitosos: Documento[]; errores: any[] } | null>(null);
  const [showFirma, setShowFirma] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'archivos' | 'firma'>('archivos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Tipo no permitido: ${file.type}. Acepta: PDF, DOCX, XLSX, DOC, PNG, JPG, GIF, WEBP`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Supera el límite de ${MAX_FILE_SIZE_MB} MB`;
    }
    return null;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const withStatus: FileWithStatus[] = newFiles.map((file) => ({
      file,
      status: 'pending',
      error: validateFile(file) || undefined,
    }));

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`));
      const deduplicated = withStatus.filter(
        (f) => !existing.has(`${f.file.name}-${f.file.size}`),
      );
      return [...prev, ...deduplicated];
    });
  }, []);

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const validFiles = files.filter((f) => !f.error).map((f) => f.file);
    if (validFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await almacenamientoApi.uploadBulk(
        validFiles,
        requerimientoId,
        storagePath || undefined,
        (loaded, total) => setProgress(Math.round((loaded / total) * 100)),
      );

      setResult(result);
      onSuccess(result.exitosos);
    } catch (err: any) {
      setResult({ exitosos: [], errores: [{ nombreOriginal: 'Todos los archivos', motivo: err.message }] });
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  const validCount = files.filter((f) => !f.error).length;
  const invalidCount = files.filter((f) => f.error).length;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getMimeIcon = (mime: string) => {
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('word') || mime.includes('msword')) return '📝';
    if (mime.includes('sheet') || mime.includes('excel')) return '📊';
    return '📁';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content upload-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '95vw' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0', borderBottom: '1px solid var(--gray-200)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              Cargar Documentos
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Requerimiento: <strong>{codigoTicket}</strong> · Máx. {MAX_FILE_SIZE_MB} MB por archivo
            </p>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', padding: '6px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--gray-200)', padding: '0 24px' }}>
          {(['archivos', 'firma'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500,
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--gray-500)',
                transition: 'all .2s',
              }}
            >
              {tab === 'archivos' ? '📁 Archivos' : '✍️ Firma Digital'}
              {tab === 'firma' && firmaBase64 && (
                <span style={{ marginLeft: '6px', background: 'var(--success-50)', color: 'var(--success-700)', borderRadius: '99px', padding: '1px 6px', fontSize: '0.7rem' }}>
                  Lista
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* ─── Tab: Archivos ─────────────────────────────────────────────── */}
          {activeTab === 'archivos' && !result && (
            <>
              {/* Drop Zone */}
              <div
                className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                    {isDragging ? '📥' : '☁️'}
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--gray-700)' }}>
                    {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                    PDF, DOCX, XLSX, DOC, PNG, JPG, GIF, WEBP — máx {MAX_FILE_SIZE_MB} MB
                  </p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                      {files.length} archivo{files.length !== 1 ? 's' : ''}
                      {invalidCount > 0 && (
                        <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>
                          · {invalidCount} con error
                        </span>
                      )}
                    </span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setFiles([])}
                      style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}
                    >
                      Limpiar todo
                    </button>
                  </div>

                  <div className="file-list">
                    {files.map((f, idx) => (
                      <div
                        key={`${f.file.name}-${idx}`}
                        className={`file-item ${f.error ? 'file-item-error' : ''}`}
                      >
                        <span className="file-icon">{getMimeIcon(f.file.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.file.name}
                          </p>
                          {f.error ? (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)' }}>{f.error}</p>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray-400)' }}>{formatBytes(f.file.size)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px', flexShrink: 0 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    <span>Subiendo archivos...</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', background: 'var(--primary)', borderRadius: '99px',
                        width: `${progress}%`, transition: 'width .3s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Tab: Firma ─────────────────────────────────────────────────── */}
          {activeTab === 'firma' && (
            <div style={{ padding: '4px 0' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                La firma se incrustará en el PDF de cierre al cerrar el requerimiento (HU-29).
              </p>
              <FirmaCanvas
                onSave={(dataUrl) => setFirmaBase64(dataUrl)}
                onClear={() => setFirmaBase64(null)}
                width={560}
                height={180}
              />
            </div>
          )}

          {/* ─── Resultado de la carga ────────────────────────────────────── */}
          {result && (
            <div className="upload-result">
              {result.exitosos.length > 0 && (
                <div className="result-success">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <strong style={{ color: 'var(--success-700)' }}>
                      {result.exitosos.length} documento{result.exitosos.length !== 1 ? 's' : ''} cargado{result.exitosos.length !== 1 ? 's' : ''} exitosamente
                    </strong>
                  </div>
                </div>
              )}
              {result.errores.length > 0 && (
                <div className="result-errors" style={{ marginTop: '12px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
                    {result.errores.length} error{result.errores.length !== 1 ? 'es' : ''}:
                  </p>
                  {result.errores.map((e, i) => (
                    <div key={i} className="file-item file-item-error">
                      <span>❌</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500 }}>{e.nombreOriginal}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)' }}>{e.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid var(--gray-200)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && activeTab === 'archivos' && (
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
            >
              {uploading ? (
                <>
                  <span className="spinner" />
                  Subiendo...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Subir {validCount > 0 ? `${validCount} archivo${validCount !== 1 ? 's' : ''}` : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
