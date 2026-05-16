import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  Res,
  ParseIntPipe,
  BadRequestException,
  Inject,
  HttpException,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { callService } from '../common/rpc.utils';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  Role,
  SERVICE_NAMES,
  ALMACENAMIENTO_PATTERNS,
} from '../common/constants';

// ─── Multer en memoria (no disco) — el buffer va a SeaweedFS ─────────────────
const memStorage = memoryStorage();

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

@ApiTags('Almacenamiento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('almacenamiento')
export class AlmacenamientoGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.ALMACENAMIENTO) private readonly client: ClientProxy,
  ) {}

  // ─── Carga Individual (HU-07) ─────────────────────────────────────────────

  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'HU-07: Subir un documento individual a un requerimiento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'requerimientoId'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Archivo (PDF, DOCX, XLSX, imágenes — máx 50 MB)' },
        requerimientoId: { type: 'integer', description: 'ID del requerimiento al que pertenece el archivo' },
        storagePath: { type: 'string', description: 'Path en SeaweedFS (se obtiene del requerimiento automáticamente)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memStorage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const requerimientoId = parseInt(req.body?.requerimientoId, 10);
    if (!requerimientoId || isNaN(requerimientoId)) {
      throw new BadRequestException('El campo requerimientoId es obligatorio');
    }

    const storagePath = req.body?.storagePath || null;

    try {
      return await firstValueFrom(
        this.client.send(ALMACENAMIENTO_PATTERNS.UPLOAD, {
          nombreOriginal: file.originalname,
          mimeType: file.mimetype,
          tamañoBytes: file.size,
          requerimientoId,
          autorId: req.user.id,
          creadoPor: req.user.nombre || req.user.email,
          fileBase64: file.buffer.toString('base64'),
          storagePath,
          metadataAudit: {
            ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || '',
          },
        }),
      );
    } catch (error) {
      throw new HttpException(
        error?.message || error?.error?.message || 'Error al subir archivo',
        error?.statusCode || error?.error?.statusCode || 500,
      );
    }
  }

  // ─── Carga Masiva (HU-08) ─────────────────────────────────────────────────

  @Post('upload-bulk')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'HU-08: Carga masiva de documentos (hasta 20 archivos)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'requerimientoId'],
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        requerimientoId: { type: 'integer' },
        storagePath: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20, {
    storage: memStorage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  }))
  async uploadBulk(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const requerimientoId = parseInt(req.body?.requerimientoId, 10);
    if (!requerimientoId || isNaN(requerimientoId)) {
      throw new BadRequestException('El campo requerimientoId es obligatorio');
    }

    const storagePath = req.body?.storagePath || null;
    const metadataAudit = {
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || '',
    };

    const filesPayload = files.map((file) => ({
      nombreOriginal: file.originalname,
      mimeType: file.mimetype,
      tamañoBytes: file.size,
      requerimientoId,
      autorId: req.user.id,
      creadoPor: req.user.nombre || req.user.email,
      fileBase64: file.buffer.toString('base64'),
      storagePath,
      metadataAudit,
    }));

    try {
      return await firstValueFrom(
        this.client.send(ALMACENAMIENTO_PATTERNS.UPLOAD_BULK, { files: filesPayload }),
      );
    } catch (error) {
      throw new HttpException(
        error?.message || 'Error en carga masiva',
        error?.statusCode || 500,
      );
    }
  }

  // ─── Descarga (HU-09) ─────────────────────────────────────────────────────

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.AUDITOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'Descargar un archivo directamente desde SeaweedFS' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { base64, contentType, nombreOriginal } = await firstValueFrom(
        this.client.send(ALMACENAMIENTO_PATTERNS.DOWNLOAD, { id }),
      );

      const buffer = Buffer.from(base64, 'base64');
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(nombreOriginal)}"`,
        'Content-Length': buffer.length.toString(),
      });

      return new StreamableFile(buffer);
    } catch (error) {
      throw new HttpException(
        error?.message || 'Archivo no encontrado',
        error?.statusCode || error?.error?.statusCode || 404,
      );
    }
  }

  // ─── Documentos de un Requerimiento ──────────────────────────────────────

  @Get('requerimiento/:reqId')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.AUDITOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'Obtener todos los documentos de un Requerimiento' })
  async findByRequerimiento(@Param('reqId', ParseIntPipe) reqId: number) {
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.FIND_BY_REQUERIMIENTO, { requerimientoId: reqId }));
  }

  // ─── Búsqueda por Metadatos (HU-09, HU-31) ───────────────────────────────

  @Get('search')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.AUDITOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'HU-31: Búsqueda de documentos por metadatos heredados del requerimiento' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto parcial del nombre del archivo' })
  @ApiQuery({ name: 'contratistaId', required: false, type: Number })
  @ApiQuery({ name: 'proyectoId', required: false, type: Number })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'categoriaId', required: false, type: Number })
  @ApiQuery({ name: 'estadoDocumento', required: false, enum: ['BORRADOR', 'OFICIAL', 'OBSOLETO'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query() query: any) {
    const filtros = {
      q: query.q,
      contratistaId: query.contratistaId ? parseInt(query.contratistaId) : undefined,
      proyectoId: query.proyectoId ? parseInt(query.proyectoId) : undefined,
      areaId: query.areaId ? parseInt(query.areaId) : undefined,
      categoriaId: query.categoriaId ? parseInt(query.categoriaId) : undefined,
      requerimientoId: query.requerimientoId ? parseInt(query.requerimientoId) : undefined,
      estadoDocumento: query.estadoDocumento,
      mimeType: query.mimeType,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    };
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.SEARCH, filtros));
  }

  // ─── Árbol Jerárquico (HU-32) ─────────────────────────────────────────────

  @Get('tree')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.AUDITOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'HU-32: Árbol jerárquico Contratista→Área→Proyecto→Requerimiento→Docs' })
  async getTree() {
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.GET_TREE, {}));
  }

  // ─── Generar PDF Inmutable (HU-29) ────────────────────────────────────────

  @Post('pdf/:requerimientoId')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'HU-29: Generar PDF inmutable de cierre del requerimiento' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        storagePath: { type: 'string' },
        firmaBase64: { type: 'string', description: 'PNG del canvas de firma (base64 data URL)' },
      },
    },
  })
  async generatePdf(
    @Param('requerimientoId', ParseIntPipe) requerimientoId: number,
    @Req() req: any,
  ) {
    const { storagePath, firmaBase64 } = req.body || {};
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.GENERATE_PDF, {
      requerimientoId,
      firmadoPorId: req.user.id,
      firmaBase64: firmaBase64 || null,
      storagePath: storagePath || `/${requerimientoId}`,
    }));
  }

  // ─── Obtener uno / Eliminar ───────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.AUDITOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'Obtener metadata de un documento por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.FIND_ONE, { id }));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar documento (soft delete + borrado de SeaweedFS)' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await callService(this.client.send(ALMACENAMIENTO_PATTERNS.DELETE, { id }));
    return { message: 'Documento eliminado exitosamente' };
  }

  // ─── Crear Expediente (HU-N4) ─────────────────────────────────────────────

  @Post('expediente')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'HU-N4: Crear expediente (directorio en SeaweedFS) para un Requerimiento' })
  async createExpediente(@Req() req: any) {
    const { contratistaId, areaId, proyectoId, codigoTicket } = req.body;
    if (!contratistaId || !areaId || !proyectoId || !codigoTicket) {
      throw new BadRequestException('Faltan campos obligatorios: contratistaId, areaId, proyectoId, codigoTicket');
    }
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.CREATE_EXPEDIENTE, {
      contratistaId: parseInt(contratistaId),
      areaId: parseInt(areaId),
      proyectoId: parseInt(proyectoId),
      codigoTicket,
    }));
  }

  // ─── Cambiar estado de documento ──────────────────────────────────────────

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'Cambiar estado de un documento: BORRADOR → OFICIAL → OBSOLETO' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['estado'],
      properties: {
        estado: { type: 'string', enum: ['BORRADOR', 'OFICIAL', 'OBSOLETO'] },
      },
    },
  })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
  ) {
    if (!body?.estado) {
      throw new BadRequestException('El campo estado es obligatorio');
    }
    if (!['BORRADOR', 'OFICIAL', 'OBSOLETO'].includes(body.estado)) {
      throw new BadRequestException('Estado inválido. Valores permitidos: BORRADOR, OFICIAL, OBSOLETO');
    }
    return callService(this.client.send(ALMACENAMIENTO_PATTERNS.UPDATE_ESTADO, { id, estado: body.estado }));
  }

  // ─── Firmar documento PDF (HU-11) ─────────────────────────────────────────

  @Post(':id/firmar')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR, Role.CONTRATISTA)
  @ApiOperation({ summary: 'HU-11: Estampar firma en un PDF — descarga versión firmada (no se guarda)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firmaBase64'],
      properties: {
        firmaBase64: { type: 'string', description: 'PNG data URL del canvas de firma' },
        pagina: { type: 'integer', description: 'Página (0-indexed, default 0)' },
        xPct: { type: 'number' }, yPct: { type: 'number' },
        anchoPct: { type: 'number' }, altoPct: { type: 'number' },
      },
    },
  })
  async firmarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      firmaBase64: string;
      pagina?: number;
      xPct?: number; yPct?: number;
      anchoPct?: number; altoPct?: number;
    },
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body?.firmaBase64) {
      throw new BadRequestException('El campo firmaBase64 es obligatorio');
    }
    try {
      const { pdfBase64, filename } = await firstValueFrom(
        this.client.send(ALMACENAMIENTO_PATTERNS.FIRMAR_DOCUMENTO, {
          documentoId: id,
          firmaBase64: body.firmaBase64,
          pagina: body.pagina,
          xPct: body.xPct, yPct: body.yPct,
          anchoPct: body.anchoPct, altoPct: body.altoPct,
          firmadoPorId: req.user.id,
          creadoPor: req.user.nombre || req.user.email,
        }),
      );

      const buffer = Buffer.from(pdfBase64, 'base64');
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      });
      return new StreamableFile(buffer);
    } catch (error) {
      throw new HttpException(
        error?.message || error?.error?.message || 'Error al firmar documento',
        error?.statusCode || error?.error?.statusCode || 500,
      );
    }
  }
}
