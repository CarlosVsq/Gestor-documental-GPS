import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { RequerimientosService } from './requerimientos.service';
import { Requerimiento, EstadoRequerimiento } from './requerimiento.entity';
import { ALMACENAMIENTO_CLIENT, ALMACENAMIENTO_PATTERNS } from '../common/constants';

/**
 * Test unitario del servicio de Requerimientos (HU-N1, HU-N2)
 * Verifica creación con estado "Abierto" y validaciones de transición de estados.
 */
describe('RequerimientosService', () => {
  let service: RequerimientosService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockAlmacenamientoClient = {
    send: jest.fn().mockImplementation((pattern: string) => {
      // El create() del service llama a expediente.create con .subscribe() (fire-and-forget).
      if (pattern === ALMACENAMIENTO_PATTERNS.CREATE_EXPEDIENTE) {
        return { subscribe: jest.fn() };
      }
      // Default para findByRequerimiento (HU-N7): devolvemos lista con 1 documento.
      // Cada test puede sobreescribir esto con mockReturnValueOnce.
      return of([{ id: 1, requerimientoId: 1 }]);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequerimientosService,
        { provide: getRepositoryToken(Requerimiento), useValue: mockRepository },
        { provide: ALMACENAMIENTO_CLIENT, useValue: mockAlmacenamientoClient },
      ],
    }).compile();

    service = module.get<RequerimientosService>(RequerimientosService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────
  describe('create', () => {
    const createDto = {
      titulo: 'Aprobación de Planos',
      descripcion: 'Requerimiento para aprobación de planos estructurales',
      proyectoId: 1,
      areaId: 1,
      contratistaId: 1,
      categoriaId: 1,
      subtipoId: 1,
    };

    it('HU-N1: debería crear un requerimiento con estado ABIERTO', async () => {
      const expected = { id: 1, ...createDto, estado: EstadoRequerimiento.ABIERTO };
      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result.estado).toBe(EstadoRequerimiento.ABIERTO);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          estado: EstadoRequerimiento.ABIERTO,
        }),
      );
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────
  describe('findAll', () => {
    it('debería retornar una lista paginada', async () => {
      const data = [
        { id: 1, titulo: 'Req A', estado: EstadoRequerimiento.ABIERTO },
        { id: 2, titulo: 'Req B', estado: EstadoRequerimiento.EN_PROGRESO },
      ];
      mockRepository.findAndCount.mockResolvedValue([data, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('debería filtrar por contratistaId', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 10, { contratistaId: 5 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { contratistaId: 5 } }),
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────
  describe('findOne', () => {
    it('debería retornar un requerimiento si existe', async () => {
      const req = { id: 1, titulo: 'Req A' };
      mockRepository.findOne.mockResolvedValue(req);

      expect(await service.findOne(1)).toEqual(req);
    });

    it('debería lanzar 404 si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(RpcException);
    });
  });

  // ─── UPDATE STATE ─────────────────────────────────────────
  describe('updateState', () => {
    it('HU-N2: debería permitir cambiar de ABIERTO a EN_PROGRESO', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.ABIERTO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue({ ...req, estado: EstadoRequerimiento.EN_PROGRESO });

      const result = await service.updateState(1, { estado: EstadoRequerimiento.EN_PROGRESO });
      expect(result.estado).toBe(EstadoRequerimiento.EN_PROGRESO);
    });

    it('HU-N2: debería permitir cambiar de EN_PROGRESO a CERRADO', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.EN_PROGRESO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue({ ...req, estado: EstadoRequerimiento.CERRADO });

      const result = await service.updateState(1, { estado: EstadoRequerimiento.CERRADO });
      expect(result.estado).toBe(EstadoRequerimiento.CERRADO);
    });

    it('HU-N2: NO debería permitir reabrir un requerimiento CERRADO', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.CERRADO };
      mockRepository.findOne.mockResolvedValue(req);

      await expect(
        service.updateState(1, { estado: EstadoRequerimiento.ABIERTO }),
      ).rejects.toThrow(RpcException);
    });

    it('debería permitir mantener estado CERRADO sin error', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.CERRADO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue(req);

      const result = await service.updateState(1, { estado: EstadoRequerimiento.CERRADO });
      expect(result.estado).toBe(EstadoRequerimiento.CERRADO);
    });

    // ─── HU-19: no cerrar con documentos PDF sin firmar ──────────
    it('HU-19: debería bloquear el cierre si hay un PDF sin firmar', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.EN_PROGRESO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockAlmacenamientoClient.send.mockReturnValueOnce(
        of([{ id: 9, nombreOriginal: 'contrato.pdf', mimeType: 'application/pdf', firmadoEn: null }]),
      );

      await expect(
        service.updateState(1, { estado: EstadoRequerimiento.CERRADO }),
      ).rejects.toThrow(RpcException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('HU-19: debería permitir cerrar si todos los PDFs están firmados', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.EN_PROGRESO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue({ ...req, estado: EstadoRequerimiento.CERRADO });
      mockAlmacenamientoClient.send.mockReturnValueOnce(
        of([{ id: 9, nombreOriginal: 'contrato.pdf', mimeType: 'application/pdf', firmadoEn: new Date() }]),
      );

      const result = await service.updateState(1, { estado: EstadoRequerimiento.CERRADO });
      expect(result.estado).toBe(EstadoRequerimiento.CERRADO);
    });

    it('HU-19: documentos no-PDF (imágenes) no bloquean el cierre', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.EN_PROGRESO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue({ ...req, estado: EstadoRequerimiento.CERRADO });
      mockAlmacenamientoClient.send.mockReturnValueOnce(
        of([{ id: 9, nombreOriginal: 'foto.png', mimeType: 'image/png', firmadoEn: null }]),
      );

      const result = await service.updateState(1, { estado: EstadoRequerimiento.CERRADO });
      expect(result.estado).toBe(EstadoRequerimiento.CERRADO);
    });

    // ─── HU-N7: validación de expediente para EN_PROGRESO ────────
    it('HU-N7: debería bloquear el paso a EN_PROGRESO si el expediente está vacío', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.ABIERTO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockAlmacenamientoClient.send.mockReturnValueOnce(of([]));

      await expect(
        service.updateState(1, { estado: EstadoRequerimiento.EN_PROGRESO }),
      ).rejects.toThrow(RpcException);

      expect(mockAlmacenamientoClient.send).toHaveBeenCalledWith(
        ALMACENAMIENTO_PATTERNS.FIND_BY_REQUERIMIENTO,
        { requerimientoId: 1 },
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('HU-N7: NO debería consultar documentos si ya estaba en EN_PROGRESO', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.EN_PROGRESO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockRepository.save.mockResolvedValue(req);

      await service.updateState(1, { estado: EstadoRequerimiento.EN_PROGRESO });

      expect(mockAlmacenamientoClient.send).not.toHaveBeenCalledWith(
        ALMACENAMIENTO_PATTERNS.FIND_BY_REQUERIMIENTO,
        expect.anything(),
      );
    });

    it('HU-N7: debería responder error si almacenamiento no está disponible', async () => {
      const req = { id: 1, estado: EstadoRequerimiento.ABIERTO, actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(req);
      mockAlmacenamientoClient.send.mockReturnValueOnce(throwError(() => new Error('TCP down')));

      await expect(
        service.updateState(1, { estado: EstadoRequerimiento.EN_PROGRESO }),
      ).rejects.toThrow(RpcException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─── HU-23: getStats ──────────────────────────────────────
  describe('getStats', () => {
    it('devuelve conteos por estado, estancados y 8 puntos de tendencia', async () => {
      // 5 counts base (total, abiertos, enProgreso, cerrados, estancados) +
      // 16 counts de tendencia (8 semanas x 2). mockResolvedValue cubre todos.
      mockRepository.count.mockResolvedValue(3);

      const stats = await service.getStats();

      expect(stats).toMatchObject({
        total: 3,
        abiertos: 3,
        enProgreso: 3,
        cerrados: 3,
        estancados: 3,
      });
      expect(stats.tendencia).toHaveLength(8);
      expect(stats.tendencia[0]).toHaveProperty('semana');
      expect(stats.tendencia[0]).toHaveProperty('creados');
      expect(stats.tendencia[0]).toHaveProperty('cerrados');
      // 5 conteos base + 16 de tendencia
      expect(mockRepository.count).toHaveBeenCalledTimes(21);
    });

    it('propaga el filtro de contratista a los conteos', async () => {
      mockRepository.count.mockResolvedValue(0);
      await service.getStats({ contratistaId: 7 });
      expect(mockRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contratistaId: 7 }),
        }),
      );
    });
  });
});
