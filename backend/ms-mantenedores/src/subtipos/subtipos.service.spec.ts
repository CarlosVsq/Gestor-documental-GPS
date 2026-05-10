import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { SubtiposService } from './subtipos.service';
import { Subtipo } from './subtipo.entity';
import { Categoria } from '../categorias/categoria.entity';

/**
 * Test unitario del servicio de Subtipos (HU-05)
 * Verifica la lógica de negocio del CRUD sin dependencia de la BD.
 */
describe('SubtiposService', () => {
  let service: SubtiposService;

  const mockSubtipoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockCategoriaRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubtiposService,
        { provide: getRepositoryToken(Subtipo), useValue: mockSubtipoRepo },
        { provide: getRepositoryToken(Categoria), useValue: mockCategoriaRepo },
      ],
    }).compile();

    service = module.get<SubtiposService>(SubtiposService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ─── CREATE ───────────────────────────────────────────────
  describe('create', () => {
    const createDto = { nombre: 'Charla Diaria', descripcion: 'Charlas de 5 minutos', categoriaId: 1 };

    it('CA-1: debería crear un subtipo exitosamente', async () => {
      const expected = { id: 1, ...createDto, activo: true };
      mockCategoriaRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Seguridad' }); // Categoría existe
      mockSubtipoRepo.findOne.mockResolvedValue(null); // No hay duplicado
      mockSubtipoRepo.create.mockReturnValue(expected);
      mockSubtipoRepo.save.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
      expect(mockCategoriaRepo.findOne).toHaveBeenCalled();
    });

    it('debería lanzar 404 si la categoría padre no existe', async () => {
      mockCategoriaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(RpcException);
    });

    it('debería lanzar 409 si ya existe un subtipo con el mismo nombre en la misma categoría', async () => {
      mockCategoriaRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Seguridad' });
      mockSubtipoRepo.findOne.mockResolvedValue({ id: 99, nombre: createDto.nombre, categoriaId: 1 });

      await expect(service.create(createDto)).rejects.toThrow(RpcException);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────
  describe('findAll', () => {
    it('CA-2: debería retornar lista paginada de subtipos', async () => {
      const data = [
        { id: 1, nombre: 'Charla Diaria', categoriaId: 1 },
        { id: 2, nombre: 'Inducción', categoriaId: 1 },
      ];
      mockSubtipoRepo.findAndCount.mockResolvedValue([data, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('debería filtrar por categoriaId si se proporciona', async () => {
      mockSubtipoRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, 10, 1);

      expect(mockSubtipoRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { categoriaId: 1 } }),
      );
    });
  });

  // ─── FIND ONE ─────────────────────────────────────────────
  describe('findOne', () => {
    it('debería retornar un subtipo si existe', async () => {
      const subtipo = { id: 1, nombre: 'Charla Diaria', categoriaId: 1 };
      mockSubtipoRepo.findOne.mockResolvedValue(subtipo);

      expect(await service.findOne(1)).toEqual(subtipo);
    });

    it('debería lanzar 404 si no existe', async () => {
      mockSubtipoRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(RpcException);
    });
  });

  // ─── TOGGLE ───────────────────────────────────────────────
  describe('toggle', () => {
    it('debería alternar el estado activo/inactivo', async () => {
      const existing = { id: 1, nombre: 'Charla Diaria', activo: true, actualizadoPor: 'admin' };
      mockSubtipoRepo.findOne.mockResolvedValue(existing);
      mockSubtipoRepo.save.mockResolvedValue({ ...existing, activo: false });

      const result = await service.toggle(1);
      expect(result).toEqual({ activo: false });
    });
  });
});
