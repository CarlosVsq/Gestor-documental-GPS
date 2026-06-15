import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
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
            codigoArea: 'ING',
            descripcion: 'Área de proyectos de ingeniería',
            contratistaId: 1,
        };

        it('debería crear un área exitosamente', async () => {
            const now = new Date();
            const expected = {
                id: 1,
                ...createDto,
                codigoArea: null,
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                contratista: { id: 1, nombre: 'Contratista Test' },
                proyectos: [],
            };
            mockContratistasService.findOne.mockResolvedValue({ id: 1, nombre: 'Contratista Test' });
            mockAreaRepository.findOne.mockResolvedValue(null); // No existe duplicada
            mockAreaRepository.create.mockReturnValue(expected);
            mockAreaRepository.save.mockResolvedValue(expected);

            const result = await service.create(createDto);

            expect(result).toEqual(expected);
            expect(mockContratistasService.findOne).toHaveBeenCalledWith(1);
            expect(mockAreaRepository.create).toHaveBeenCalledWith({
                ...createDto,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
            });
        });

        it('debería lanzar RpcException si el contratista no existe', async () => {
            mockContratistasService.findOne.mockRejectedValue(
                new RpcException({ statusCode: 404, message: 'Contratista con ID 999 no encontrado' }),
            );

            await expect(service.create({ ...createDto, contratistaId: 999 }))
                .rejects.toThrow(RpcException);
        });

        it('debería lanzar RpcException si ya existe un área con el mismo nombre para el contratista', async () => {
            mockContratistasService.findOne.mockResolvedValue({ id: 1 });
            mockAreaRepository.findOne.mockResolvedValue({
                id: 2,
                nombre: createDto.nombre,
                contratistaId: 1,
                descripcion: null,
                codigoArea: null,
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: new Date(),
                actualizadoEn: new Date(),
                eliminadoEn: null,
                contratista: null,
                proyectos: [],
            });

            await expect(service.create(createDto)).rejects.toThrow(RpcException);
        });
    });

    describe('findAll', () => {
        it('debería retornar una lista paginada de áreas', async () => {
            const now = new Date();
            const areas = [
                {
                    id: 1,
                    nombre: 'Área A',
                    contratistaId: 1,
                    descripcion: null,
                    codigoArea: null,
                    activo: true,
                    creadoPor: 'sistema',
                    actualizadoPor: 'sistema',
                    creadoEn: now,
                    actualizadoEn: now,
                    eliminadoEn: null,
                    contratista: { id: 1, nombre: 'Contratista 1' },
                    proyectos: [],
                },
                {
                    id: 2,
                    nombre: 'Área B',
                    contratistaId: 1,
                    descripcion: null,
                    codigoArea: null,
                    activo: true,
                    creadoPor: 'sistema',
                    actualizadoPor: 'sistema',
                    creadoEn: now,
                    actualizadoEn: now,
                    eliminadoEn: null,
                    contratista: { id: 1, nombre: 'Contratista 1' },
                    proyectos: [],
                },
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
                where: {},
            });
        });
    });

    describe('findOne', () => {
        it('debería retornar un área si existe', async () => {
            const now = new Date();
            const area = {
                id: 1,
                nombre: 'Área Test',
                contratistaId: 1,
                descripcion: null,
                codigoArea: null,
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                contratista: { id: 1, nombre: 'Contratista 1' },
                proyectos: [],
            };
            mockAreaRepository.findOne.mockResolvedValue(area);

            const result = await service.findOne(1);
            expect(result).toEqual(area);
        });

        it('debería lanzar RpcException si no existe', async () => {
            mockAreaRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(RpcException);
        });
    });

    describe('toggle', () => {
        it('debería cambiar el estado activo si no tiene proyectos asociados', async () => {
            const now = new Date();
            const area = {
                id: 1,
                nombre: 'Área Test',
                contratistaId: 1,
                descripcion: null,
                codigoArea: null,
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                contratista: null,
                proyectos: [],
            };
            mockAreaRepository.findOne.mockResolvedValue(area);
            mockProyectoRepository.count.mockResolvedValue(0);
            mockAreaRepository.save.mockResolvedValue({ ...area, activo: false });

            const result = await service.toggle(1);

            expect(mockProyectoRepository.count).toHaveBeenCalledWith({
                where: { areaId: 1 },
                withDeleted: true,
            });
            expect(mockAreaRepository.save).toHaveBeenCalled();
            expect(result).toEqual({ activo: false });
        });

        it('debería lanzar RpcException si tiene proyectos asociados', async () => {
            const now = new Date();
            const area = {
                id: 1,
                nombre: 'Área Test',
                contratistaId: 1,
                descripcion: null,
                codigoArea: null,
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                contratista: null,
                proyectos: [],
            };
            mockAreaRepository.findOne.mockResolvedValue(area);
            mockProyectoRepository.count.mockResolvedValue(3);

            await expect(service.toggle(1)).rejects.toThrow(RpcException);
            expect(mockAreaRepository.save).not.toHaveBeenCalled();
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
