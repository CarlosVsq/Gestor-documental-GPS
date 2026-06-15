import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { SeaweedFsService } from './seaweedfs.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('form-data', () =>
  jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data; boundary=xxx' }),
  })),
);

import axios from 'axios';
const mockedAxios = axios as unknown as { post: jest.Mock; get: jest.Mock; delete: jest.Mock };

describe('SeaweedFsService', () => {
  let service: SeaweedFsService;

  beforeEach(async () => {
    process.env.SEAWEEDFS_FILER_URL = 'http://test-filer:8888';

    const module: TestingModule = await Test.createTestingModule({
      providers: [SeaweedFsService],
    }).compile();

    service = module.get<SeaweedFsService>(SeaweedFsService);
  });

  afterEach(() => {
    delete process.env.SEAWEEDFS_FILER_URL;
    jest.clearAllMocks();
  });

  // ─── uploadFile() ─────────────────────────────────────────────────────────

  describe('uploadFile()', () => {
    it('retorna el path completo y el nombre del archivo al subir correctamente', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201 });

      const result = await service.uploadFile('/1/2/3/REQ-001', 'archivo.pdf', Buffer.from('contenido'), 'application/pdf');

      expect(result.path).toBe('/1/2/3/REQ-001/archivo.pdf');
      expect(result.filename).toBe('archivo.pdf');
    });

    it('llama a axios.post con la URL correcta del Filer', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201 });

      await service.uploadFile('/1/2/3/REQ-001', 'doc.pdf', Buffer.from('data'), 'application/pdf');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-filer:8888/1/2/3/REQ-001/doc.pdf',
        expect.anything(),
        expect.objectContaining({ maxBodyLength: Infinity }),
      );
    });

    it('lanza RpcException 502 cuando SeaweedFS falla', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Connection refused'));

      expect.assertions(2);
      try {
        await service.uploadFile('/path', 'file.pdf', Buffer.from('data'), 'application/pdf');
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(502);
      }
    });
  });

  // ─── downloadFile() ───────────────────────────────────────────────────────

  describe('downloadFile()', () => {
    it('retorna buffer y contentType del archivo descargado', async () => {
      const fileContent = Buffer.from('pdf-bytes');
      mockedAxios.get.mockResolvedValue({
        data: fileContent,
        headers: { 'content-type': 'application/pdf' },
      });

      const result = await service.downloadFile('/1/2/3/REQ-001/archivo.pdf');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('application/pdf');
    });

    it('usa application/octet-stream como contentType por defecto si no viene en headers', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('data'),
        headers: {},
      });

      const result = await service.downloadFile('/path/file.bin');

      expect(result.contentType).toBe('application/octet-stream');
    });

    it('lanza RpcException 404 cuando el archivo no existe en SeaweedFS', async () => {
      mockedAxios.get.mockRejectedValue(new Error('404 Not Found'));

      expect.assertions(2);
      try {
        await service.downloadFile('/path/inexistente.pdf');
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect(err.getError().statusCode).toBe(404);
      }
    });
  });

  // ─── deleteFile() ─────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    it('llama a axios.delete con la URL correcta', async () => {
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await service.deleteFile('/1/2/3/REQ-001/archivo.pdf');

      expect(mockedAxios.delete).toHaveBeenCalledWith('http://test-filer:8888/1/2/3/REQ-001/archivo.pdf');
    });

    it('NO lanza excepción cuando el archivo ya no existe (idempotente)', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('404 Not Found'));

      await expect(service.deleteFile('/path/inexistente.pdf')).resolves.toBeUndefined();
    });
  });

  // ─── ensureDirectory() ────────────────────────────────────────────────────

  describe('ensureDirectory()', () => {
    it('realiza POST al directorio para crearlo en SeaweedFS', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201 });

      await service.ensureDirectory('/1/2/3/REQ-001');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-filer:8888/1/2/3/REQ-001/',
        '',
        expect.objectContaining({ headers: { 'Content-Type': 'application/octet-stream' } }),
      );
    });

    it('NO lanza excepción cuando el directorio ya existe', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Directory already exists'));

      await expect(service.ensureDirectory('/path/existing')).resolves.toBeUndefined();
    });
  });

  // ─── listDirectory() ──────────────────────────────────────────────────────

  describe('listDirectory()', () => {
    it('retorna el listado del directorio en formato JSON', async () => {
      const listing = { Entries: [{ FullPath: '/1/2/3/REQ-001/archivo.pdf' }] };
      mockedAxios.get.mockResolvedValue({ data: listing });

      const result = await service.listDirectory('/1/2/3/REQ-001');

      expect(result).toEqual(listing);
    });

    it('retorna {Entries:[]} cuando el directorio no existe o falla la llamada', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Not found'));

      const result = await service.listDirectory('/path/inexistente');

      expect(result).toEqual({ Entries: [] });
    });
  });
});
