import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOidcGuard implements CanActivate {
  private readonly client = new OAuth2Client();
  private readonly logger = new Logger(GoogleOidcGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header');
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    // Retrieve configuration from environment variables
    // const expectedAudience = this.configService.get<string>('OIDC_AUDIENCE');
    const expectedAudience =
      'https://adogme-ms-dogs-1087097859781.us-central1.run.app';
    const expectedServiceAccountEmail = this.configService.get<string>(
      'OIDC_SERVICE_ACCOUNT_EMAIL',
    );

    if (!expectedAudience || !expectedServiceAccountEmail) {
      this.logger.error(
        'OIDC_AUDIENCE or OIDC_SERVICE_ACCOUNT_EMAIL is not configured',
      );
      throw new UnauthorizedException(
        'Internal server error: OIDC configuration missing',
      );
    }

    try {
      // Verify the token with Google
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: expectedAudience,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check if the token comes from the authorized Service Account
      if (payload.email !== expectedServiceAccountEmail) {
        this.logger.warn(
          `Unauthorized service account access attempt from: ${payload.email}`,
        );
        throw new UnauthorizedException('Invalid Service Account');
      }

      return true;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
