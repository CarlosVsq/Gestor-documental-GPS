import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { of } from 'rxjs';
import { AppModule } from '../../src/app.module';
import { RpcExceptionFilter } from '../../src/common/rpc-exception.filter';
import { SERVICE_NAMES } from '../../src/common/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'sgd-dev-secret-key-2026';

export function makeToken(payload: {
  id?: number;
  email?: string;
  rol: string;
  contratistaId?: number;
}): string {
  return jwt.sign(
    {
      sub: payload.id ?? 1,
      email: payload.email ?? 'test@sgd.cl',
      rol: payload.rol,
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
}

export async function buildTestApp(): Promise<{ app: INestApplication; clients: TestClients }> {
  const auth = mockTcpClient();
  const mantenedores = mockTcpClient();
  const requerimientos = mockTcpClient();
  const almacenamiento = mockTcpClient();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SERVICE_NAMES.AUTH).useValue(auth)
    .overrideProvider(SERVICE_NAMES.MANTENEDORES).useValue(mantenedores)
    .overrideProvider(SERVICE_NAMES.REQUERIMIENTOS).useValue(requerimientos)
    .overrideProvider(SERVICE_NAMES.ALMACENAMIENTO).useValue(almacenamiento)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return { app, clients: { auth, mantenedores, requerimientos, almacenamiento } };
}
