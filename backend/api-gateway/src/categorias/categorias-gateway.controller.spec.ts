import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CategoriasGatewayController } from './categorias-gateway.controller';
import { SERVICE_NAMES, CATEGORIAS_PATTERNS } from '../common/constants';

describe('CategoriasGatewayController', () => {
  let controller: CategoriasGatewayController;
  const mockClient = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasGatewayController],
      providers: [
        { provide: SERVICE_NAMES.MANTENEDORES, useValue: mockClient },
      ],
    }).compile();

    controller = module.get<CategoriasGatewayController>(CategoriasGatewayController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('envía CREATE al microservicio y retorna el resultado', async () => {
      const dto = { nombre: 'Planos' };
      const expected = { id: 1, nombre: 'Planos', activo: true };
      mockClient.send.mockReturnValue(of(expected));

      const result = await controller.create(dto);

      expect(mockClient.send).toHaveBeenCalledWith(CATEGORIAS_PATTERNS.CREATE, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('envía FIND_ALL con page y limit correctos', async () => {
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll('2', '5');

      expect(mockClient.send).toHaveBeenCalledWith(
        CATEGORIAS_PATTERNS.FIND_ALL,
        { page: 2, limit: 5 },
      );
    });

    it('usa page=1 y limit=10 cuando los parámetros son undefined', async () => {
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll(undefined, undefined);

      expect(mockClient.send).toHaveBeenCalledWith(
        CATEGORIAS_PATTERNS.FIND_ALL,
        { page: 1, limit: 10 },
      );
    });
  });

  describe('findOne()', () => {
    it('envía FIND_ONE con el id correcto', async () => {
      const categoria = { id: 1, nombre: 'Planos', activo: true };
      mockClient.send.mockReturnValue(of(categoria));

      const result = await controller.findOne(1);

      expect(mockClient.send).toHaveBeenCalledWith(CATEGORIAS_PATTERNS.FIND_ONE, 1);
      expect(result).toEqual(categoria);
    });
  });

  describe('update()', () => {
    it('envía UPDATE con id y dto', async () => {
      const updateDto = { nombre: 'Planos Actualizados' };
      const updated = { id: 1, nombre: 'Planos Actualizados' };
      mockClient.send.mockReturnValue(of(updated));

      await controller.update(1, updateDto);

      expect(mockClient.send).toHaveBeenCalledWith(
        CATEGORIAS_PATTERNS.UPDATE,
        { id: 1, updateDto },
      );
    });
  });

  describe('toggle()', () => {
    it('envía TOGGLE con el id', async () => {
      mockClient.send.mockReturnValue(of({ id: 1, activo: false }));

      await controller.toggle(1);

      expect(mockClient.send).toHaveBeenCalledWith(CATEGORIAS_PATTERNS.TOGGLE, 1);
    });
  });
});
