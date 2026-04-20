import { useState, useEffect, useCallback, useRef } from 'react';
import { documentosApi } from '../api/documentos';
import type { DocumentoRecord } from '../api/documentos';
import { useAuth } from '../context/AuthContext';

interface DocumentosPageProps {
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export default function DocumentosPage({ onNotify }: DocumentosPageProps) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentosApi.getAll();
      setDocs(data);
    } catch {
      onNotify('Error al cargar documentos', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await documentosApi.upload(file);
      onNotify('Documento subido correctamente', 'success');
      loadDocs();
    } catch (err: any) {
      onNotify(err.message || 'Error al subir documento', 'error');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: DocumentoRecord) => {
    try {
      const blob = await documentosApi.downloadBlob(doc.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.nombreOriginal);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      onNotify('Error al descargar el documento', 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="page-content">
      {/* Botón Flotante Superior */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileSelect} 
        />
        <button 
          className="btn btn-primary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
          {uploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-filters">
            <span className="results-count">{docs.length} documento{docs.length !== 1 ? 's' : ''} en plataforma</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Cargando documentos...</p></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h3>No hay documentos</h3>
            <p>Sube el primer documento técnico para centralizar la información</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre del Archivo</th>
                  <th>Tamaño</th>
                  <th>Subido Por</th>
                  <th>Fecha de Subida</th>
                  <th style={{ width: '80px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--gray-800)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                        </svg>
                        {doc.nombreOriginal}
                      </div>
                    </td>
                    <td className="cell-muted">{formatSize(doc.tamañoBytes)}</td>
                    <td>
                      <div className="cell-person">
                        <div className="person-avatar" style={{ backgroundColor: `hsl(${(doc.autor.id * 67) % 360}, 60%, 65%)`, width: 28, height: 28, fontSize: '0.7rem' }}>
                          {doc.autor.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="person-name" style={{ fontSize: '0.82rem' }}>{doc.autor.nombre}</span>
                      </div>
                    </td>
                    <td className="cell-muted cell-date">{formatDate(doc.creadoEn)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn action-edit" title="Descargar / Ver" onClick={() => handleDownload(doc)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
