import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { ProyectosService } from './proyectos.service';
import { Proyecto } from './proyecto.entity';
import { AreasService } from '../areas/areas.service';

/**
 * Test unitario del servicio de Proyectos (HU-03)
 * Verifica la lógica de negocio del CRUD sin dependencia de la BD.
 */
describe('ProyectosService', () => {
    let service: ProyectosService;

    // Mock del QueryBuilder para createQueryBuilder().withDeleted().where().getCount()
    const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
    };

    const mockProyectoRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        softRemove: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockAreasService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProyectosService,
                {
                    provide: getRepositoryToken(Proyecto),
                    useValue: mockProyectoRepository,
                },
                {
                    provide: AreasService,
                    useValue: mockAreasService,
                },
            ],
        }).compile();

        service = module.get<ProyectosService>(ProyectosService);
        jest.clearAllMocks();
        // Re-asignar mockReturnValue después del clearAllMocks
        mockProyectoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.withDeleted.mockReturnThis();
        mockQueryBuilder.where.mockReturnThis();
    });

    it('debería estar definido', () => {
        expect(service).toBeDefined();
    });

    // ================================================================
    // CREATE
    // ================================================================
    describe('create', () => {
        const createDto = {
            nombre: 'Proyecto Puente Norte',
            fechaInicio: '2026-05-01',
            fechaFin: '2026-12-31',
            areaId: 1,
            estadoProyecto: 'Ejecución' as const,
        };

        it('debería crear un proyecto exitosamente con código auto-generado', async () => {
            const mockArea = { id: 1, nombre: 'Ingeniería Civil' };
            mockAreasService.findOne.mockResolvedValue(mockArea);
            mockQueryBuilder.getCount.mockResolvedValue(0); // primer proyecto del área

            const now = new Date();
            const expected = {
                id: 1,
                ...createDto,
                codigo: 'ING-001',
                ubicacion: null,
                presupuestoEstimado: null,
                horasHombre: null,
                estadoProyecto: 'Ejecución',
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                area: mockArea,
            };
            mockProyectoRepository.create.mockReturnValue(expected);
            mockProyectoRepository.save.mockResolvedValue(expected);

            const result = await service.create(createDto);

            expect(result).toEqual(expected);
            expect(mockAreasService.findOne).toHaveBeenCalledWith(1);
            expect(mockProyectoRepository.create).toHaveBeenCalledWith({
                ...createDto,
                codigo: 'ING-001',
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
            });
        });

        it('debería generar código secuencial correcto (segundo proyecto del área)', async () => {
            const mockArea = { id: 1, nombre: 'Ingeniería Civil' };
            mockAreasService.findOne.mockResolvedValue(mockArea);
            mockQueryBuilder.getCount.mockResolvedValue(2); // ya hay 2 proyectos

            const now = new Date();
            const expected = {
                id: 3,
                ...createDto,
                codigo: 'ING-003',
                ubicacion: null,
                presupuestoEstimado: null,
                horasHombre: null,
                estadoProyecto: 'Ejecución',
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                area: mockArea,
            };
            mockProyectoRepository.create.mockReturnValue(expected);
            mockProyectoRepository.save.mockResolvedValue(expected);

            await service.create(createDto);

            expect(mockProyectoRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ codigo: 'ING-003' }),
            );
        });

        it('debería generar código correctamente para áreas con tildes', async () => {
            const mockArea = { id: 2, nombre: 'Área de Planificación' };
            mockAreasService.findOne.mockResolvedValue(mockArea);
            mockQueryBuilder.getCount.mockResolvedValue(0);

            const dtoConArea2 = { ...createDto, areaId: 2 };
            const now = new Date();
            const expected = {
                id: 1,
                ...dtoConArea2,
                codigo: 'ARE-001',
                ubicacion: null,
                presupuestoEstimado: null,
                horasHombre: null,
                estadoProyecto: 'Ejecución',
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                area: mockArea,
            };
            mockProyectoRepository.create.mockReturnValue(expected);
            mockProyectoRepository.save.mockResolvedValue(expected);

            await service.create(dtoConArea2);

            // 'Área de Planificación' → normalize → 'Area de Planificacion'
            // → filter out 'area' → ['de', 'Planificacion'] → join → 'dePlanificacion'
            // → prefix = 'DEP'
            expect(mockProyectoRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ codigo: 'DEP-001' }),
            );
        });

        it('debería lanzar RpcException si el área no existe', async () => {
            mockAreasService.findOne.mockRejectedValue(
                new RpcException({ statusCode: 404, message: 'Area con ID 999 no encontrada' }),
            );

            await expect(service.create({ ...createDto, areaId: 999 }))
                .rejects.toThrow(RpcException);
        });

        it('debería lanzar RpcException si fechaFin <= fechaInicio', async () => {
            mockAreasService.findOne.mockResolvedValue({ id: 1, nombre: 'Test' });

            await expect(service.create({
                ...createDto,
                fechaInicio: '2026-12-31',
                fechaFin: '2026-01-01', // fecha fin anterior
            })).rejects.toThrow(RpcException);
        });

        it('debería lanzar RpcException si fechaFin === fechaInicio', async () => {
            mockAreasService.findOne.mockResolvedValue({ id: 1, nombre: 'Test' });

            await expect(service.create({
                ...createDto,
                fechaInicio: '2026-06-01',
                fechaFin: '2026-06-01', // misma fecha
            })).rejects.toThrow(RpcException);
        });
    });

    // ================================================================
    // FIND ALL
    // ================================================================
    describe('findAll', () => {
        it('debería retornar una lista paginada de proyectos con relaciones', async () => {
            const now = new Date();
            const proyectos = [
                {
                    id: 1,
                    nombre: 'Proyecto A',
                    codigo: 'ING-001',
                    areaId: 1,
                    fechaInicio: new Date('2026-05-01'),
                    fechaFin: new Date('2026-12-31'),
                    ubicacion: null,
                    presupuestoEstimado: null,
                    horasHombre: null,
                    estadoProyecto: 'Ejecución',
                    activo: true,
                    creadoPor: 'sistema',
                    actualizadoPor: 'sistema',
                    creadoEn: now,
                    actualizadoEn: now,
                    eliminadoEn: null,
                    area: { id: 1, nombre: 'Ingeniería', contratista: { id: 1, nombre: 'ACME' } },
                },
                {
                    id: 2,
                    nombre: 'Proyecto B',
                    codigo: 'ING-002',
                    areaId: 1,
                    fechaInicio: new Date('2026-05-01'),
                    fechaFin: new Date('2026-12-31'),
                    ubicacion: null,
                    presupuestoEstimado: null,
                    horasHombre: null,
                    estadoProyecto: 'Ejecución',
                    activo: true,
                    creadoPor: 'sistema',
                    actualizadoPor: 'sistema',
                    creadoEn: now,
                    actualizadoEn: now,
                    eliminadoEn: null,
                    area: { id: 1, nombre: 'Ingeniería', contratista: { id: 1, nombre: 'ACME' } },
                },
            ];
            mockProyectoRepository.findAndCount.mockResolvedValue([proyectos, 2]);

            const result = await service.findAll(1, 10);

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(mockProyectoRepository.findAndCount).toHaveBeenCalledWith({
                relations: ['area', 'area.contratista'],
                skip: 0,
                take: 10,
                order: { creadoEn: 'DESC' },
                where: {},
            });
        });

        it('debería aplicar paginación correctamente (página 2)', async () => {
            mockProyectoRepository.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll(2, 5);

            expect(mockProyectoRepository.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 5, take: 5 }),
            );
        });
    });

    // ================================================================
    // FIND ONE
    // ================================================================
    describe('findOne', () => {
        it('debería retornar un proyecto si existe', async () => {
            const now = new Date();
            const proyecto = {
                id: 1,
                nombre: 'Proyecto Test',
                codigo: 'ING-001',
                areaId: 1,
                fechaInicio: new Date('2026-05-01'),
                fechaFin: new Date('2026-12-31'),
                ubicacion: null,
                presupuestoEstimado: null,
                horasHombre: null,
                estadoProyecto: 'Ejecución',
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
                area: { id: 1, nombre: 'Ingeniería', contratista: { id: 1, nombre: 'ACME' } },
            };
            mockProyectoRepository.findOne.mockResolvedValue(proyecto);

            const result = await service.findOne(1);

            expect(result).toEqual(proyecto);
            expect(mockProyectoRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['area', 'area.contratista'],
            });
        });

        it('debería lanzar RpcException si el proyecto no existe', async () => {
            mockProyectoRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(RpcException);
        });
    });

    // ================================================================
    // UPDATE
    // ================================================================
    describe('update', () => {
        const now = new Date();
        const existingProyecto = {
            id: 1,
            nombre: 'Proyecto Original',
            codigo: 'ING-001',
            fechaInicio: new Date('2026-05-01'),
            fechaFin: new Date('2026-12-31'),
            areaId: 1,
            ubicacion: null,
            presupuestoEstimado: null,
            horasHombre: null,
            estadoProyecto: 'Ejecución',
            activo: true,
            creadoPor: 'sistema',
            actualizadoPor: 'sistema',
            creadoEn: now,
            actualizadoEn: now,
            eliminadoEn: null,
            area: { id: 1, nombre: 'Ingeniería', contratista: { id: 1, nombre: 'ACME' } },
        };

        it('debería actualizar un proyecto exitosamente', async () => {
            mockProyectoRepository.findOne.mockResolvedValue({ ...existingProyecto });
            const updated = { ...existingProyecto, nombre: 'Proyecto Actualizado' };
            mockProyectoRepository.save.mockResolvedValue(updated);

            const result = await service.update(1, { nombre: 'Proyecto Actualizado' });

            expect(result.nombre).toBe('Proyecto Actualizado');
            expect(mockProyectoRepository.save).toHaveBeenCalled();
        });

        it('debería verificar que el área existe si se cambia', async () => {
            mockProyectoRepository.findOne.mockResolvedValue({ ...existingProyecto });
            mockAreasService.findOne.mockResolvedValue({ id: 2, nombre: 'Otra Área' });
            mockProyectoRepository.save.mockResolvedValue({ ...existingProyecto, areaId: 2 });

            await service.update(1, { areaId: 2 });

            expect(mockAreasService.findOne).toHaveBeenCalledWith(2);
        });

        it('debería lanzar RpcException si el nuevo área no existe', async () => {
            mockProyectoRepository.findOne.mockResolvedValue({ ...existingProyecto });
            mockAreasService.findOne.mockRejectedValue(
                new RpcException({ statusCode: 404, message: 'Area con ID 999 no encontrada' }),
            );

            await expect(service.update(1, { areaId: 999 }))
                .rejects.toThrow(RpcException);
        });

        it('debería lanzar RpcException si las fechas actualizadas son inválidas', async () => {
            mockProyectoRepository.findOne.mockResolvedValue({ ...existingProyecto });

            await expect(service.update(1, {
                fechaFin: '2026-01-01', // anterior a fechaInicio existente
            })).rejects.toThrow(RpcException);
        });
    });

    // ================================================================
    // REMOVE (soft delete)
    // ================================================================
    describe('toggle', () => {
        it('debería cambiar el estado activo del proyecto', async () => {
            const now = new Date();
            const proyecto = {
                id: 1,
                nombre: 'Proyecto Test',
                codigo: 'ING-001',
                fechaInicio: new Date('2026-05-01'),
                fechaFin: new Date('2026-12-31'),
                areaId: 1,
                ubicacion: null,
                presupuestoEstimado: null,
                horasHombre: null,
                estadoProyecto: 'Ejecución',
                activo: true,
                creadoPor: 'sistema',
                actualizadoPor: 'sistema',
                creadoEn: now,
                actualizadoEn: now,
                eliminadoEn: null,
            };
            mockProyectoRepository.findOne.mockResolvedValue(proyecto);
            mockProyectoRepository.save.mockResolvedValue({ ...proyecto, activo: false });

            const result = await service.toggle(1);

            expect(mockProyectoRepository.save).toHaveBeenCalled();
            expect(result).toEqual({ activo: false });
        });

        it('debería lanzar RpcException si el proyecto no existe', async () => {
            mockProyectoRepository.findOne.mockResolvedValue(null);

            await expect(service.toggle(999)).rejects.toThrow(RpcException);
        });
    });

    // ================================================================
    // STATS
    // ================================================================
    describe('getStats', () => {
        it('debería retornar estadísticas correctas', async () => {
            mockProyectoRepository.count
                .mockResolvedValueOnce(15)  // total
                .mockResolvedValueOnce(10); // activos

            const result = await service.getStats();

            expect(result).toEqual({ total: 15, activos: 10, inactivos: 5 });
        });
    });
});
