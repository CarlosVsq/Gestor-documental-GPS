import { Test, TestingModule } from '@nestjs/testing';
import { ExpedientesService } from './expedientes.service';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';

describe('ExpedientesService', () => {
  let service: ExpedientesService;
  let mockSeaweed: jest.Mocked<SeaweedFsService>;

  beforeEach(async () => {
    mockSeaweed = {
      uploadFile: jest.fn(),
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
      ensureDirectory: jest.fn().mockResolvedValue(undefined),
      listDirectory: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpedientesService,
        { provide: SeaweedFsService, useValue: mockSeaweed },
      ],
    }).compile();

    service = module.get<ExpedientesService>(ExpedientesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── createExpediente() ───────────────────────────────────────────────────

  describe('createExpediente()', () => {
    const params = {
      contratistaId: 1,
      areaId: 2,
      proyectoId: 3,
      codigoTicket: 'REQ-2026-0001',
    };

    it('construye el storagePath con la convención /{contratista}/{area}/{proyecto}/{ticket}', async () => {
      const result = await service.createExpediente(params);

      expect(result).toBe('/1/2/3/REQ-2026-0001');
    });

    it('llama a ensureDirectory con el path construido', async () => {
      await service.createExpediente(params);

      expect(mockSeaweed.ensureDirectory).toHaveBeenCalledWith('/1/2/3/REQ-2026-0001');
      expect(mockSeaweed.ensureDirectory).toHaveBeenCalledTimes(1);
    });

    it('retorna el storagePath correcto que debe guardarse en el requerimiento', async () => {
      const custom = { contratistaId: 10, areaId: 20, proyectoId: 30, codigoTicket: 'CONST-001' };

      const result = await service.createExpediente(custom);

      expect(result).toBe('/10/20/30/CONST-001');
    });

    it('maneja correctamente IDs de un solo dígito', async () => {
      const result = await service.createExpediente({ contratistaId: 1, areaId: 1, proyectoId: 1, codigoTicket: 'A-001' });

      expect(result).toBe('/1/1/1/A-001');
    });
  });
});
