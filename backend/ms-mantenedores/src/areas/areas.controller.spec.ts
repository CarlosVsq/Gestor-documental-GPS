import { Test, TestingModule } from '@nestjs/testing';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

describe('AreasController', () => {
  let controller: AreasController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreasController],
      providers: [{ provide: AreasService, useValue: mockService }],
    }).compile();

    controller = module.get<AreasController>(AreasController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('delega al servicio y retorna el área creada', async () => {
      const dto = { nombre: 'Área de Ingeniería', contratistaId: 1 };
      const created = { id: 1, ...dto, activo: true };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('findAll()', () => {
    it('delega al servicio con page, limit y contratistaId opcional', async () => {
      const paginado = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(paginado);

      const result = await controller.findAll({ page: 1, limit: 10, contratistaId: 2 });

      expect(mockService.findAll).toHaveBeenCalledWith(1, 10, 2);
      expect(result).toEqual(paginado);
    });

    it('delega sin contratistaId cuando no se provee', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll({ page: 1, limit: 5 });

      expect(mockService.findAll).toHaveBeenCalledWith(1, 5, undefined);
    });
  });

  describe('findOne()', () => {
    it('delega al servicio con el id', async () => {
      const area = { id: 1, nombre: 'Área de Ingeniería' };
      mockService.findOne.mockResolvedValue(area);

      const result = await controller.findOne({ id: 1 });

      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(area);
    });
  });

  describe('update()', () => {
    it('delega al servicio con id y dto', async () => {
      const updated = { id: 1, nombre: 'Área Actualizada' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update({ id: 1, dto: { nombre: 'Área Actualizada' } });

      expect(mockService.update).toHaveBeenCalledWith(1, { nombre: 'Área Actualizada' });
      expect(result).toEqual(updated);
    });
  });

  describe('toggle()', () => {
    it('delega al servicio con el id y actualizadoPor opcional', async () => {
      mockService.toggle.mockResolvedValue({ activo: false });

      const result = await controller.toggle({ id: 1 });

      expect(mockService.toggle).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual({ activo: false });
    });
  });

  describe('getStats()', () => {
    it('retorna estadísticas filtradas por contratistaId', async () => {
      const stats = { total: 3, activos: 2, inactivos: 1 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats({ contratistaId: 1 });

      expect(mockService.getStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(stats);
    });

    it('retorna estadísticas globales cuando no se filtra por contratista', async () => {
      const stats = { total: 10, activos: 8, inactivos: 2 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats({});

      expect(mockService.getStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(stats);
    });
  });
});
