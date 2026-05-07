import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasGatewayController } from './categorias-gateway.controller';

describe('CategoriasGatewayController', () => {
  let controller: CategoriasGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasGatewayController],
    }).compile();

    controller = module.get<CategoriasGatewayController>(CategoriasGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
