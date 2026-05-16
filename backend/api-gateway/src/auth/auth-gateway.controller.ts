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
import { Roles } from './decorators/roles.decorator';
import { Role, SERVICE_NAMES, AUTH_PATTERNS } from '../common/constants';
import { AuthExceptionFilter } from '../common/auth-exception.filter';

/**
 * Gateway Controller de Auth — HU-25/HU-19
 * Proxy HTTP → TCP hacia ms-auth.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
  ) {}

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async findAll() {
    return callService(this.authClient.send(AUTH_PATTERNS.FIND_ALL_USERS, {}));
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.authClient.send(AUTH_PATTERNS.FIND_ONE_USER, { id }));
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async createUser(@Body() dto: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.CREATE_USER, dto));
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return callService(this.authClient.send(AUTH_PATTERNS.UPDATE_USER, { id, dto }));
  }

  @Patch('users/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar/Desactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario cambiado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return callService(this.authClient.send(AUTH_PATTERNS.TOGGLE_USER, { id }));
  }
}
