import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { PdfService } from './pdf.service';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';
import { DocumentosService } from '../documentos/documentos.service';
import { EstadoDocumento } from '../common/constants';
import { Documento } from '../documentos/entities/documento.entity';

const mockPage = {
  getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }),
  drawRectangle: jest.fn(),
  drawText: jest.fn(),
  drawImage: jest.fn(),
};

const mockPdfDoc = {
  addPage: jest.fn().mockReturnValue(mockPage),
  embedFont: jest.fn().mockResolvedValue({}),
  embedPng: jest.fn().mockResolvedValue({
    scale: jest.fn().mockReturnValue({ width: 100, height: 50 }),
  }),
  getPages: jest.fn().mockReturnValue([mockPage]),
  save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
};

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockImplementation(() => Promise.resolve(mockPdfDoc)),
    load: jest.fn().mockImplementation(() => Promise.resolve(mockPdfDoc)),
  },
  rgb: jest.fn(() => ({ r: 0, g: 0, b: 0 })),
  StandardFonts: {
    HelveticaBold: 'HelveticaBold',
    Helvetica: 'Helvetica',
  },
  degrees: jest.fn(),
}));

const makeDoc = (overrides: Partial<Documento> = {}): Documento =>
  ({
    id: 1,
    nombreOriginal: 'contrato.pdf',
    nombreStorage: '1234-abc.pdf',
    pathSeaweed: '/1/2/3/REQ-001/1234-abc.pdf',
    mimeType: 'application/pdf',
    tamañoBytes: 2048,
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

const mockReqData = {
  id: 1,
  codigoTicket: 'REQ-2026-0001',
  titulo: 'Requerimiento de prueba',
  descripcion: 'Descripción de prueba',
  estado: 'Cerrado',
  prioridad: 'Alta',
  contratistaId: 1,
  contratistaNombre: 'Empresa A',
  areaId: 2,
  areaNombre: 'Área de Construcción',
  proyectoId: 3,
  proyectoNombre: 'Proyecto X',
  categoriaId: 4,
  categoriaNombre: 'Categoría Y',
  creadoEn: new Date('2026-01-01'),
  fechaCierre: new Date('2026-05-15'),
};

describe('PdfService', () => {
  let service: PdfService;
  let mockSeaweed: jest.Mocked<SeaweedFsService>;
  let mockDocumentosService: jest.Mocked<DocumentosService>;
  let mockDataSource: { query: jest.Mock };

  beforeEach(async () => {
    mockSeaweed = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
      ensureDirectory: jest.fn(),
      listDirectory: jest.fn(),
    } as any;

    mockDocumentosService = {
      upload: jest.fn(),
      findOne: jest.fn(),
      findByRequerimiento: jest.fn(),
      download: jest.fn(),
      uploadBulk: jest.fn(),
      delete: jest.fn(),
      updateEstado: jest.fn(),
      search: jest.fn(),
      getTree: jest.fn(),
      countByRequerimiento: jest.fn(),
    } as any;

    mockDataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        { provide: SeaweedFsService, useValue: mockSeaweed },
        { provide: DocumentosService, useValue: mockDocumentosService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── firmarDocumento() ────────────────────────────────────────────────────

  describe('firmarDocumento()', () => {
    const firmarParams = {
      documentoId: 1,
      firmaBase64: Buffer.from('fake-png').toString('base64'),
      firmadoPorId: 5,
    };

    it('lanza 400 si el documento no es PDF', async () => {
      mockDocumentosService.findOne.mockResolvedValue(makeDoc({ mimeType: 'image/png' }));

      expect.assertions(2);
      try {
        await service.firmarDocumento(firmarParams);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(400);
      }
    });

    it('lanza 400 si firmaBase64 está vacío', async () => {
      mockDocumentosService.findOne.mockResolvedValue(makeDoc());

      expect.assertions(2);
      try {
        await service.firmarDocumento({ ...firmarParams, firmaBase64: '' });
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(400);
      }
    });

    it('retorna pdfBase64, filename con sufijo _firmado y sha256Hash en happy path', async () => {
      const doc = makeDoc({ nombreOriginal: 'contrato.pdf' });
      mockDocumentosService.findOne.mockResolvedValue(doc);
      mockSeaweed.downloadFile.mockResolvedValue({
        buffer: Buffer.from('original-pdf'),
        contentType: 'application/pdf',
      });

      const result = await service.firmarDocumento(firmarParams);

      expect(result.filename).toBe('contrato_firmado.pdf');
      expect(result.pdfBase64).toBeDefined();
      expect(typeof result.pdfBase64).toBe('string');
      expect(result.sha256Hash).toHaveLength(64);
    });

    it('descarga el PDF original antes de firmar', async () => {
      const doc = makeDoc();
      mockDocumentosService.findOne.mockResolvedValue(doc);
      mockSeaweed.downloadFile.mockResolvedValue({
        buffer: Buffer.from('original-pdf'),
        contentType: 'application/pdf',
      });

      await service.firmarDocumento(firmarParams);

      expect(mockSeaweed.downloadFile).toHaveBeenCalledWith(doc.pathSeaweed);
    });

    it('NO sube el documento firmado a SeaweedFS (solo retorna para descarga directa)', async () => {
      const doc = makeDoc();
      mockDocumentosService.findOne.mockResolvedValue(doc);
      mockSeaweed.downloadFile.mockResolvedValue({
        buffer: Buffer.from('original-pdf'),
        contentType: 'application/pdf',
      });

      await service.firmarDocumento(firmarParams);

      expect(mockSeaweed.uploadFile).not.toHaveBeenCalled();
    });

    it('limpia el prefijo data:image/...;base64, de firmaBase64 antes de procesar', async () => {
      const doc = makeDoc();
      mockDocumentosService.findOne.mockResolvedValue(doc);
      mockSeaweed.downloadFile.mockResolvedValue({
        buffer: Buffer.from('original-pdf'),
        contentType: 'application/pdf',
      });
      const firmaConPrefijo = `data:image/png;base64,${Buffer.from('firma-png').toString('base64')}`;

      await expect(service.firmarDocumento({ ...firmarParams, firmaBase64: firmaConPrefijo })).resolves.toBeDefined();
    });
  });

  // ─── generateCierrePdf() ──────────────────────────────────────────────────

  describe('generateCierrePdf()', () => {
    const generateParams = {
      requerimientoId: 1,
      firmadoPorId: 5,
      storagePath: '/1/2/3/REQ-001',
    };

    it('lanza 404 si el requerimiento no existe', async () => {
      mockDataSource.query.mockResolvedValueOnce([]); // SELECT retorna vacío

      expect.assertions(2);
      try {
        await service.generateCierrePdf(generateParams);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });

    it('genera el PDF, lo sube a SeaweedFS y lo registra como documento', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([mockReqData])   // SELECT requerimiento
        .mockResolvedValueOnce([]);              // UPDATE estado OFICIAL
      mockDocumentosService.findByRequerimiento.mockResolvedValue([]);
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/1/2/3/REQ-001/cierre.pdf', filename: 'cierre.pdf' });
      mockDocumentosService.upload.mockResolvedValue(makeDoc({ id: 42 }));

      const result = await service.generateCierrePdf(generateParams);

      expect(mockSeaweed.uploadFile).toHaveBeenCalledTimes(1);
      expect(mockDocumentosService.upload).toHaveBeenCalledTimes(1);
      expect(result.documentoId).toBe(42);
      expect(result.sha256Hash).toHaveLength(64);
    });

    it('incluye documentos adjuntos al generar el PDF', async () => {
      const docAdjunto = makeDoc({ nombreOriginal: 'plano.pdf', mimeType: 'application/pdf' });
      mockDataSource.query
        .mockResolvedValueOnce([mockReqData])
        .mockResolvedValueOnce([]);
      mockDocumentosService.findByRequerimiento.mockResolvedValue([docAdjunto]);
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/cierre.pdf', filename: 'cierre.pdf' });
      mockDocumentosService.upload.mockResolvedValue(makeDoc({ id: 10 }));

      const result = await service.generateCierrePdf(generateParams);

      expect(mockDocumentosService.findByRequerimiento).toHaveBeenCalledWith(1);
      expect(result.documentoId).toBe(10);
    });

    it('actualiza el estadoDocumento a OFICIAL usando dataSource.query después de registrar', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([mockReqData])
        .mockResolvedValueOnce([]);
      mockDocumentosService.findByRequerimiento.mockResolvedValue([]);
      mockSeaweed.uploadFile.mockResolvedValue({ path: '/path/cierre.pdf', filename: 'cierre.pdf' });
      mockDocumentosService.upload.mockResolvedValue(makeDoc({ id: 99 }));

      await service.generateCierrePdf(generateParams);

      // Segunda llamada al dataSource.query es el UPDATE de estado
      const updateCall = mockDataSource.query.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE documentos');
      expect(updateCall[1]).toContain(EstadoDocumento.OFICIAL);
    });
  });
});
