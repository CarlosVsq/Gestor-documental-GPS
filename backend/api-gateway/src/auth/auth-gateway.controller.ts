import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseFilters,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { callService } from '../common/rpc.utils';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';
import { Role, Permission, SERVICE_NAMES, AUTH_PATTERNS } from '../common/constants';
import { AuthExceptionFilter } from '../common/auth-exception.filter';

/**
 * Gateway Controller de Auth — HU-25/HU-17/HU-10
 * Proxy HTTP → TCP hacia ms-auth.
 * 
 * HU-17: Endpoints protegidos con @Permissions() para control granular.
 * HU-10: Guard chain: JwtAuthGuard → RolesGuard → PermissionsGuard.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna JWT y datos del usuario.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.LOGIN, loginDto));
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @UseFilters(AuthExceptionFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async getProfile(@Request() req: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.PROFILE, { userId: req.user.id }));
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los usuarios (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAll() {
    return callService(this.authClient.send(AUTH_PATTERNS.FIND_ALL_USERS, {}));
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por ID (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.authClient.send(AUTH_PATTERNS.FIND_ONE_USER, { id }));
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo usuario (solo admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async createUser(@Body() dto: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.CREATE_USER, dto));
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.UPDATE_USER, { id, dto }));
  }

  @Patch('users/:id/toggle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar/Desactivar un usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Estado del usuario cambiado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return callService(this.authClient.send(AUTH_PATTERNS.TOGGLE_USER, { id }));
  }

  // ============================================================
  // HU-17: Roles
  // ============================================================

  @Get('roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los roles con sus permisos' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async findAllRoles() {
    return callService(this.authClient.send(AUTH_PATTERNS.FIND_ALL_ROLES, {}));
  }
}
