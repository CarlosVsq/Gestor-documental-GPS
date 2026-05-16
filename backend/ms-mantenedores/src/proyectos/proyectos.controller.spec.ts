import { Test, TestingModule } from '@nestjs/testing';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';

describe('ProyectosController', () => {
  let controller: ProyectosController;

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
      controllers: [ProyectosController],
      providers: [{ provide: ProyectosService, useValue: mockService }],
    }).compile();

    controller = module.get<ProyectosController>(ProyectosController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('delega al servicio y retorna el proyecto creado', async () => {
      const dto = {
        nombre: 'Puente Norte',
        areaId: 1,
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
        estadoProyecto: 'Ejecución',
      };
      const created = { id: 1, ...dto, codigo: 'ING-001', activo: true };
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

      const result = await controller.findAll({ page: 2, limit: 5, contratistaId: 3 });

      expect(mockService.findAll).toHaveBeenCalledWith(2, 5, 3);
      expect(result).toEqual(paginado);
    });

    it('delega sin contratistaId cuando no se provee', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll({ page: 1, limit: 10 });

      expect(mockService.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('findOne()', () => {
    it('delega al servicio con el id', async () => {
      const proyecto = { id: 1, nombre: 'Puente Norte', codigo: 'ING-001' };
      mockService.findOne.mockResolvedValue(proyecto);

      const result = await controller.findOne({ id: 1 });

      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(proyecto);
    });
  });

  describe('update()', () => {
    it('delega al servicio con id y dto', async () => {
      const updated = { id: 1, nombre: 'Puente Actualizado' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update({ id: 1, dto: { nombre: 'Puente Actualizado' } });

      expect(mockService.update).toHaveBeenCalledWith(1, { nombre: 'Puente Actualizado' });
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
      const stats = { total: 8, activos: 6, inactivos: 2 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats({ contratistaId: 1 });

      expect(mockService.getStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(stats);
    });

    it('retorna estadísticas globales sin filtro', async () => {
      const stats = { total: 20, activos: 15, inactivos: 5 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats({});

      expect(mockService.getStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(stats);
    });
  });
});
