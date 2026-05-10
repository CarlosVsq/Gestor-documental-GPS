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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequerimientosController],
      providers: [{ provide: RequerimientosService, useValue: mockService }],
    }).compile();

    controller = module.get<RequerimientosController>(RequerimientosController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería llamar al servicio create', async () => {
    const dto = { titulo: 'Test', proyectoId: 1, areaId: 1, contratistaId: 1, categoriaId: 1, subtipoId: 1 };
    mockService.create.mockResolvedValue({ id: 1, ...dto, estado: EstadoRequerimiento.ABIERTO });
    const result = await controller.create(dto);
    expect(result.id).toBe(1);
    expect(result.estado).toBe('Abierto');
  });
});
