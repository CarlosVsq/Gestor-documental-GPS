import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import sharpDefault from 'sharp';
import { DocumentosService } from './documentos.service';
import { DocumentosRepository } from './documentos.repository';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';
import { EstadoDocumento } from '../common/constants';
import { Documento } from './entities/documento.entity';

const sharpMock = sharpDefault as unknown as jest.Mock;

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed-image')),
  })),
}));

const makeDoc = (overrides: Partial<Documento> = {}): Documento =>
  ({
    id: 1,
    nombreOriginal: 'archivo.pdf',
    nombreStorage: '1234-abc.pdf',
    pathSeaweed: '/1/2/3/REQ-001/1234-abc.pdf',
    mimeType: 'application/pdf',
    tamañoBytes: 1024,
    sha256Hash: 'a'.repeat(64),
    requerimientoId: 1,
    estadoDocumento: EstadoDocumento.BORRADOR,
    version: 1,
    metadataAudit: null,
    autorId: 1,
    creadoPor: 'user@test.cl',
    actualizadoPor: 'user@test.cl',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    eliminadoEn: null,
    ...overrides,
  }) as Documento;

const baseDto = {
  nombreOriginal: 'archivo.pdf',
  mimeType: 'application/pdf',
  tamañoBytes: 100,
  requerimientoId: 1,
  autorId: 1,
  creadoPor: 'user@test.cl',
  fileBase64: Buffer.from('contenido-pdf').toString('base64'),
  storagePath: '/1/2/3/REQ-001',
};

