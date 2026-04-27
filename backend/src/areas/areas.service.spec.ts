import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Area } from './area.entity';
import { Proyecto } from '../proyectos/proyecto.entity';
import { ContratistasService } from '../contratistas/contratistas.service';

/**
 * Test unitario del servicio de Áreas (HU-02)
 * Verifica la lógica de negocio del CRUD sin dependencia de la BD.
 */
describe('AreasService', () => {
    let service: AreasService;

    const mockAreaRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        softRemove: jest.fn(),
        count: jest.fn(),
    };

    const mockProyectoRepository = {
        count: jest.fn(),
    };

    const mockContratistasService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AreasService,
                {
                    provide: getRepositoryToken(Area),
                    useValue: mockAreaRepository,
                },
                {
                    provide: getRepositoryToken(Proyecto),
                    useValue: mockProyectoRepository,
                },
                {
                    provide: ContratistasService,
                    useValue: mockContratistasService,
                },
            ],
        }).compile();

        service = module.get<AreasService>(AreasService);
        jest.clearAllMocks();
    });

    it('debería estar definido', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto = {
            nombre: 'Área de Ingeniería',
            descripcion: 'Área de proyectos de ingeniería',
            contratistaId: 1,
        };

        it('debería crear un área exitosamente', async () => {
            const expected = { id: 1, ...createDto, activo: true, creadoPor: 'admin', actualizadoPor: 'admin' };
            mockContratistasService.findOne.mockResolvedValue({ id: 1, nombre: 'Contratista Test' });
            mockAreaRepository.findOne.mockResolvedValue(null); // No existe duplicada
            mockAreaRepository.create.mockReturnValue(expected);
            mockAreaRepository.save.mockResolvedValue(expected);

            const result = await service.create(createDto);

            expect(result).toEqual(expected);
            expect(mockContratistasService.findOne).toHaveBeenCalledWith(1);
            expect(mockAreaRepository.create).toHaveBeenCalledWith({
                ...createDto,
                creadoPor: 'admin',
                actualizadoPor: 'admin',
            });
        });

        it('debería lanzar NotFoundException si el contratista no existe', async () => {
            mockContratistasService.findOne.mockRejectedValue(
                new NotFoundException('Contratista con ID 999 no encontrado'),
            );

            await expect(service.create({ ...createDto, contratistaId: 999 }))
                .rejects.toThrow(NotFoundException);
        });

        it('debería lanzar ConflictException si ya existe un área con el mismo nombre para el contratista', async () => {
            mockContratistasService.findOne.mockResolvedValue({ id: 1 });
            mockAreaRepository.findOne.mockResolvedValue({ id: 2, nombre: createDto.nombre });

            await expect(service.create(createDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll', () => {
        it('debería retornar una lista paginada de áreas', async () => {
            const areas = [
                { id: 1, nombre: 'Área A', contratistaId: 1 },
                { id: 2, nombre: 'Área B', contratistaId: 1 },
            ];
            mockAreaRepository.findAndCount.mockResolvedValue([areas, 2]);

            const result = await service.findAll(1, 10);

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(mockAreaRepository.findAndCount).toHaveBeenCalledWith({
                relations: ['contratista'],
                skip: 0,
                take: 10,
                order: { creadoEn: 'DESC' },
            });
        });
    });

    describe('findOne', () => {
        it('debería retornar un área si existe', async () => {
            const area = { id: 1, nombre: 'Área Test', contratistaId: 1 };
            mockAreaRepository.findOne.mockResolvedValue(area);

            const result = await service.findOne(1);
            expect(result).toEqual(area);
        });

        it('debería lanzar NotFoundException si no existe', async () => {
            mockAreaRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('debería hacer soft delete si no tiene proyectos asociados', async () => {
            const area = { id: 1, nombre: 'Área Test', contratistaId: 1 };
            mockAreaRepository.findOne.mockResolvedValue(area);
            mockProyectoRepository.count.mockResolvedValue(0);
            mockAreaRepository.softRemove.mockResolvedValue(area);

            await service.remove(1);

            expect(mockProyectoRepository.count).toHaveBeenCalledWith({ where: { areaId: 1 } });
            expect(mockAreaRepository.softRemove).toHaveBeenCalledWith(area);
        });

        it('debería lanzar ConflictException si tiene proyectos asociados', async () => {
            const area = { id: 1, nombre: 'Área Test', contratistaId: 1 };
            mockAreaRepository.findOne.mockResolvedValue(area);
            mockProyectoRepository.count.mockResolvedValue(3);

            await expect(service.remove(1)).rejects.toThrow(ConflictException);
            expect(mockAreaRepository.softRemove).not.toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('debería retornar estadísticas correctas', async () => {
            mockAreaRepository.count
                .mockResolvedValueOnce(10)  // total
                .mockResolvedValueOnce(7);  // activas

            const result = await service.getStats();

            expect(result).toEqual({ total: 10, activas: 7, inactivas: 3 });
        });
    });
});
