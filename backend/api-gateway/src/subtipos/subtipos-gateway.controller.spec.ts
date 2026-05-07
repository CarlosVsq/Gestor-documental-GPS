import { Test, TestingModule } from '@nestjs/testing';
import { SubtiposGatewayController } from './subtipos-gateway.controller';

describe('SubtiposGatewayController', () => {
  let controller: SubtiposGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubtiposGatewayController],
    }).compile();

    controller = module.get<SubtiposGatewayController>(SubtiposGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
