import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

/**
 * Test unitario del servicio de Autenticación (HU-25, HU-26)
 * Verifica login, CRUD de usuarios, y seed admin.
 */
describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // ================================================================
  // LOGIN
  // ================================================================
  describe('login', () => {
    it('debería retornar un access_token y datos del usuario', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Admin SGD',
        email: 'admin@sgd.cl',
        password: 'hashed_pw',
        rol: 'admin',
        activo: true,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token_123');

      const result = await service.login({ email: 'admin@sgd.cl', password: 'admin123' });

      expect(result.access_token).toBe('jwt_token_123');
      expect(result.user).toEqual({
        id: 1,
        nombre: 'Admin SGD',
        email: 'admin@sgd.cl',
        rol: 'admin',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@sgd.cl',
        rol: 'admin',
      });
    });

    it('debería lanzar RpcException si el email no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@sgd.cl', password: '123' }),
      ).rejects.toThrow(RpcException);
    });

    it('debería lanzar RpcException si la contraseña es incorrecta', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'admin@sgd.cl',
        password: 'hashed',
        activo: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@sgd.cl', password: 'wrong' }),
      ).rejects.toThrow(RpcException);
    });
  });

  // ================================================================
  // GET PROFILE
  // ================================================================
  describe('getProfile', () => {
    it('debería retornar el perfil sin la contraseña', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Admin',
        email: 'admin@sgd.cl',
        password: 'secret_hash',
        rol: 'admin',
        activo: true,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: 1,
        nombre: 'Admin',
        email: 'admin@sgd.cl',
        rol: 'admin',
        activo: true,
      });
    });

    it('debería lanzar RpcException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(RpcException);
    });
  });

  // ================================================================
  // FIND ALL
  // ================================================================
  describe('findAll', () => {
    it('debería retornar todos los usuarios sin contraseña', async () => {
      const users = [
        { id: 1, nombre: 'Admin', email: 'admin@sgd.cl', password: 'hash1', rol: 'admin' },
        { id: 2, nombre: 'Colaborador', email: 'colaborador@sgd.cl', password: 'hash2', rol: 'colaborador' },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      result.forEach((u: any) => {
        expect(u).not.toHaveProperty('password');
      });
    });
  });

  // ================================================================
  // FIND ONE
  // ================================================================
  describe('findOne', () => {
    it('debería retornar un usuario sin contraseña', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Test',
        email: 'test@sgd.cl',
        password: 'hash',
        rol: 'colaborador',
      });

      const result = await service.findOne(1);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@sgd.cl');
    });

    it('debería lanzar RpcException si no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(RpcException);
    });
  });

  // ================================================================
  // CREATE USER
  // ================================================================
  describe('createUser', () => {
    const createDto = {
      nombre: 'Nuevo Usuario',
      email: 'nuevo@sgd.cl',
      password: 'password123',
      rol: 'colaborador',
    };

    it('debería crear un usuario exitosamente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existe
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const savedUser = {
        id: 3,
        nombre: createDto.nombre,
        email: createDto.email,
        password: 'hashed_password',
        rol: createDto.rol,
        activo: true,
      };
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(createDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('nuevo@sgd.cl');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('debería lanzar RpcException si el email ya está registrado', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: createDto.email });

      await expect(service.createUser(createDto)).rejects.toThrow(RpcException);
    });
  });

  // ================================================================
  // TOGGLE ACTIVE
  // ================================================================
  describe('toggleActive', () => {
    it('debería cambiar el estado activo de un usuario', async () => {
      const user = {
        id: 1,
        nombre: 'Test',
        email: 'test@sgd.cl',
        password: 'hash',
        activo: true,
        rol: 'colaborador',
      };
      mockUserRepository.findOne.mockResolvedValue({ ...user });
      mockUserRepository.save.mockResolvedValue({ ...user, activo: false });

      const result = await service.toggleActive(1);

      expect(result).not.toHaveProperty('password');
    });

    it('debería lanzar RpcException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleActive(999)).rejects.toThrow(RpcException);
    });
  });

  // ================================================================
  // SEED ADMIN
  // ================================================================
  describe('seedAdmin', () => {
    it('debería crear admin si no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_admin');
      mockUserRepository.create.mockReturnValue({ nombre: 'Administrador SGD' });
      mockUserRepository.save.mockResolvedValue({ id: 1 });

      await service.seedAdmin();

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@sgd.cl' },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debería omitir seed si admin ya existe', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'admin@sgd.cl' });

      await service.seedAdmin();

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
