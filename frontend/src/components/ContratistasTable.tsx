import type { Contratista } from '../api/contratistas';

interface ContratistasTableProps {
  contratistas: Contratista[];
  total: number;
  onEdit: (contratista: Contratista) => void;
  onToggle: (id: number, activo: boolean) => void;
  loading?: boolean;
}

export default function ContratistasTable({ contratistas, total, onEdit, onToggle, loading }: ContratistasTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="table-card">
        <div className="loading-state">
          <div className="spinner" />
          <p>Cargando contratistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      {/* Table Header */}
      <div className="table-toolbar">
        <div className="table-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Buscar contratista..." className="search-input" />
        </div>
        <div className="table-filters">
          <span className="results-count">{total} resultado{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {contratistas.length === 0 ? (
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No hay contratistas registrados</h3>
          <p>Haz clic en "Nuevo Contratista" para crear el primer registro</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Contratista</th>
                <th>RUT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratistas.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-person">
                      <div className="person-avatar" style={{ backgroundColor: `hsl(${(c.id * 67) % 360}, 60%, 65%)` }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="person-name">{c.nombre}</span>
                    </div>
                  </td>
                  <td><code className="rut-chip">{c.rut}</code></td>
                  <td className="cell-muted">{c.email}</td>
                  <td className="cell-muted">{c.telefono || '—'}</td>
                  <td>
                    <span className={`status-badge ${c.activo ? 'status-active' : 'status-inactive'}`}>
                      <span className="status-dot" />
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="cell-muted cell-date">{formatDate(c.creadoEn)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn action-edit" onClick={() => onEdit(c)} title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        className={`action-btn ${c.activo ? 'action-delete' : 'action-edit'}`}
                        onClick={() => onToggle(c.id, c.activo)}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo ? (
                          /* Ícono de "pause/desactivar" */
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></svg>
                        ) : (
                          /* Ícono de "play/activar" */
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                        )}
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
  );
}
