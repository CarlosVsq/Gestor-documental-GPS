import { Test, TestingModule } from '@nestjs/testing';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';

describe('DocumentosController', () => {
  let controller: DocumentosController;

  const mockDocumentosService = {
    upload: jest.fn(),
    uploadBulk: jest.fn(),
    download: jest.fn(),
    findByRequerimiento: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    getTree: jest.fn(),
    delete: jest.fn(),
    updateEstado: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentosController],
      providers: [{ provide: DocumentosService, useValue: mockDocumentosService }],
    }).compile();

    controller = module.get<DocumentosController>(DocumentosController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('upload()', () => {
    it('delega el payload al servicio y retorna el documento creado', async () => {
      const payload = { nombre: 'plano.pdf', base64: 'abc==', requerimientoId: 1 };
      const expected = { id: 1, nombre: 'plano.pdf', estadoDocumento: 'BORRADOR' };
      mockDocumentosService.upload.mockResolvedValue(expected);

      const result = await controller.upload(payload as any);

      expect(mockDocumentosService.upload).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expected);
    });
  });

  describe('uploadBulk()', () => {
    it('delega el array de archivos al servicio', async () => {
      const payload = { files: [{ nombre: 'a.pdf', base64: 'a==' }, { nombre: 'b.pdf', base64: 'b==' }] };
      mockDocumentosService.uploadBulk.mockResolvedValue({ uploaded: 2, failed: 0 });

      await controller.uploadBulk(payload as any);

      expect(mockDocumentosService.uploadBulk).toHaveBeenCalledWith(payload);
    });
  });

  describe('download()', () => {
    it('delega el id al servicio y retorna base64 + contentType', async () => {
      const expected = { base64: 'abc==', contentType: 'application/pdf', nombre: 'plano.pdf' };
      mockDocumentosService.download.mockResolvedValue(expected);

      const result = await controller.download({ id: 3 });

      expect(mockDocumentosService.download).toHaveBeenCalledWith(3);
      expect(result).toEqual(expected);
    });
  });

  describe('findByRequerimiento()', () => {
    it('delega el requerimientoId al servicio', async () => {
      const docs = [{ id: 1 }, { id: 2 }];
      mockDocumentosService.findByRequerimiento.mockResolvedValue(docs);

      const result = await controller.findByRequerimiento({ requerimientoId: 7 });

      expect(mockDocumentosService.findByRequerimiento).toHaveBeenCalledWith(7);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne()', () => {
    it('delega el id al servicio', async () => {
      const doc = { id: 1, nombre: 'plano.pdf', estadoDocumento: 'OFICIAL' };
      mockDocumentosService.findOne.mockResolvedValue(doc);

      const result = await controller.findOne({ id: 1 });

      expect(mockDocumentosService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(doc);
    });
  });

  describe('search()', () => {
    it('delega los filtros de búsqueda al servicio', async () => {
      const filtros = { nombre: 'plano', estadoDocumento: 'OFICIAL' };
      const results = [{ id: 1, nombre: 'plano.pdf' }];
      mockDocumentosService.search.mockResolvedValue(results);

      const result = await controller.search(filtros as any);

      expect(mockDocumentosService.search).toHaveBeenCalledWith(filtros);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTree()', () => {
    it('retorna el árbol jerárquico completo', async () => {
      const tree = [{ contratista: 'Andes SA', areas: [] }];
      mockDocumentosService.getTree.mockResolvedValue(tree);

      const result = await controller.getTree();

      expect(mockDocumentosService.getTree).toHaveBeenCalled();
      expect(result).toEqual(tree);
    });
  });

  describe('delete()', () => {
    it('delega el id para soft-delete', async () => {
      mockDocumentosService.delete.mockResolvedValue({ id: 4, eliminadoEn: new Date() });

      await controller.delete({ id: 4 });

      expect(mockDocumentosService.delete).toHaveBeenCalledWith(4);
    });
  });

  describe('updateEstado()', () => {
    it('delega id y nuevo estado al servicio', async () => {
      mockDocumentosService.updateEstado.mockResolvedValue({ id: 2, estadoDocumento: 'OFICIAL' });

      await controller.updateEstado({ id: 2, estado: 'OFICIAL' });

      expect(mockDocumentosService.updateEstado).toHaveBeenCalledWith(2, 'OFICIAL');
    });
  });
});
