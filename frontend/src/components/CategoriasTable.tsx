import { useState, useEffect } from 'react';
import type { Categoria } from '../api/categorias';

interface CategoriasTableProps {
    data: Categoria[];
    onEdit: (categoria: Categoria) => void;
    onToggleStatus: (id: number) => void;
}

export default function CategoriasTable({ data, onEdit, onToggleStatus }: CategoriasTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <p>No hay categorías registradas aún.</p>
            </div>
        );
    }

    return (
        <div className="table-card">
            <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th className="actions-cell">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((cat) => (
                        <tr key={cat.id} className={!cat.activo ? 'row-inactive' : ''}>
                            <td>#{cat.id}</td>
                            <td className="font-medium">{cat.nombre}</td>
                            <td>{cat.descripcion || '-'}</td>
                            <td>
                                <span className={`status-badge ${cat.activo ? 'status-active' : 'status-inactive'}`}>
                                    <span className="status-dot" />
                                    {cat.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>
                                <div className="row-actions">
                                    <button className="action-btn action-edit" onClick={() => onEdit(cat)} title="Editar">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button
                                        className={`action-btn ${cat.activo ? 'action-delete' : 'action-edit'}`}
                                        onClick={() => onToggleStatus(cat.id)}
                                        title={cat.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {cat.activo ? (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                        ) : (
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
        </div>
    );
}
