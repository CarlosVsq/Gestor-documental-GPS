import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AUTH_PATTERNS } from './common/constants';

/**
 * Controller de Auth — Microservicio TCP
 * Reemplaza los decoradores HTTP (@Get, @Post) por @MessagePattern
 * para comunicación TCP con el API Gateway.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @MessagePattern(AUTH_PATTERNS.PROFILE)
  async getProfile(@Payload() data: { userId: number }) {
    return this.authService.getProfile(data.userId);
  }

  @MessagePattern(AUTH_PATTERNS.FIND_ALL_USERS)
  async findAll() {
    return this.authService.findAll();
  }

  @MessagePattern(AUTH_PATTERNS.FIND_ONE_USER)
  async findOne(@Payload() data: { id: number }) {
    return this.authService.findOne(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.CREATE_USER)
  async createUser(@Payload() dto: any) {
    return this.authService.createUser(dto);
  }

  @MessagePattern(AUTH_PATTERNS.UPDATE_USER)
  async updateUser(@Payload() data: { id: number; dto: any }) {
    return this.authService.updateUser(data.id, data.dto);
  }

  @MessagePattern(AUTH_PATTERNS.TOGGLE_USER)
  async toggleActive(@Payload() data: { id: number }) {
    return this.authService.toggleActive(data.id);
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE_USER)
  async validateUser(@Payload() data: { userId: number }) {
    return this.authService.getProfile(data.userId);
  }
}
