import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const header = request.headers['x-apigateway-api-userinfo'];

  if (!header) return null;

  const base64 = header.replace(/-/g, '+').replace(/_/g, '/');
  const user = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

  // If a specific property is requested (e.g. @User('role')), return that
  return data ? user?.[data] : user;
});