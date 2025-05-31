import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../../controllers/auth/types/token-payload.interface';
import { Request } from 'express';
import { AuthService } from '../../services/auth.service';
@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('REFRESH_JWT_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: TokenPayload) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    const userId = payload.userId;
    return this.authService.validateRefreshToken(userId, refreshToken || '');
  }
}