describe('DocumentosService', () => {
  let service: DocumentosService;
  let mockRepo: jest.Mocked<DocumentosRepository>;
  let mockSeaweed: jest.Mocked<SeaweedFsService>;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByNombreStorage: jest.fn(),
      findByRequerimiento: jest.fn(),
      softDelete: jest.fn(),
      search: jest.fn(),
      getTree: jest.fn(),
      countByRequerimiento: jest.fn(),
      updateEstado: jest.fn(),
    } as any;

    mockSeaweed = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
      ensureDirectory: jest.fn(),
      listDirectory: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        { provide: DocumentosRepository, useValue: mockRepo },
        { provide: SeaweedFsService, useValue: mockSeaweed },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── upload() ────────────────────────────────────────────────────────────

  describe('upload()', () => {
    it('sube un PDF válido y retorna el documento guardado', async () => {
      const doc = makeDoc();
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/1/2/3/REQ-001/1234-abc.pdf', filename: '1234-abc.pdf' });
      mockRepo.save.mockResolvedValue(doc);

      const result = await service.upload(baseDto);

      expect(mockSeaweed.uploadFile).toHaveBeenCalledTimes(1);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(doc);
    });

    it('rechaza MIME types no permitidos con statusCode 400', async () => {
      expect.assertions(3);
      try {
        await service.upload({ ...baseDto, mimeType: 'video/mp4' });
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(400);
      }
      expect(mockSeaweed.uploadFile).not.toHaveBeenCalled();
    });

    it('persiste el documento con estadoDocumento BORRADOR', async () => {
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/file.pdf', filename: 'file.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc());

      await service.upload(baseDto);

      const savedData = mockRepo.save.mock.calls[0][0];
      expect(savedData.estadoDocumento).toBe(EstadoDocumento.BORRADOR);
    });

    it('calcula sha256Hash de 64 caracteres en el buffer final', async () => {
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/file.pdf', filename: 'file.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc());

      await service.upload(baseDto);

      const savedData = mockRepo.save.mock.calls[0][0];
      expect(savedData.sha256Hash).toHaveLength(64);
    });

    it('usa /misc como dirPath cuando storagePath está vacío', async () => {
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/misc/file.pdf', filename: 'file.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc());

      await service.upload({ ...baseDto, storagePath: '' });

      expect(mockSeaweed.uploadFile).toHaveBeenCalledWith(
        '/misc',
        expect.any(String),
        expect.any(Buffer),
        'application/pdf',
      );
    });

    it('aplica compresión sharp a imágenes antes de subir', async () => {
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/img.png', filename: 'img.png' });
      mockRepo.save.mockResolvedValue(makeDoc({ mimeType: 'image/png' }));

      await service.upload({
        ...baseDto,
        mimeType: 'image/png',
        nombreOriginal: 'foto.png',
        fileBase64: Buffer.from('fake-image-bytes').toString('base64'),
      });

      expect(sharpMock).toHaveBeenCalled();
    });

    it('no aplica sharp a documentos PDF ni Office', async () => {
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/file.pdf', filename: 'file.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc());

      await service.upload(baseDto);

      expect(sharpMock).not.toHaveBeenCalled();
    });

    describe('cuando el archivo excede el tamaño máximo', () => {
      let smallLimitService: DocumentosService;

      beforeAll(async () => {
        process.env.MAX_FILE_SIZE_MB = '0';
        const mod = await Test.createTestingModule({
          providers: [
            DocumentosService,
            { provide: DocumentosRepository, useValue: mockRepo },
            { provide: SeaweedFsService, useValue: mockSeaweed },
          ],
        }).compile();
        smallLimitService = mod.get<DocumentosService>(DocumentosService);
        delete process.env.MAX_FILE_SIZE_MB;
      });

      it('lanza RpcException con statusCode 413', async () => {
        expect.assertions(2);
        try {
          await smallLimitService.upload(baseDto);
        } catch (err) {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError().statusCode).toBe(413);
        }
      });
    });
  });

  // ─── uploadBulk() ────────────────────────────────────────────────────────

  describe('uploadBulk()', () => {
    it('separa exitosos y errores correctamente', async () => {
      const fileOk = { ...baseDto, nombreOriginal: 'ok.pdf' };
      const fileBad = { ...baseDto, nombreOriginal: 'bad.exe', mimeType: 'application/x-msdownload' };

      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/ok.pdf', filename: 'ok.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc({ nombreOriginal: 'ok.pdf' }));

      const result = await service.uploadBulk({ files: [fileOk, fileBad] });

      expect(result.exitosos).toHaveLength(1);
      expect(result.errores).toHaveLength(1);
      expect(result.errores[0].nombreOriginal).toBe('bad.exe');
    });

    it('retorna todos en exitosos cuando todos son válidos', async () => {
      const files = [1, 2, 3].map((i) => ({ ...baseDto, nombreOriginal: `file${i}.pdf` }));
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/file.pdf', filename: 'file.pdf' });
      mockRepo.save.mockResolvedValue(makeDoc());

      const result = await service.uploadBulk({ files });

      expect(result.exitosos).toHaveLength(3);
      expect(result.errores).toHaveLength(0);
    });

    it('retorna todos en errores cuando todos son inválidos', async () => {
      const files = [1, 2].map((i) => ({
        ...baseDto,
        nombreOriginal: `file${i}.exe`,
        mimeType: 'application/x-msdownload',
      }));

      const result = await service.uploadBulk({ files });

      expect(result.exitosos).toHaveLength(0);
      expect(result.errores).toHaveLength(2);
    });
  });

  // ─── download() ──────────────────────────────────────────────────────────

  describe('download()', () => {
    it('retorna base64, contentType y nombreOriginal del archivo', async () => {
      const doc = makeDoc();
      const fileBuffer = Buffer.from('contenido-pdf');
      mockRepo.findById.mockResolvedValue(doc);
      mockSeaweed.downloadFile.mockResolvedValue({ buffer: fileBuffer, contentType: 'application/pdf' });

      const result = await service.download(1);

      expect(result.base64).toBe(fileBuffer.toString('base64'));
      expect(result.contentType).toBe('application/pdf');
      expect(result.nombreOriginal).toBe(doc.nombreOriginal);
    });

    it('lanza 404 si el documento no existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      expect.assertions(2);
      try {
        await service.download(999);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });
  });

  // ─── findOne() ───────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('retorna el documento cuando existe', async () => {
      const doc = makeDoc();
      mockRepo.findById.mockResolvedValue(doc);

      const result = await service.findOne(1);

      expect(result).toEqual(doc);
    });

    it('lanza 404 cuando el documento no existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      expect.assertions(2);
      try {
        await service.findOne(999);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });
  });

  // ─── delete() ────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('elimina de SeaweedFS y hace soft-delete en BD, retorna {success:true}', async () => {
      const doc = makeDoc();
      mockRepo.findById.mockResolvedValue(doc);
      mockSeaweed.deleteFile.mockResolvedValue(undefined);
      mockRepo.softDelete.mockResolvedValue(undefined);

      const result = await service.delete(1);

      expect(mockSeaweed.deleteFile).toHaveBeenCalledWith(doc.pathSeaweed);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });

    it('lanza 404 si el documento no existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      expect.assertions(2);
      try {
        await service.delete(999);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });
  });

  // ─── updateEstado() ──────────────────────────────────────────────────────

  describe('updateEstado()', () => {
    it('permite la transición BORRADOR → OFICIAL', async () => {
      const doc = makeDoc({ estadoDocumento: EstadoDocumento.BORRADOR });
      mockRepo.findById.mockResolvedValue(doc);
      mockRepo.updateEstado.mockResolvedValue(undefined);

      const result = await service.updateEstado(1, EstadoDocumento.OFICIAL);

      expect(mockRepo.updateEstado).toHaveBeenCalledWith(1, EstadoDocumento.OFICIAL);
      expect(result.estadoDocumento).toBe(EstadoDocumento.OFICIAL);
    });

    it('permite la transición OFICIAL → OBSOLETO', async () => {
      const doc = makeDoc({ estadoDocumento: EstadoDocumento.OFICIAL });
      mockRepo.findById.mockResolvedValue(doc);
      mockRepo.updateEstado.mockResolvedValue(undefined);

      const result = await service.updateEstado(1, EstadoDocumento.OBSOLETO);

      expect(result.estadoDocumento).toBe(EstadoDocumento.OBSOLETO);
    });

    it('rechaza BORRADOR → OBSOLETO con 409 (salto de estado)', async () => {
      const doc = makeDoc({ estadoDocumento: EstadoDocumento.BORRADOR });
      mockRepo.findById.mockResolvedValue(doc);

      expect.assertions(2);
      try {
        await service.updateEstado(1, EstadoDocumento.OBSOLETO);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(409);
      }
    });

    it('rechaza OFICIAL → BORRADOR con 409 (retroceso de estado)', async () => {
      const doc = makeDoc({ estadoDocumento: EstadoDocumento.OFICIAL });
      mockRepo.findById.mockResolvedValue(doc);

      expect.assertions(2);
      try {
        await service.updateEstado(1, EstadoDocumento.BORRADOR);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(409);
      }
    });

    it('rechaza cualquier transición desde OBSOLETO con 409', async () => {
      const doc = makeDoc({ estadoDocumento: EstadoDocumento.OBSOLETO });
      mockRepo.findById.mockResolvedValue(doc);

      expect.assertions(3);
      try {
        await service.updateEstado(1, EstadoDocumento.BORRADOR);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(409);
        expect(err.getError().message).toContain('OBSOLETO');
      }
    });

    it('lanza 404 si el documento no existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      expect.assertions(2);
      try {
        await service.updateEstado(999, EstadoDocumento.OFICIAL);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });
  });

  // ─── Delegación al repositorio ───────────────────────────────────────────

  describe('findByRequerimiento()', () => {
    it('delega al repositorio y retorna sus resultados', async () => {
      const docs = [makeDoc(), makeDoc({ id: 2 })];
      mockRepo.findByRequerimiento.mockResolvedValue(docs);

      const result = await service.findByRequerimiento(1);

      expect(mockRepo.findByRequerimiento).toHaveBeenCalledWith(1);
      expect(result).toEqual(docs);
    });
  });

  describe('search()', () => {
    it('delega al repositorio con los filtros recibidos', async () => {
      const paginado = { data: [], total: 0 };
      mockRepo.search.mockResolvedValue(paginado);

      const result = await service.search({ q: 'contrato', page: 1, limit: 10 });

      expect(mockRepo.search).toHaveBeenCalledWith({ q: 'contrato', page: 1, limit: 10 });
      expect(result).toEqual(paginado);
    });
  });

  describe('getTree()', () => {
    it('delega al repositorio y retorna el árbol jerárquico', async () => {
      const tree = [{ contratistaId: 1, contratistaNombre: 'Empresa A' }];
      mockRepo.getTree.mockResolvedValue(tree);

      const result = await service.getTree();

      expect(mockRepo.getTree).toHaveBeenCalledTimes(1);
      expect(result).toEqual(tree);
    });
  });
});
