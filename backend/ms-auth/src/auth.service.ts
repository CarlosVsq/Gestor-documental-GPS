import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { User } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import {
  Role,
  Permission,
  ROLE_PERMISSIONS_MAP,
  ROLE_DESCRIPTIONS,
} from './common/constants';

interface CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  rol?: Role;
  contratistaId?: number;
}

interface UpdateUserDto {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Role;
  contratistaId?: number;
}

/**
 * Servicio de Autenticación y Usuarios — HU-25/HU-17/HU-10
 * 
 * HU-17: Integra sistema de roles y permisos granulares.
 * HU-10: Provee verifyJwt para validación centralizada en el gateway.
 * 
 * Lanza RpcException para que el gateway traduzca a HTTP.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================================
  // AUTH — Login / Profile / JWT Verification
  // ============================================================

  async login(loginDto: { email: string; password: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const permissions = await this.getPermissionsForRole(user.rol);
    const jti = randomUUID();

    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      permissions,
      contratistaId: user.contratistaId,
      jti,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        permissions,
        contratistaId: user.contratistaId,
      },
    };
  }

  /**
   * HU-10: Verifica un JWT y retorna su payload con permisos.
   * Usado por el API Gateway para validación centralizada.
   */
  async verifyJwt(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return {
        valid: true,
        payload: {
          sub: payload.sub,
          email: payload.email,
          nombre: payload.nombre,
          rol: payload.rol,
          permissions: payload.permissions || [],
          contratistaId: payload.contratistaId,
          jti: payload.jti,
          exp: payload.exp,
          iat: payload.iat,
        },
        isExpired: false,
        isBlacklisted: false, // TODO: Implementar verificación Redis cuando se integre
      };
    } catch (error) {
      const isExpired = error?.name === 'TokenExpiredError';
      return {
        valid: false,
        payload: null,
        isExpired,
        isBlacklisted: false,
      };
    }
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

    const permissions = await this.getPermissionsForRole(user.rol);
    const { password, ...result } = user;
    return { ...result, permissions };
  }

  // ============================================================
  // PERMISOS — HU-17
  // ============================================================

  /**
   * Obtiene los permisos de un rol.
   * Primero intenta desde la BD (role_permissions).
   * Si no hay registros, usa el fallback hardcoded ROLE_PERMISSIONS_MAP.
   */
  async getPermissionsForRole(roleName: Role | string): Promise<string[]> {
    try {
      const role = await this.roleRepository.findOne({
        where: { nombre: roleName as string },
      });

      if (role) {
        const rolePerms = await this.rolePermissionRepository.find({
          where: { roleId: role.id },
          relations: ['permission'],
        });

        if (rolePerms.length > 0) {
          return rolePerms.map((rp) => rp.permission.nombre);
        }
      }
    } catch (error) {
      this.logger.warn(`Error consultando permisos de BD para rol ${roleName}: ${error?.message}`);
    }

    // Fallback: mapa hardcoded
    const roleKey = roleName as Role;
    return ROLE_PERMISSIONS_MAP[roleKey] || [];
  }

  /**
   * Lista todos los roles con sus permisos.
   */
  async findAllRoles() {
    const roles = await this.roleRepository.find({ order: { id: 'ASC' } });
    const result = [];

    for (const role of roles) {
      const perms = await this.getPermissionsForRole(role.nombre as Role);
      result.push({
        id: role.id,
        nombre: role.nombre,
        descripcion: role.descripcion,
        permissions: perms,
      });
    }

    return result;
  }

  // ============================================================
  // CRUD USUARIOS — HU-19
  // ============================================================

  async findAll() {
    const users = await this.userRepository.find({ order: { creadoEn: 'DESC' } });
    const result = [];
    for (const user of users) {
      const permissions = await this.getPermissionsForRole(user.rol);
      const { password, ...rest } = user;
      result.push({ ...rest, permissions });
    }
    return result;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new RpcException({ statusCode: 404, message: `Usuario #${id} no encontrado` });
    }

    const permissions = await this.getPermissionsForRole(user.rol);
    const { password, ...result } = user;
    return { ...result, permissions };
  }

  async createUser(dto: CreateUserDto) {
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

    // Buscar roleId desde la tabla roles
    const roleName = dto.rol || Role.COLABORADOR;
    const roleEntity = await this.roleRepository.findOne({ where: { nombre: roleName } });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPassword,
      rol: roleName,
      roleId: roleEntity?.id || null,
      contratistaId: dto.rol === Role.CONTRATISTA ? dto.contratistaId : null,
      activo: true,
    });

    const saved = await this.userRepository.save(user);
    const permissions = await this.getPermissionsForRole(saved.rol);
    const { password, ...result } = saved;
    return { ...result, permissions };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
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

      // Sincronizar roleId con la tabla roles
      const roleEntity = await this.roleRepository.findOne({ where: { nombre: dto.rol } });
      user.roleId = roleEntity?.id || null;
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
    const permissions = await this.getPermissionsForRole(saved.rol);
    const { password, ...result } = saved;
    return { ...result, permissions };
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
  // SEED — HU-17
  // ============================================================

  async seedAdmin(): Promise<void> {
    // 1. Seed de roles
    await this.seedRoles();

    // 2. Seed de permisos
    await this.seedPermissions();

    // 3. Seed de role_permissions (pivot)
    await this.seedRolePermissions();

    // 4. Seed de usuario admin
    await this.seedAdminUser();
  }

  private async seedRoles(): Promise<void> {
    for (const roleName of Object.values(Role)) {
      const existing = await this.roleRepository.findOne({ where: { nombre: roleName } });
      if (!existing) {
        await this.roleRepository.save(
          this.roleRepository.create({
            nombre: roleName,
            descripcion: ROLE_DESCRIPTIONS[roleName] || roleName,
          }),
        );
        this.logger.log(`🌱 Rol creado: ${roleName}`);
      }
    }
  }

  private async seedPermissions(): Promise<void> {
    const permissionModules: Record<string, string> = {
      [Permission.MANAGE_USERS]: 'auth',
      [Permission.MANAGE_MANTENEDORES]: 'mantenedores',
      [Permission.READ_ALL_REQUERIMIENTOS]: 'requerimientos',
      [Permission.CREATE_REQUERIMIENTO]: 'requerimientos',
      [Permission.CHANGE_REQUERIMIENTO_STATE]: 'requerimientos',
      [Permission.CLOSE_REQUERIMIENTO]: 'requerimientos',
      [Permission.UPLOAD_DOCUMENT]: 'almacenamiento',
      [Permission.DOWNLOAD_DOCUMENT]: 'almacenamiento',
      [Permission.SIGN_DOCUMENT]: 'almacenamiento',
      [Permission.DELETE_DOCUMENT]: 'almacenamiento',
      [Permission.READ_AUDIT_LOG]: 'auditoria',
      [Permission.VIEW_REPORTS]: 'auditoria',
      [Permission.CONFIGURE_SYSTEM]: 'sistema',
    };

    for (const permName of Object.values(Permission)) {
      const existing = await this.permissionRepository.findOne({ where: { nombre: permName } });
      if (!existing) {
        await this.permissionRepository.save(
          this.permissionRepository.create({
            nombre: permName,
            descripcion: permName.replace(/_/g, ' '),
            modulo: permissionModules[permName] || 'general',
          }),
        );
        this.logger.log(`🌱 Permiso creado: ${permName}`);
      }
    }
  }

  private async seedRolePermissions(): Promise<void> {
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      const role = await this.roleRepository.findOne({ where: { nombre: roleName } });
      if (!role) continue;

      for (const permName of permissions) {
        const permission = await this.permissionRepository.findOne({ where: { nombre: permName } });
        if (!permission) continue;

        const existing = await this.rolePermissionRepository.findOne({
          where: { roleId: role.id, permissionId: permission.id },
        });

        if (!existing) {
          await this.rolePermissionRepository.save(
            this.rolePermissionRepository.create({
              roleId: role.id,
              permissionId: permission.id,
            }),
          );
        }
      }
      this.logger.log(`🌱 Permisos asignados a rol: ${roleName} (${permissions.length})`);
    }
  }

  private async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@sgd.cl';
    const existing = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (existing) {
      // Sincronizar roleId si no existe
      if (!existing.roleId) {
        const adminRole = await this.roleRepository.findOne({ where: { nombre: Role.ADMIN } });
        if (adminRole) {
          existing.roleId = adminRole.id;
          await this.userRepository.save(existing);
          this.logger.log('✅ Usuario admin: roleId sincronizado');
        }
      }
      this.logger.log('✅ Usuario admin ya existe, seed omitido');
      return;
    }

    const adminRole = await this.roleRepository.findOne({ where: { nombre: Role.ADMIN } });
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = this.userRepository.create({
      nombre: 'Administrador SGD',
      email: adminEmail,
      password: hashedPassword,
      rol: Role.ADMIN,
      roleId: adminRole?.id || null,
      activo: true,
    });

    await this.userRepository.save(admin);
    this.logger.log('🌱 Usuario admin creado: admin@sgd.cl / admin123');
  }
}
