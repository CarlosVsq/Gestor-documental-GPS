import { Test, TestingModule } from '@nestjs/testing';
import { DocumentosRepository } from './documentos.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Documento } from './entities/documento.entity';
import { DataSource } from 'typeorm';
import { EstadoDocumento } from '../common/constants';

describe('DocumentosRepository', () => {
  let repository: DocumentosRepository;
  let mockDataSource: any;
  let mockRepo: any;

  beforeEach(async () => {
    // Mock DataSource
    mockDataSource = {
      query: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Mock Repository
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
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

  // ─── findById() ───────────────────────────────────────────────────────────

  describe('findById', () => {
    it('retorna el documento cuando existe', async () => {
      const doc = { id: 1, nombreOriginal: 'archivo.pdf' };
      mockRepo.findOne.mockResolvedValue(doc);

      const result = await repository.findById(1);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(doc);
    });

    it('retorna null cuando el documento no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  // ─── findByRequerimiento() ────────────────────────────────────────────────

  describe('findByRequerimiento', () => {
    it('retorna documentos del requerimiento ordenados por versión DESC', async () => {
      const docs = [
        { id: 2, requerimientoId: 1, version: 2 },
        { id: 1, requerimientoId: 1, version: 1 },
      ];
      mockRepo.find.mockResolvedValue(docs);

      const result = await repository.findByRequerimiento(1);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { requerimientoId: 1 },
        order: { version: 'DESC', creadoEn: 'DESC' },
      });
      expect(result).toEqual(docs);
    });

    it('retorna array vacío si el requerimiento no tiene documentos', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await repository.findByRequerimiento(999);

      expect(result).toEqual([]);
    });
  });

  // ─── softDelete() ─────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('llama a repo.softDelete con el id correcto', async () => {
      mockRepo.softDelete.mockResolvedValue({ affected: 1 });

      await repository.softDelete(42);

      expect(mockRepo.softDelete).toHaveBeenCalledWith(42);
    });
  });

  // ─── countByRequerimiento() ───────────────────────────────────────────────

  describe('countByRequerimiento', () => {
    it('retorna el conteo de documentos del requerimiento', async () => {
      mockRepo.count.mockResolvedValue(5);

      const result = await repository.countByRequerimiento(1);

      expect(mockRepo.count).toHaveBeenCalledWith({ where: { requerimientoId: 1 } });
      expect(result).toBe(5);
    });

    it('retorna 0 si no hay documentos', async () => {
      mockRepo.count.mockResolvedValue(0);

      const result = await repository.countByRequerimiento(999);

      expect(result).toBe(0);
    });
  });

  // ─── updateEstado() ───────────────────────────────────────────────────────

  describe('updateEstado', () => {
    it('llama a repo.update con el id y el nuevo estado', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await repository.updateEstado(1, EstadoDocumento.OFICIAL);

      expect(mockRepo.update).toHaveBeenCalledWith(1, { estadoDocumento: EstadoDocumento.OFICIAL });
    });
  });

  // ─── search() ─────────────────────────────────────────────────────────────

  describe('search', () => {
    const buildMockQB = (countResult = 0, rawResult: any[] = []) => ({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(countResult),
      getRawMany: jest.fn().mockResolvedValue(rawResult),
    });

    it('retorna data y total cuando hay resultados', async () => {
      const mockDocs = [{ id: 1, nombreOriginal: 'archivo.pdf' }];
      const mockQB = buildMockQB(1, mockDocs);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      const result = await repository.search({ requerimientoId: 1 });

      expect(result.total).toBe(1);
      expect(result.data).toEqual(mockDocs);
    });

    it('aplica filtro por requerimientoId cuando se provee', async () => {
      const mockQB = buildMockQB(0, []);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      await repository.search({ requerimientoId: 5 });

      expect(mockQB.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('"requerimientoId"'),
        expect.objectContaining({ reqId: 5 }),
      );
    });

    it('aplica filtro por estadoDocumento cuando se provee', async () => {
      const mockQB = buildMockQB(0, []);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      await repository.search({ estadoDocumento: EstadoDocumento.OFICIAL });

      expect(mockQB.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('"estadoDocumento"'),
        expect.objectContaining({ estado: EstadoDocumento.OFICIAL }),
      );
    });

    it('aplica búsqueda por texto (q) en nombreOriginal', async () => {
      const mockQB = buildMockQB(0, []);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      await repository.search({ q: 'contrato' });

      expect(mockQB.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('"nombreOriginal"'),
        expect.objectContaining({ q: '%contrato%' }),
      );
    });

    it('usa paginación por defecto (page=1, limit=20) cuando no se especifica', async () => {
      const mockQB = buildMockQB(0, []);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      await repository.search({});

      expect(mockQB.limit).toHaveBeenCalledWith(20);
      expect(mockQB.offset).toHaveBeenCalledWith(0);
    });

    it('limita el máximo de resultados por página a 100', async () => {
      const mockQB = buildMockQB(0, []);
      mockDataSource.createQueryBuilder.mockReturnValue(mockQB);

      await repository.search({ limit: 9999 });

      expect(mockQB.limit).toHaveBeenCalledWith(100);
    });
  });
});
