import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { CategoriasService } from './categorias.service';
import { Categoria } from './categoria.entity';
import { Subtipo } from '../subtipos/subtipo.entity';

/**
 * Test unitario del servicio de Categorías (HU-04)
 * Verifica la lógica de negocio del CRUD sin dependencia de la BD.
 */
describe('CategoriasService', () => {
  let service: CategoriasService;

  const mockCategoriaRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockSubtipoRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        { provide: getRepositoryToken(Categoria), useValue: mockCategoriaRepo },
        { provide: getRepositoryToken(Subtipo), useValue: mockSubtipoRepo },
      ],
    }).compile();

    service = module.get<CategoriasService>(CategoriasService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────
  describe('create', () => {
    const createDto = { nombre: 'Seguridad', descripcion: 'Categoría de seguridad' };

    it('CA-1: debería crear una categoría exitosamente', async () => {
      const expected = { id: 1, ...createDto, activo: true, creadoPor: 'admin', actualizadoPor: 'admin' };
      mockCategoriaRepo.findOne.mockResolvedValue(null);
      mockCategoriaRepo.create.mockReturnValue(expected);
      mockCategoriaRepo.save.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
      expect(mockCategoriaRepo.create).toHaveBeenCalledWith({
        ...createDto,
        creadoPor: 'admin',
        actualizadoPor: 'admin',
      });
      expect(mockCategoriaRepo.save).toHaveBeenCalled();
    });

    it('debería lanzar RpcException si el nombre ya existe (409)', async () => {
      mockCategoriaRepo.findOne.mockResolvedValue({ id: 1, nombre: createDto.nombre });

      await expect(service.create(createDto)).rejects.toThrow(RpcException);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────
  describe('findAll', () => {
    it('CA-2: debería retornar una lista paginada', async () => {
      const data = [
        { id: 1, nombre: 'Seguridad' },
        { id: 2, nombre: 'Calidad' },
      ];
      mockCategoriaRepo.findAndCount.mockResolvedValue([data, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockCategoriaRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { creadoEn: 'DESC' },
      });
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────
  describe('findOne', () => {
    it('debería retornar una categoría si existe', async () => {
      const categoria = { id: 1, nombre: 'Seguridad' };
      mockCategoriaRepo.findOne.mockResolvedValue(categoria);

      expect(await service.findOne(1)).toEqual(categoria);
    });

    it('debería lanzar RpcException si no existe (404)', async () => {
      mockCategoriaRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(RpcException);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────
  describe('update', () => {
    it('debería actualizar el nombre de una categoría', async () => {
      const existing = { id: 1, nombre: 'Seguridad', actualizadoPor: 'admin' };
      mockCategoriaRepo.findOne
        .mockResolvedValueOnce(existing)   // findOne dentro de update
        .mockResolvedValueOnce(null);      // chequeo de duplicados

      const updated = { ...existing, nombre: 'Seguridad Industrial' };
      mockCategoriaRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { nombre: 'Seguridad Industrial' });
      expect(result.nombre).toBe('Seguridad Industrial');
    });

    it('debería lanzar 409 si el nuevo nombre ya existe en otra categoría', async () => {
      const existing = { id: 1, nombre: 'Seguridad' };
      mockCategoriaRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 2, nombre: 'Calidad' }); // otra cat con ese nombre

      await expect(service.update(1, { nombre: 'Calidad' })).rejects.toThrow(RpcException);
    });
  });

  // ─── TOGGLE ───────────────────────────────────────────────
  describe('toggle', () => {
    it('debería alternar el estado de una categoría sin subtipos', async () => {
      const existing = { id: 1, nombre: 'Seguridad', activo: true, actualizadoPor: 'admin' };
      mockCategoriaRepo.findOne.mockResolvedValue(existing);
      mockSubtipoRepo.count.mockResolvedValue(0);
      mockCategoriaRepo.save.mockResolvedValue({ ...existing, activo: false });

      const result = await service.toggle(1);
      expect(result).toEqual({ activo: false });
    });

    it('debería lanzar 409 si la categoría tiene subtipos asociados', async () => {
      const existing = { id: 1, nombre: 'Seguridad', activo: true };
      mockCategoriaRepo.findOne.mockResolvedValue(existing);
      mockSubtipoRepo.count.mockResolvedValue(3);

      await expect(service.toggle(1)).rejects.toThrow(RpcException);
    });
  });
});
