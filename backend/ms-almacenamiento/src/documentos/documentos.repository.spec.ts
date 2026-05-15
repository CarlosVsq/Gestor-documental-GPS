import { Test, TestingModule } from '@nestjs/testing';
import { DocumentosRepository } from './documentos.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Documento } from './entities/documento.entity';
import { DataSource } from 'typeorm';

describe('DocumentosRepository - getTree()', () => {
  let repository: DocumentosRepository;
  let mockDataSource: any;

  beforeEach(async () => {
    // Mock DataSource
    mockDataSource = {
      query: jest.fn(),
    };

    // Mock Repository
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosRepository,
        {
          provide: getRepositoryToken(Documento),
          useValue: mockRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<DocumentosRepository>(DocumentosRepository);
  });

  describe('getTree', () => {
    it('debe retornar nodos del árbol con nombres incluidos', async () => {
      const mockData = [
        {
          contratistaId: 1,
          contratistaNombre: 'Empresa A',
          areaId: 2,
          areaNombre: 'Área de Construcción',
          proyectoId: 3,
          proyectoNombre: 'Proyecto X',
          requerimientoId: 10,
          codigoTicket: 'REQ-2026-0001',
          titulo: 'Requerimiento 1',
          totalDocumentos: 5,
        },
        {
          contratistaId: 1,
          contratistaNombre: 'Empresa A',
          areaId: 2,
          areaNombre: 'Área de Construcción',
          proyectoId: 3,
          proyectoNombre: 'Proyecto X',
          requerimientoId: 11,
          codigoTicket: 'REQ-2026-0002',
          titulo: 'Requerimiento 2',
          totalDocumentos: 3,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockData);

      const result = await repository.getTree();

      expect(result).toEqual(mockData);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);

      // Verificar que el query incluya JOINs
      const queryCall = mockDataSource.query.mock.calls[0][0];
      expect(queryCall).toContain('LEFT JOIN contratistas c');
      expect(queryCall).toContain('LEFT JOIN areas a');
      expect(queryCall).toContain('LEFT JOIN proyectos p');
      expect(queryCall).toContain('c.nombre AS "contratistaNombre"');
      expect(queryCall).toContain('a.nombre AS "areaNombre"');
      expect(queryCall).toContain('p.nombre AS "proyectoNombre"');
    });

    it('debe excluir registros eliminados (soft delete)', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await repository.getTree();

      const queryCall = mockDataSource.query.mock.calls[0][0];
      expect(queryCall).toContain('WHERE r."eliminadoEn" IS NULL');
      expect(queryCall).toContain('AND c."eliminadoEn" IS NULL');
      expect(queryCall).toContain('AND a."eliminadoEn" IS NULL');
    });

    it('debe contar documentos correctamente', async () => {
      const mockData = [
        {
          contratistaId: 1,
          contratistaNombre: 'Empresa A',
          areaId: 2,
          areaNombre: 'Área de Construcción',
          proyectoId: 3,
          proyectoNombre: 'Proyecto X',
          requerimientoId: 10,
          codigoTicket: 'REQ-2026-0001',
          titulo: 'Requerimiento 1',
          totalDocumentos: 25, // Cuenta de documentos
        },
      ];

      mockDataSource.query.mockResolvedValue(mockData);

      const result = await repository.getTree();

      expect(result[0].totalDocumentos).toBe(25);
    });

    it('debe ordenar por contratistaId, areaId, proyectoId, codigoTicket', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await repository.getTree();

      const queryCall = mockDataSource.query.mock.calls[0][0];
      expect(queryCall).toContain(
        'ORDER BY r."contratistaId", r."areaId", r."proyectoId", r."codigoTicket"',
      );
    });

    it('debe retornar array vacío cuando no hay requerimientos', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await repository.getTree();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('debe manejar nombres null del JOIN (contratista/área/proyecto no encontrado)', async () => {
      const mockData = [
        {
          contratistaId: 999,
          contratistaNombre: null, // Contratista eliminado pero requerimiento aún existe
          areaId: 2,
          areaNombre: 'Área de Construcción',
          proyectoId: 3,
          proyectoNombre: 'Proyecto X',
          requerimientoId: 10,
          codigoTicket: 'REQ-2026-0001',
          titulo: 'Requerimiento 1',
          totalDocumentos: 0,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockData);

      const result = await repository.getTree();

      expect(result[0].contratistaNombre).toBeNull();
      expect(result).toHaveLength(1);
    });
  });
});
