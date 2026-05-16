import { Test, TestingModule } from '@nestjs/testing';
import { ContratistasController } from './contratistas.controller';
import { ContratistasService } from './contratistas.service';

describe('ContratistasController', () => {
  let controller: ContratistasController;

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
      controllers: [ContratistasController],
      providers: [{ provide: ContratistasService, useValue: mockService }],
    }).compile();

    controller = module.get<ContratistasController>(ContratistasController);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('delega al servicio y retorna el contratista creado', async () => {
      const dto = { nombre: 'Constructora Andes', rut: '76.123.456-7', email: 'contacto@andes.cl' };
      const created = { id: 1, ...dto, activo: true };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('findAll()', () => {
    it('delega al servicio con page y limit', async () => {
      const paginado = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(paginado);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(mockService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(paginado);
    });
  });

  describe('findOne()', () => {
    it('delega al servicio con el id', async () => {
      const contratista = { id: 1, nombre: 'Constructora Andes' };
      mockService.findOne.mockResolvedValue(contratista);

      const result = await controller.findOne({ id: 1 });

      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(contratista);
    });
  });

  describe('update()', () => {
    it('delega al servicio con id y dto', async () => {
      const updated = { id: 1, nombre: 'Constructora Actualizada' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update({ id: 1, dto: { nombre: 'Constructora Actualizada' } });

      expect(mockService.update).toHaveBeenCalledWith(1, { nombre: 'Constructora Actualizada' });
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
    it('retorna estadísticas globales', async () => {
      const stats = { total: 5, activos: 4, inactivos: 1 };
      mockService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(mockService.getStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });
});
