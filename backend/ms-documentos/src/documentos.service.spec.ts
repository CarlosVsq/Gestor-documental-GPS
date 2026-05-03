import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { DocumentosService } from './documentos.service';
import { Documento } from './entities/documento.entity';

/**
 * Test unitario del servicio de Documentos (HU-06)
 * Verifica la lógica de negocio del CRUD de metadata documental.
 */
describe('DocumentosService', () => {
  let service: DocumentosService;

  const mockDocumentoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        {
          provide: getRepositoryToken(Documento),
          useValue: mockDocumentoRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ================================================================
  // CREATE
  // ================================================================
  describe('create', () => {
    const createData = {
      nombreOriginal: 'plano_estructura.pdf',
      storageId: '1714600000-123456789.pdf',
      mimeType: 'application/pdf',
      tamañoBytes: 2048000,
      autorId: 1,
    };

    it('debería registrar un nuevo documento exitosamente', async () => {
      const expected = { id: 1, ...createData, creadoEn: new Date() };
      mockDocumentoRepository.create.mockReturnValue(expected);
      mockDocumentoRepository.save.mockResolvedValue(expected);

      const result = await service.create(createData);

      expect(result).toEqual(expected);
      expect(mockDocumentoRepository.create).toHaveBeenCalledWith({
        nombreOriginal: createData.nombreOriginal,
        storageId: createData.storageId,
        mimeType: createData.mimeType,
        tamañoBytes: createData.tamañoBytes,
        autorId: createData.autorId,
      });
      expect(mockDocumentoRepository.save).toHaveBeenCalled();
    });
  });

  // ================================================================
  // FIND ALL
  // ================================================================
  describe('findAll', () => {
    it('debería retornar todos los documentos ordenados por fecha descendente', async () => {
      const docs = [
        { id: 2, nombreOriginal: 'doc_b.pdf', creadoEn: new Date('2026-05-02') },
        { id: 1, nombreOriginal: 'doc_a.pdf', creadoEn: new Date('2026-05-01') },
      ];
      mockDocumentoRepository.find.mockResolvedValue(docs);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockDocumentoRepository.find).toHaveBeenCalledWith({
        order: { creadoEn: 'DESC' },
      });
    });

    it('debería retornar arreglo vacío si no hay documentos', async () => {
      mockDocumentoRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ================================================================
  // GET FILE INFO
  // ================================================================
  describe('getFileInfo', () => {
    it('debería retornar storageId y originalName del documento', async () => {
      const doc = {
        id: 1,
        nombreOriginal: 'plano_estructura.pdf',
        storageId: '1714600000-123456789.pdf',
        mimeType: 'application/pdf',
      };
      mockDocumentoRepository.findOne.mockResolvedValue(doc);

      const result = await service.getFileInfo(1);

      expect(result).toEqual({
        storageId: '1714600000-123456789.pdf',
        originalName: 'plano_estructura.pdf',
      });
    });

    it('debería lanzar RpcException si el documento no existe', async () => {
      mockDocumentoRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileInfo(999)).rejects.toThrow(RpcException);
    });
  });
});
