import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware que mide TODAS las requests HTTP, incluidas las rechazadas
 * por Guards (ej. 401/403 del JwtAuthGuard) que un Interceptor no vería.
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly duration: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly counter: Counter<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (this.shouldSkip(req)) {
      return next();
    }

    const start = process.hrtime.bigint();

    res.once('finish', () => {
      const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = this.resolveRoute(req);
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };
      this.duration.observe(labels, elapsedSeconds);
      this.counter.inc(labels);
    });

    next();
  }

  private shouldSkip(req: Request): boolean {
    const path = req.path || req.url || '';
    return path === '/metrics' || path.startsWith('/metrics?');
  }

  private resolveRoute(req: Request): string {
    const routePath = (req as Request & { route?: { path?: string } }).route
      ?.path;
    if (routePath) return routePath;
    const rawPath = (req.path || req.url || 'unknown').split('?')[0];
    return rawPath.replace(/\/\d+(?=\/|$)/g, '/:id');
  }
}
