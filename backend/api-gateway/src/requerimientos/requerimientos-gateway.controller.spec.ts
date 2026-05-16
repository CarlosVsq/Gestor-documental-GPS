import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RequerimientosGatewayController } from './requerimientos-gateway.controller';
import { SERVICE_NAMES, REQUERIMIENTOS_PATTERNS } from '../common/constants';

describe('RequerimientosGatewayController', () => {
  let controller: RequerimientosGatewayController;
  const mockClient = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequerimientosGatewayController],
      providers: [
        { provide: SERVICE_NAMES.REQUERIMIENTOS, useValue: mockClient },
      ],
    }).compile();

    controller = module.get<RequerimientosGatewayController>(RequerimientosGatewayController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('inyecta usuarioCreadorId desde req.user y envía CREATE', async () => {
      const dto = { titulo: 'Bug crítico', proyectoId: 1, prioridad: 'ALTA' };
      const req = { user: { id: 42, rol: 'colaborador' } };
      mockClient.send.mockReturnValue(of({ id: 5, ...dto, usuarioCreadorId: 42 }));

      await controller.create(dto, req);

      expect(mockClient.send).toHaveBeenCalledWith(REQUERIMIENTOS_PATTERNS.CREATE, {
        ...dto,
        usuarioCreadorId: 42,
      });
    });
  });

  describe('findAll()', () => {
    it('envía FIND_ALL sin filtro de contratistaId para rol admin', async () => {
      const req = { user: { id: 1, rol: 'admin' } };
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll(undefined, undefined, undefined, undefined, undefined, undefined, req);

      const [, payload] = mockClient.send.mock.calls[0];
      expect(payload.filtros.contratistaId).toBeUndefined();
      expect(payload).toMatchObject({ page: 1, limit: 10 });
    });

    it('inyecta contratistaId automáticamente para rol contratista', async () => {
      const req = { user: { id: 5, rol: 'contratista', contratistaId: 3 } };
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll(undefined, undefined, 'PENDIENTE', undefined, undefined, undefined, req);

      const [, payload] = mockClient.send.mock.calls[0];
      expect(payload.filtros.contratistaId).toBe(3);
      expect(payload.filtros.estado).toBe('PENDIENTE');
    });

    it('convierte proyectoId y areaId a número', async () => {
      const req = { user: { id: 1, rol: 'supervisor' } };
      mockClient.send.mockReturnValue(of({ data: [], total: 0 }));

      await controller.findAll('2', '20', undefined, undefined, '5', '7', req);

      const [, payload] = mockClient.send.mock.calls[0];
      expect(payload.filtros.proyectoId).toBe(5);
      expect(payload.filtros.areaId).toBe(7);
      expect(payload).toMatchObject({ page: 2, limit: 20 });
    });
  });

  describe('findOne()', () => {
    it('envía FIND_ONE con el id', async () => {
      const req = { id: 1, titulo: 'Bug crítico', estado: 'PENDIENTE' };
      mockClient.send.mockReturnValue(of(req));

      const result = await controller.findOne(1);

      expect(mockClient.send).toHaveBeenCalledWith(REQUERIMIENTOS_PATTERNS.FIND_ONE, 1);
      expect(result).toEqual(req);
    });
  });

  describe('updateState()', () => {
    it('envía UPDATE_STATE con id y updateDto', async () => {
      const updateDto = { estado: 'EN_REVISION' };
      mockClient.send.mockReturnValue(of({ id: 1, estado: 'EN_REVISION' }));

      await controller.updateState(1, updateDto);

      expect(mockClient.send).toHaveBeenCalledWith(REQUERIMIENTOS_PATTERNS.UPDATE_STATE, {
        id: 1,
        updateDto,
      });
    });
  });
});
