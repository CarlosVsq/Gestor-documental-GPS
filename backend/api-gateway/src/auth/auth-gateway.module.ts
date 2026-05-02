import { Module } from '@nestjs/common';
import { AuthGatewayController } from './auth-gateway.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthGatewayController],
  providers: [JwtStrategy, RolesGuard],
})
export class AuthGatewayModule {}
