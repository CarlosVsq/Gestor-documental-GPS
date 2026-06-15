import { useRef, useState } from 'react';

interface FirmaUploadProps {
  onSelect: (dataUrl: string) => void;
  onClear?: () => void;
}

const ACCEPTED_MIME = ['image/png', 'image/jpeg'];
const MAX_SIZE_BYTES = 1 * 1024 * 1024;
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 400;

function resizeIfNeeded(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= MAX_WIDTH && img.height <= MAX_HEIGHT) {
        resolve(dataUrl);
        return;
      }
      const ratio = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height);
      const targetW = Math.round(img.width * ratio);
      const targetH = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Imagen inválida'));
    img.src = dataUrl;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * FirmaUpload — Permite cargar una firma desde un archivo PNG/JPG (HU-11).
 *
 * Valida formato y tamaño (≤1MB), y redimensiona automáticamente a 1000x400
 * máximo manteniendo aspect ratio antes de devolver el dataUrl al padre.
 */
export default function FirmaUpload({ onSelect, onClear }: FirmaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_MIME.includes(file.type)) {
      setError('Formato no permitido. Usa PNG o JPG.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`El archivo supera 1 MB (${(file.size / 1024 / 1024).toFixed(2)} MB).`);
      return;
    }
    setProcessing(true);
    try {
      const raw = await readAsDataUrl(file);
      const finalUrl = await resizeIfNeeded(raw);
      setPreview(finalUrl);
      onSelect(finalUrl);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="firma-canvas-container">
      <div className="firma-canvas-header">
        <span className="firma-canvas-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Subir imagen de firma
        </span>
      </div>

      <div
        className="firma-canvas-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '180px',
          padding: '16px',
          background: preview ? 'white' : 'var(--gray-50)',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Firma cargada"
            style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>
              {processing ? 'Procesando…' : 'Ninguna imagen seleccionada'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="firma-canvas-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          disabled={!preview && !error}
        >
          Quitar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {preview ? 'Cambiar archivo' : 'Seleccionar archivo'}
        </button>
      </div>

      <p className="firma-canvas-hint">
        PNG o JPG, máximo 1 MB. Imágenes más grandes que 1000×400 px se redimensionan automáticamente.
      </p>
    </div>
  );
}
