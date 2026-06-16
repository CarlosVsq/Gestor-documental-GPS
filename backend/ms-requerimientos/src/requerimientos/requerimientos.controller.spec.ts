import { Test, TestingModule } from '@nestjs/testing';
import { RequerimientosController } from './requerimientos.controller';
import { RequerimientosService } from './requerimientos.service';
import { EstadoRequerimiento } from './requerimiento.entity';

describe('RequerimientosController', () => {
  let controller: RequerimientosController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateState: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequerimientosController],
      providers: [{ provide: RequerimientosService, useValue: mockService }],
    }).compile();

    controller = module.get<RequerimientosController>(RequerimientosController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('delega el DTO al servicio y retorna el requerimiento creado', async () => {
      const dto = { titulo: 'Test', proyectoId: 1, areaId: 1, contratistaId: 1, categoriaId: 1, subtipoId: 1 };
      const expected = { id: 1, ...dto, estado: EstadoRequerimiento.ABIERTO };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
      expect(result.estado).toBe('Abierto');
    });
  });

  describe('findAll()', () => {
    it('delega page, limit y filtros al servicio', async () => {
      const expected = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({ page: 2, limit: 5, filtros: { estado: 'Abierto' } });

      expect(mockService.findAll).toHaveBeenCalledWith(2, 5, { estado: 'Abierto' });
      expect(result).toEqual(expected);
    });

    it('maneja payload sin filtros (valores undefined)', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll({});

      expect(mockService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('findOne()', () => {
    it('delega el id al servicio', async () => {
      const expected = { id: 7, titulo: 'Req Alpha', estado: EstadoRequerimiento.ABIERTO };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(7);

      expect(mockService.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(expected);
    });
  });

  describe('updateState()', () => {
    it('delega id y updateDto al servicio', async () => {
      const updateDto = { estado: EstadoRequerimiento.EN_PROGRESO };
      const expected = { id: 3, estado: EstadoRequerimiento.EN_PROGRESO };
      mockService.updateState.mockResolvedValue(expected);

      const result = await controller.updateState({ id: 3, updateDto });

      expect(mockService.updateState).toHaveBeenCalledWith(3, updateDto);
      expect(result.estado).toBe('En Progreso');
    });
  });
});
