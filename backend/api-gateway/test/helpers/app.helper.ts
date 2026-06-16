import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { of } from 'rxjs';
import { AppModule } from '../../src/app.module';
import { RpcExceptionFilter } from '../../src/common/rpc-exception.filter';
import { SERVICE_NAMES, Permission } from '../../src/common/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'sgd-dev-secret-key-2026';

/**
 * HU-17: permisos granulares por rol. Refleja ROLE_PERMISSIONS_MAP de ms-auth
 * para que los JWT de prueba lleven los permisos que PermissionsGuard verifica.
 */
const COLLAB_PERMS = [
  Permission.CREATE_REQUERIMIENTO,
  Permission.UPLOAD_DOCUMENT,
  Permission.DOWNLOAD_DOCUMENT,
  Permission.SIGN_DOCUMENT,
];
const STAFF_PERMS = [
  Permission.READ_ALL_REQUERIMIENTOS,
  Permission.CREATE_REQUERIMIENTO,
  Permission.CHANGE_REQUERIMIENTO_STATE,
  Permission.CLOSE_REQUERIMIENTO,
  Permission.UPLOAD_DOCUMENT,
  Permission.DOWNLOAD_DOCUMENT,
  Permission.SIGN_DOCUMENT,
  Permission.DELETE_DOCUMENT,
  Permission.READ_AUDIT_LOG,
  Permission.VIEW_REPORTS,
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(Permission),
  supervisor: STAFF_PERMS,
  gerente: STAFF_PERMS,
  colaborador: COLLAB_PERMS,
  contratista: [
    Permission.CREATE_REQUERIMIENTO,
    Permission.UPLOAD_DOCUMENT,
    Permission.DOWNLOAD_DOCUMENT,
  ],
  auditor: [
    Permission.READ_ALL_REQUERIMIENTOS,
    Permission.DOWNLOAD_DOCUMENT,
    Permission.READ_AUDIT_LOG,
    Permission.VIEW_REPORTS,
  ],
};

export function makeToken(payload: {
  id?: number;
  email?: string;
  rol: string;
  contratistaId?: number;
  permissions?: string[];
}): string {
  return jwt.sign(
    {
      sub: payload.id ?? 1,
      email: payload.email ?? 'test@sgd.cl',
      rol: payload.rol,
      permissions: payload.permissions ?? ROLE_PERMISSIONS[payload.rol] ?? [],
      contratistaId: payload.contratistaId ?? null,
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export const tokens = {
  admin: makeToken({ id: 1, email: 'admin@sgd.cl', rol: 'admin' }),
  supervisor: makeToken({ id: 2, email: 'supervisor@sgd.cl', rol: 'supervisor' }),
  colaborador: makeToken({ id: 3, email: 'colaborador@sgd.cl', rol: 'colaborador' }),
  auditor: makeToken({ id: 4, email: 'auditor@sgd.cl', rol: 'auditor' }),
  contratista: makeToken({ id: 5, email: 'contratista@sgd.cl', rol: 'contratista', contratistaId: 1 }),
};

export function mockTcpClient() {
  return { send: jest.fn().mockReturnValue(of({})) };
}

export interface TestClients {
  auth: ReturnType<typeof mockTcpClient>;
  mantenedores: ReturnType<typeof mockTcpClient>;
  requerimientos: ReturnType<typeof mockTcpClient>;
  almacenamiento: ReturnType<typeof mockTcpClient>;
  auditoria: ReturnType<typeof mockTcpClient>;
}

export async function buildTestApp(): Promise<{ app: INestApplication; clients: TestClients }> {
  const auth = mockTcpClient();
  const mantenedores = mockTcpClient();
  const requerimientos = mockTcpClient();
  const almacenamiento = mockTcpClient();
  const auditoria = mockTcpClient();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SERVICE_NAMES.AUTH).useValue(auth)
    .overrideProvider(SERVICE_NAMES.MANTENEDORES).useValue(mantenedores)
    .overrideProvider(SERVICE_NAMES.REQUERIMIENTOS).useValue(requerimientos)
    .overrideProvider(SERVICE_NAMES.ALMACENAMIENTO).useValue(almacenamiento)
    .overrideProvider(SERVICE_NAMES.AUDITORIA).useValue(auditoria)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return { app, clients: { auth, mantenedores, requerimientos, almacenamiento, auditoria } };
}
