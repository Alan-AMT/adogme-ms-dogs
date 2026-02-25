import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
//This is how the decorator is going to be used
// @Roles('admin', 'user')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);