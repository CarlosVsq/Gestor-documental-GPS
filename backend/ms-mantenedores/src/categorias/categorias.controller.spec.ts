import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';

describe('CategoriasController', () => {
  let controller: CategoriasController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasController],
      providers: [{ provide: CategoriasService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriasController>(CategoriasController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería llamar al servicio create', async () => {
    const dto = { nombre: 'Seguridad' };
    mockService.create.mockResolvedValue({ id: 1, ...dto });
    const result = await controller.create(dto);
    expect(result.id).toBe(1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });
});
