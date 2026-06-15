import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from './common/constants';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    getProfile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('delega al servicio y retorna el token', async () => {
      const loginDto = { email: 'admin@sgd.cl', password: 'admin123' };
      const expected = { access_token: 'jwt-token', user: { id: 1, rol: 'admin' } };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expected);
    });
  });

  describe('getProfile()', () => {
    it('delega al servicio con el userId correcto', async () => {
      const expected = { id: 1, email: 'admin@sgd.cl', rol: 'admin' };
      mockAuthService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile({ userId: 1 });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('retorna la lista de usuarios del servicio', async () => {
      const usuarios = [{ id: 1 }, { id: 2 }];
      mockAuthService.findAll.mockResolvedValue(usuarios);

      const result = await controller.findAll();

      expect(mockAuthService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne()', () => {
    it('delega con el id correcto', async () => {
      const usuario = { id: 5, email: 'auditor@sgd.cl' };
      mockAuthService.findOne.mockResolvedValue(usuario);

      const result = await controller.findOne({ id: 5 });

      expect(mockAuthService.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(usuario);
    });
  });

  describe('createUser()', () => {
    it('delega el DTO completo al servicio', async () => {
      const dto = { nombre: 'Juan', email: 'juan@sgd.cl', password: 'Pass1!', rol: Role.COLABORADOR };
      const created = { id: 10, ...dto };
      mockAuthService.createUser.mockResolvedValue(created);

      const result = await controller.createUser(dto);

      expect(mockAuthService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('updateUser()', () => {
    it('delega el id y dto al servicio', async () => {
      const updateDto = { nombre: 'Juan Actualizado' };
      mockAuthService.updateUser.mockResolvedValue({ id: 10, nombre: 'Juan Actualizado' });

      await controller.updateUser({ id: 10, dto: updateDto });

      expect(mockAuthService.updateUser).toHaveBeenCalledWith(10, updateDto);
    });
  });

  describe('toggleActive()', () => {
    it('delega el id al servicio', async () => {
      mockAuthService.toggleActive.mockResolvedValue({ id: 2, activo: false });

      await controller.toggleActive({ id: 2 });

      expect(mockAuthService.toggleActive).toHaveBeenCalledWith(2);
    });
  });

  describe('validateUser()', () => {
    it('llama a getProfile con el userId', async () => {
      const perfil = { id: 3, email: 'colab@sgd.cl', rol: 'colaborador' };
      mockAuthService.getProfile.mockResolvedValue(perfil);

      const result = await controller.validateUser({ userId: 3 });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(3);
      expect(result).toEqual(perfil);
    });
  });
});
