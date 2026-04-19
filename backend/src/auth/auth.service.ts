import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './enums/role.enum';

/**
 * Servicio de Autenticación y Usuarios — HU-25/HU-19
 * Maneja login, CRUD de usuarios y seed del admin.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================================
  // AUTH — Login / Profile
  // ============================================================

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { sub: user.id, email: user.email, rol: user.rol };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email, activo: true } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    return user;
  }

  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const { password, ...result } = user;
    return result;
  }

  // ============================================================
  // CRUD USUARIOS — HU-19
  // ============================================================

  /**
   * Listar todos los usuarios (sin password).
   */
  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({ order: { creadoEn: 'DESC' } });
    return users.map(({ password, ...rest }) => rest);
  }

  /**
   * Buscar un usuario por ID (sin password).
   */
  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);

    const { password, ...result } = user;
    return result;
  }

  /**
   * Crear un nuevo usuario.
   */
  async createUser(dto: CreateUserDto): Promise<Partial<User>> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException(`El email ${dto.email} ya está registrado`);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPassword,
      rol: dto.rol || Role.ADMIN,
      activo: true,
    });

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  /**
   * Actualizar un usuario existente.
   */
  async updateUser(id: number, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);

    // Verificar email único si se cambia
    if (dto.email && dto.email !== user.email) {
      const dup = await this.userRepository.findOne({ where: { email: dto.email } });
      if (dup) throw new ConflictException(`El email ${dto.email} ya está registrado`);
      user.email = dto.email;
    }

    if (dto.nombre) user.nombre = dto.nombre;
    if (dto.rol) user.rol = dto.rol;
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  /**
   * Activar/Desactivar un usuario (toggle).
   */
  async toggleActive(id: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);

    user.activo = !user.activo;
    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  // ============================================================
  // SEED
  // ============================================================

  async seedAdmin(): Promise<void> {
    const adminEmail = 'admin@sgd.cl';
    const existing = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (existing) {
      this.logger.log('✅ Usuario admin ya existe, seed omitido');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = this.userRepository.create({
      nombre: 'Administrador SGD',
      email: adminEmail,
      password: hashedPassword,
      rol: Role.ADMIN,
      activo: true,
    });

    await this.userRepository.save(admin);
    this.logger.log('🌱 Usuario admin creado: admin@sgd.cl / admin123');
  }
}
