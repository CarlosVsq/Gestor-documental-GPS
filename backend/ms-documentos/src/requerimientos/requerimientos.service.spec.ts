import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { RequerimientosService } from './requerimientos.service';
import { Requerimiento, EstadoRequerimiento } from './requerimiento.entity';

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequerimientosService,
        { provide: getRepositoryToken(Requerimiento), useValue: mockRepository },
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

      await service.findAll(1, 10, 5);

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
  });
});
