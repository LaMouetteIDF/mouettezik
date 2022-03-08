import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/features/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async loginWithDiscord(@Query('code') code: string) {
    if (!code) throw new UnauthorizedException('cannot found code query.');
    await this.authService.login(code);
  }
}
