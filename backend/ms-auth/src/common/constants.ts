/**
 * Constantes compartidas — ms-auth
 * Roles y patrones TCP de este servicio.
 */
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
}

export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
  PROFILE: 'auth.profile',
  FIND_ALL_USERS: 'auth.users.findAll',
  FIND_ONE_USER: 'auth.users.findOne',
  CREATE_USER: 'auth.users.create',
  UPDATE_USER: 'auth.users.update',
  TOGGLE_USER: 'auth.users.toggle',
  SEED_ADMIN: 'auth.seedAdmin',
  VALIDATE_USER: 'auth.validateUser',
} as const;
