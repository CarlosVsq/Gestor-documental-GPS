import { useState, useEffect } from 'react';
import type { Subtipo } from '../api/subtipos';

interface SubtiposTableProps {
    data: Subtipo[];
    onEdit: (subtipo: Subtipo) => void;
    onToggleStatus: (id: number) => void;
}

export default function SubtiposTable({ data, onEdit, onToggleStatus }: SubtiposTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <p>No hay subtipos registrados aún.</p>
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
                        <th>Categoría Padre</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th className="actions-cell">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((sub) => (
                        <tr key={sub.id} className={!sub.activo ? 'row-inactive' : ''}>
                            <td>#{sub.id}</td>
                            <td>{sub.categoria?.nombre || '-'}</td>
                            <td className="font-medium">{sub.nombre}</td>
                            <td>{sub.descripcion || '-'}</td>
                            <td>
                                <span className={`status-badge ${sub.activo ? 'status-active' : 'status-inactive'}`}>
                                    <span className="status-dot" />
                                    {sub.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>
                                <div className="row-actions">
                                    <button className="action-btn action-edit" onClick={() => onEdit(sub)} title="Editar">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button
                                        className={`action-btn ${sub.activo ? 'action-delete' : 'action-edit'}`}
                                        onClick={() => onToggleStatus(sub.id)}
                                        title={sub.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {sub.activo ? (
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
