import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { SubtiposGatewayController } from './subtipos-gateway.controller';
import { SERVICE_NAMES, SUBTIPOS_PATTERNS } from '../common/constants';

describe('SubtiposGatewayController', () => {
  let controller: SubtiposGatewayController;
  const mockClient = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubtiposGatewayController],
      providers: [
        { provide: SERVICE_NAMES.MANTENEDORES, useValue: mockClient },
      ],
    }).compile();

    controller = module.get<SubtiposGatewayController>(SubtiposGatewayController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('envía CREATE con el DTO al microservicio', async () => {
      const dto = { nombre: 'Plano de Planta', categoriaId: 1 };
      const expected = { id: 1, ...dto };
      mockClient.send.mockReturnValue(of(expected));

      const result = await controller.create(dto);

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.CREATE, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('envía FIND_ALL con page=1 y limit=10 por defecto', async () => {
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll(undefined, undefined, undefined);

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.FIND_ALL, {
        page: 1,
        limit: 10,
        categoriaId: undefined,
      });
    });

    it('convierte categoriaId de string a number cuando se provee', async () => {
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll('1', '5', '2');

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.FIND_ALL, {
        page: 1,
        limit: 5,
        categoriaId: 2,
      });
    });
  });

  describe('findOne()', () => {
    it('envía FIND_ONE con el id', async () => {
      const subtipo = { id: 1, nombre: 'Plano de Planta', categoriaId: 1 };
      mockClient.send.mockReturnValue(of(subtipo));

      const result = await controller.findOne(1);

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.FIND_ONE, 1);
      expect(result).toEqual(subtipo);
    });
  });

  describe('update()', () => {
    it('envía UPDATE con id y updateDto', async () => {
      const updateDto = { nombre: 'Plano de Corte' };
      mockClient.send.mockReturnValue(of({ id: 1, nombre: 'Plano de Corte' }));

      await controller.update(1, updateDto);

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.UPDATE, {
        id: 1,
        updateDto,
      });
    });
  });

  describe('toggle()', () => {
    it('envía TOGGLE con el id', async () => {
      mockClient.send.mockReturnValue(of({ id: 1, activo: false }));

      await controller.toggle(1);

      expect(mockClient.send).toHaveBeenCalledWith(SUBTIPOS_PATTERNS.TOGGLE, 1);
    });
  });
});
