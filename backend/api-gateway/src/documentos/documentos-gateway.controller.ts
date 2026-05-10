import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  StreamableFile,
  Res,
  ParseIntPipe,
  BadRequestException,
  Inject,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, SERVICE_NAMES, DOCUMENTOS_PATTERNS, AUTH_PATTERNS } from '../common/constants';

// Configurar Multer para almacenamiento local en el Gateway
const uploadStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.DOCUMENTOS) private readonly client: ClientProxy,
    @Inject(SERVICE_NAMES.AUTH) private readonly authClient: ClientProxy,
  ) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'Subir un nuevo documento técnico' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    try {
      // El archivo ya se guardó en ./uploads via Multer.
      // Enviamos solo la metadata al microservicio.
      const newDoc = await firstValueFrom(
        this.client.send(DOCUMENTOS_PATTERNS.CREATE, {
          nombreOriginal: file.originalname,
          storageId: file.filename,
          mimeType: file.mimetype,
          tamañoBytes: file.size,
          autorId: req.user.id,
        }),
      );

      // Agregamos el autor al documento recién creado para el frontend
      return {
        ...newDoc,
        autor: {
          id: req.user.id,
          nombre: req.user.nombre,
          email: req.user.email,
        }
      };
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'Obtener todos los documentos subidos' })
  async findAll() {
    try {
      const docs = await firstValueFrom(this.client.send(DOCUMENTOS_PATTERNS.FIND_ALL, {}));
      
      // Obtener usuarios para hacer el JOIN manual (composición de microservicios)
      const users = await firstValueFrom(this.authClient.send(AUTH_PATTERNS.FIND_ALL_USERS, {}));
      const usersMap = new Map(users.map((u: any) => [u.id, u]));

      return docs.map((doc: any) => ({
        ...doc,
        autor: usersMap.get(doc.autorId) || { id: doc.autorId, nombre: 'Usuario Desconocido', email: '' }
      }));
    } catch (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.COLABORADOR)
  @ApiOperation({ summary: 'Descargar el archivo físico de un documento' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // Pedir info del archivo al microservicio
      const { storageId, originalName } = await firstValueFrom(
        this.client.send(DOCUMENTOS_PATTERNS.GET_FILE_PATH, { id }),
      );

      // El archivo está en el Gateway (./uploads)
      const filePath = join(process.cwd(), 'uploads', storageId);
      if (!existsSync(filePath)) {
        throw new BadRequestException('El archivo físico no se encuentra en el disco');
      }

      const fileStream = createReadStream(filePath);
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${originalName}"`,
      });

      return new StreamableFile(fileStream);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al descargar archivo',
        error.statusCode || error.status || 500,
      );
    }
  }
}
