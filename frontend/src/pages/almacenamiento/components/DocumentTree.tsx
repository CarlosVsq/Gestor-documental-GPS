import { useState, useMemo } from 'react';
import type { TreeNode } from '../../../api/almacenamiento';

interface DocumentTreeProps {
  nodes: TreeNode[];
  onSelectRequerimiento: (requerimientoId: number, codigoTicket: string, storagePath: string) => void;
  selectedRequerimientoId?: number;
}

/**
 * DocumentTree — Árbol jerárquico de navegación (HU-32)
 * Contratista → Área → Proyecto → Requerimiento → (N docs)
 * 
 * Los nombres se extraen directamente de los nodos que vienen del backend.
 */
export default function DocumentTree({
  nodes,
  onSelectRequerimiento,
  selectedRequerimientoId,
}: DocumentTreeProps) {
  const [expandedContratistas, setExpandedContratistas] = useState<Set<number>>(new Set());
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedProyectos, setExpandedProyectos] = useState<Set<string>>(new Set());

  // Construir árbol agrupado desde los nodos planos
  // Extrae los nombres de contratista, área y proyecto de los primeros nodos encontrados
  const tree = useMemo(() => {
    const map: Record<number, Record<number, Record<number, TreeNode[]>>> = {};
    const contratistaNames: Record<number, string> = {};
    const areaNames: Record<number, string> = {};
    const proyectoNames: Record<number, string> = {};

    for (const node of nodes) {
      if (!map[node.contratistaId]) map[node.contratistaId] = {};
      if (!map[node.contratistaId][node.areaId]) map[node.contratistaId][node.areaId] = {};
      if (!map[node.contratistaId][node.areaId][node.proyectoId]) {
        map[node.contratistaId][node.areaId][node.proyectoId] = [];
      }
      map[node.contratistaId][node.areaId][node.proyectoId].push(node);

      // Guardar nombres (usando cualquier nodo como referencia)
      if (!contratistaNames[node.contratistaId] && node.contratistaNombre) {
        contratistaNames[node.contratistaId] = node.contratistaNombre;
      }
      if (!areaNames[node.areaId] && node.areaNombre) {
        areaNames[node.areaId] = node.areaNombre;
      }
      if (!proyectoNames[node.proyectoId] && node.proyectoNombre) {
        proyectoNames[node.proyectoId] = node.proyectoNombre;
      }
    }

    return { map, contratistaNames, areaNames, proyectoNames };
  }, [nodes]);

  const toggleContratista = (cId: number) => {
    setExpandedContratistas((prev) => {
      const next = new Set(prev);
      next.has(cId) ? next.delete(cId) : next.add(cId);
      return next;
    });
  };

  const toggleArea = (key: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleProyecto = (key: string) => {
    setExpandedProyectos((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
        Sin expedientes
      </div>
    );
  }

  return (
    <div className="tree-container">
      {Object.entries(tree.map).map(([cIdStr, areaMap]) => {
        const cId = parseInt(cIdStr);
        const isOpen = expandedContratistas.has(cId);
        const totalDocs = Object.values(areaMap)
          .flatMap((pm) => Object.values(pm))
          .flat()
          .reduce((s: number, node: TreeNode) => s + node.totalDocumentos, 0);
        const contratistaName = tree.contratistaNames[cId] || `Contratista #${cId}`;

        return (
          <div key={cId} className="tree-node tree-contratista">
            <button
              className={`tree-toggle ${isOpen ? 'open' : ''}`}
              onClick={() => toggleContratista(cId)}
            >
              <span className="tree-chevron" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="tree-label">{contratistaName}</span>
              <span className="tree-badge">{totalDocs} docs</span>
            </button>

            {isOpen && (
              <div className="tree-children">
                {Object.entries(areaMap).map(([aIdStr, proyMap]) => {
                  const aId = parseInt(aIdStr);
                  const areaKey = `${cId}-${aId}`;
                  const areaOpen = expandedAreas.has(areaKey);
                  const areaDocs = Object.values(proyMap).flat().reduce((s, n) => s + n.totalDocumentos, 0);
                  const areaName = tree.areaNames[aId] || `Área #${aId}`;

                  return (
                    <div key={aId} className="tree-node tree-area">
                      <button className="tree-toggle" onClick={() => toggleArea(areaKey)}>
                        <span className="tree-chevron" style={{ transform: areaOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#7c3aed' }}>
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="tree-label">{areaName}</span>
                        <span className="tree-badge">{areaDocs} docs</span>
                      </button>

                      {areaOpen && (
                        <div className="tree-children">
                          {Object.entries(proyMap).map(([pIdStr, reqs]) => {
                            const pId = parseInt(pIdStr);
                            const proyKey = `${cId}-${aId}-${pId}`;
                            const proyOpen = expandedProyectos.has(proyKey);
                            const proyDocs = reqs.reduce((s, n) => s + n.totalDocumentos, 0);
                            const proyectoName = tree.proyectoNames[pId] || `Proyecto #${pId}`;

                            return (
                              <div key={pId} className="tree-node tree-proyecto">
                                <button className="tree-toggle" onClick={() => toggleProyecto(proyKey)}>
                                  <span className="tree-chevron" style={{ transform: proyOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </span>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#0891b2' }}>
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                  </svg>
                                  <span className="tree-label">{proyectoName}</span>
                                  <span className="tree-badge">{proyDocs} docs</span>
                                </button>

                                {proyOpen && (
                                  <div className="tree-children">
                                    {reqs.map((req) => (
                                      <button
                                        key={req.requerimientoId}
                                        className={`tree-toggle tree-requerimiento ${selectedRequerimientoId === req.requerimientoId ? 'active' : ''}`}
                                        onClick={() =>
                                          onSelectRequerimiento(
                                            req.requerimientoId,
                                            req.codigoTicket,
                                            `/${cId}/${aId}/${pId}/${req.codigoTicket}`,
                                          )
                                        }
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)', marginLeft: '4px' }}>
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                          <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span className="tree-label">{req.codigoTicket}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: 'auto' }}>
                                          {req.totalDocumentos} doc{req.totalDocumentos !== 1 ? 's' : ''}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
