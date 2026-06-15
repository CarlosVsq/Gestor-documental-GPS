import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import {
  AccionAuditoria,
  AUDITORIA_PATTERNS,
  SERVICE_NAMES,
} from '../constants';
import { NotificacionesDispatchService } from '../../notificaciones/notificaciones-dispatch.service';

const METODOS_AUDITABLES = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const CLAVES_SENSIBLES = ['password', 'contraseña', 'contrasena', 'token', 'access_token'];
const MAX_PAYLOAD_CHARS = 4000;
const AUDIT_TIMEOUT_MS = 3000;

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(
    @Inject(SERVICE_NAMES.AUDITORIA) private readonly client: ClientProxy,
    private readonly notifDispatch: NotificacionesDispatchService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    if (!METODOS_AUDITABLES.has(req.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseData) => {
        try {
          this.registrar(context, req, responseData);
        } catch (e) {
          this.logger.warn(`No se pudo construir el evento de auditoria: ${e?.message}`);
        }
        try {
          this.dispatchNotificaciones(req, responseData);
        } catch (e) {
          this.logger.warn(`No se pudieron despachar notificaciones: ${e?.message}`);
        }
      }),
    );
  }

  /**
   * HU-34/HU-35: tras una mutación exitosa, decide si corresponde notificar y
   * delega en NotificacionesDispatchService (fire-and-forget). El `tap` solo se
   * dispara en respuestas exitosas, así que no notificamos sobre errores.
   */
  private dispatchNotificaciones(req: any, responseData: unknown) {
    const ruta = (req.originalUrl || req.url || '').split('?')[0];

    // HU-34: POST /api/almacenamiento/upload(-bulk)
    if (req.method === 'POST' && /\/almacenamiento\/[^/]*upload/.test(ruta)) {
      this.notifDispatch.onDocumentoSubido(req, responseData).catch(() => undefined);
      return;
    }

    // HU-35: PATCH/PUT /api/requerimientos/:id/estado
    if (
      (req.method === 'PATCH' || req.method === 'PUT') &&
      /\/requerimientos\/\d+\/estado\b/.test(ruta)
    ) {
      this.notifDispatch.onCambioEstado(req, responseData).catch(() => undefined);
    }
  }

  private registrar(context: ExecutionContext, req: any, responseData: unknown) {
    const res = context.switchToHttp().getResponse();
    const ruta = (req.originalUrl || req.url || '').split('?')[0];
    const segmentos = ruta.replace(/^\/?(api\/)?/, '').split('/').filter(Boolean);

    const entidad = (segmentos[0] || 'desconocido').slice(0, 60);
    const entidadId = this.primerNumero(segmentos);
    const requerimientoId = this.resolverRequerimientoId(req, entidad, entidadId);

    const payload = {
      accion: this.derivarAccion(req.method, ruta),
      entidad,
      entidadId,
      requerimientoId,
      usuarioId: req.user?.id ?? undefined,
      usuarioEmail: req.user?.email ?? undefined,
      usuarioRol: req.user?.rol ?? undefined,
      metodoHttp: req.method,
      ruta: ruta.slice(0, 255),
      statusCode: res?.statusCode,
      ip: (req.ip || req.socket?.remoteAddress || '').slice(0, 60),
      userAgent: (req.headers?.['user-agent'] || '').slice(0, 512),
      datosDespues: this.sanitizar(responseData),
    };

    this.client
      .send(AUDITORIA_PATTERNS.REGISTRAR, payload)
      .pipe(
        timeout(AUDIT_TIMEOUT_MS),
        catchError((err) => {
          this.logger.warn(`Auditoria no registrada (${payload.accion} ${entidad}): ${err?.message}`);
          return of(null);
        }),
      )
      .subscribe();
  }

  private resolverRequerimientoId(req: any, entidad: string, entidadId?: number): number | undefined {
    const delBody = Number(req.body?.requerimientoId);
    if (Number.isInteger(delBody) && delBody > 0) return delBody;
    return entidad === 'requerimientos' ? entidadId : undefined;
  }

  private derivarAccion(method: string, ruta: string): AccionAuditoria {
    if (/\/firmar\b/.test(ruta)) return AccionAuditoria.SIGN;
    if (/\/estado\b/.test(ruta)) return AccionAuditoria.STATE_CHANGE;
    switch (method) {
      case 'POST':
        return AccionAuditoria.CREATE;
      case 'PATCH':
      case 'PUT':
        return AccionAuditoria.UPDATE;
      case 'DELETE':
        return AccionAuditoria.DELETE;
      default:
        return AccionAuditoria.UPDATE;
    }
  }

  private primerNumero(segmentos: string[]): number | undefined {
    for (const s of segmentos) {
      if (/^\d+$/.test(s)) return Number(s);
    }
    return undefined;
  }

  private sanitizar(data: unknown): Record<string, any> | undefined {
    if (data === null || data === undefined) return undefined;
    if (typeof data !== 'object') return { valor: data };
    if (Buffer.isBuffer(data) || data instanceof StreamableFile) return undefined;

    try {
      const serializado = JSON.stringify(data, (key, value) =>
        CLAVES_SENSIBLES.includes(key.toLowerCase()) ? '[REDACTED]' : value,
      );
      if (!serializado) return undefined;
      if (serializado.length > MAX_PAYLOAD_CHARS) {
        return { _truncado: true, _bytes: serializado.length };
      }
      const limpio = JSON.parse(serializado);
      return Array.isArray(limpio) ? { items: limpio } : limpio;
    } catch {
      return undefined;
    }
  }
}
