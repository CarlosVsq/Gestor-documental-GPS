import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { ContratistasService } from './contratistas.service';
import { Contratista } from './contratista.entity';

/**
 * Test unitario del servicio de Contratistas (HU-01)
 * Verifica la lógica de negocio del CRUD sin dependencia de la BD.
 */
describe('ContratistasService', () => {
  let service: ContratistasService;

  // Mock del repositorio TypeORM
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContratistasService,
        {
          provide: getRepositoryToken(Contratista),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContratistasService>(ContratistasService);

    // Limpiar mocks entre tests
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Constructora Sur SpA',
      rut: '76.123.456-7',
      email: 'contacto@constructorasur.cl',
      telefono: '+56912345678',
    };

    it('CA-1: debería crear un contratista exitosamente', async () => {
      const expected = { id: 1, ...createDto, activo: true, creadoPor: 'admin', actualizadoPor: 'admin' };
      mockRepository.findOne.mockResolvedValue(null); // No existe RUT duplicado
      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        creadoPor: 'admin',
        actualizadoPor: 'admin',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar RpcException si el RUT ya existe', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, rut: createDto.rut });

      await expect(service.create(createDto)).rejects.toThrow(RpcException);
    });
  });

  describe('findAll', () => {
    it('CA-2: debería retornar una lista paginada de contratistas', async () => {
      const contratistas = [
        { id: 1, nombre: 'Constructora A', rut: '76.111.111-1' },
        { id: 2, nombre: 'Constructora B', rut: '76.222.222-2' },
      ];
      mockRepository.findAndCount.mockResolvedValue([contratistas, 2]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { creadoEn: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar un contratista si existe', async () => {
      const contratista = { id: 1, nombre: 'Test', rut: '76.111.111-1' };
      mockRepository.findOne.mockResolvedValue(contratista);

      const result = await service.findOne(1);
      expect(result).toEqual(contratista);
    });

    it('debería lanzar RpcException si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(RpcException);
    });
  });

  describe('remove', () => {
    it('CA-4: debería hacer soft delete de un contratista', async () => {
      const contratista = { id: 1, nombre: 'Test', rut: '76.111.111-1' };
      mockRepository.findOne.mockResolvedValue(contratista);
      mockRepository.softRemove.mockResolvedValue(contratista);

      await service.remove(1);

      expect(mockRepository.softRemove).toHaveBeenCalledWith(contratista);
    });
  });

  describe('getStats', () => {
    it('debería retornar estadísticas correctas', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(7);  // activos

      const result = await service.getStats();

      expect(result).toEqual({ total: 10, activos: 7, inactivos: 3 });
    });
  });
});
