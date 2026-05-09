import { Test, TestingModule } from '@nestjs/testing';
import { SubtiposController } from './subtipos.controller';
import { SubtiposService } from './subtipos.service';

describe('SubtiposController', () => {
  let controller: SubtiposController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubtiposController],
      providers: [{ provide: SubtiposService, useValue: mockService }],
    }).compile();

    controller = module.get<SubtiposController>(SubtiposController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería llamar al servicio create', async () => {
    const dto = { nombre: 'Charla Diaria', categoriaId: 1 };
    mockService.create.mockResolvedValue({ id: 1, ...dto });
    const result = await controller.create(dto);
    expect(result.id).toBe(1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });
});
