// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { ROLES_KEY } from './roles.decorator.js';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     // 1. Get the roles required for this specific route
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     // If no roles are defined on the route, allow access
//     if (!requiredRoles) {
//       return true;
//     }

//     // 2. Extract the user from the request (previously attached by your AuthGuard)
//     const request = context.switchToHttp().getRequest();
//     const user = request.user; // This was populated by your decoding logic

//     if (!user || !user.role) {
//       throw new ForbiddenException('User role not found in Gateway data (token payload)');
//     }

//     // 3. Check if the user's role matches any of the required roles
//     const hasRole = requiredRoles.some((role) => user.role === role);

//     if (!hasRole) {
//       throw new ForbiddenException(`Access denied. Provided role does not match any of the required roles`);
//     }

//     return true;
//   }
// }