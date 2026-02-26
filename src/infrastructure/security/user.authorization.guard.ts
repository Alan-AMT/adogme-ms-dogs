import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class UserAuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-apigateway-api-userinfo'];

    if (!header) throw new UnauthorizedException("User not found in header");

    // Decode Base64URL
    const base64 = header.replace(/-/g, '+').replace(/_/g, '/');
    const user = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    // ATTACHMENT POINT: Now request.user exists for the rest of the lifecycle
    request.user = user; 

    // 1. Get the roles required for this specific route
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are defined on the route, allow access
    if (!requiredRoles) {
      return true;
    }
    
    // 2. Extract the user from the request (previously attached by your AuthGuard)
    if (!user || !user.role) {
      throw new ForbiddenException('User role not found in Gateway data (token payload)');
    }
    
    // 3. Check if the user's role matches any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Provided role does not match any of the required roles`);
    }
    
    return true;
  }
}