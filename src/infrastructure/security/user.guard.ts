import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-apigateway-api-userinfo'];

    if (!header) throw new UnauthorizedException();

    // Decode Base64URL
    const base64 = header.replace(/-/g, '+').replace(/_/g, '/');
    const user = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    // ATTACHMENT POINT: Now request.user exists for the rest of the lifecycle
    request.user = user; 
    
    return true;
  }
}