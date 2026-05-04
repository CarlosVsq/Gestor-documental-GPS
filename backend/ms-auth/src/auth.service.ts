import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './common/constants';

/**
 * Servicio de Autenticación y Usuarios — HU-25/HU-19
 * Misma lógica del monolito, pero lanza RpcException en lugar de HttpException
 * para que el gateway pueda traducirlas a respuestas HTTP.
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

  async login(loginDto: { email: string; password: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { sub: user.id, email: user.email, rol: user.rol, contratistaId: user.contratistaId };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, contratistaId: user.contratistaId },
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email, activo: true } });
    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new RpcException({ statusCode: 401, message: 'Credenciales inválidas' });
    }

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Usuario no encontrado' });
    }

    const { password, ...result } = user;
    return result;
  }

  // ============================================================
  // CRUD USUARIOS — HU-19
  // ============================================================

  async findAll() {
    const users = await this.userRepository.find({ order: { creadoEn: 'DESC' } });
    return users.map(({ password, ...rest }) => rest);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new RpcException({ statusCode: 404, message: `Usuario #${id} no encontrado` });
    }

    const { password, ...result } = user;
    return result;
  }

  async createUser(dto: any) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new RpcException({ statusCode: 409, message: `El email ${dto.email} ya está registrado` });
    }

    if (dto.rol && !Object.values(Role).includes(dto.rol)) {
      throw new RpcException({ statusCode: 400, message: `Rol '${dto.rol}' inválido` });
    }

    if (dto.rol === Role.CONTRATISTA && !dto.contratistaId) {
      throw new RpcException({ statusCode: 400, message: 'El rol contratista requiere un contratistaId' });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPassword,
      rol: dto.rol || Role.ADMIN,
      contratistaId: dto.rol === Role.CONTRATISTA ? dto.contratistaId : null,
      activo: true,
    });

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async updateUser(id: number, dto: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new RpcException({ statusCode: 404, message: `Usuario #${id} no encontrado` });
    }

    if (dto.email && dto.email !== user.email) {
      const dup = await this.userRepository.findOne({ where: { email: dto.email } });
      if (dup) {
        throw new RpcException({ statusCode: 409, message: `El email ${dto.email} ya está registrado` });
      }
      user.email = dto.email;
    }

    if (dto.nombre) user.nombre = dto.nombre;
    if (dto.rol) {
      if (!Object.values(Role).includes(dto.rol)) {
        throw new RpcException({ statusCode: 400, message: `Rol '${dto.rol}' inválido` });
      }
      user.rol = dto.rol;
    }
    
    // Si envían rol contratista o cambian a contratista
    if (user.rol === Role.CONTRATISTA) {
      if (dto.contratistaId) {
        user.contratistaId = dto.contratistaId;
      } else if (!user.contratistaId) {
         throw new RpcException({ statusCode: 400, message: 'El rol contratista requiere un contratistaId' });
      }
    } else {
      user.contratistaId = null; // Limpiar si cambia a otro rol
    }

    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async toggleActive(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new RpcException({ statusCode: 404, message: `Usuario #${id} no encontrado` });
    }

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
