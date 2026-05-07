import { Test, TestingModule } from '@nestjs/testing';
import { RequerimientosGatewayController } from './requerimientos-gateway.controller';

describe('RequerimientosGatewayController', () => {
  let controller: RequerimientosGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequerimientosGatewayController],
    }).compile();

    controller = module.get<RequerimientosGatewayController>(RequerimientosGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
