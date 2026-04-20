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
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { DocumentosService } from './documentos.service';
import { createReadStream } from 'fs';
import type { Response } from 'express';

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.EDITOR)
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    // req.user viene del JwtAuthGuard
    return this.documentosService.create(file, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Obtener todos los documentos subidos' })
  async findAll() {
    return this.documentosService.findAll();
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Descargar el archivo físico de un documento' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filePath, originalName } = await this.documentosService.getFilePathConfig(id);
    const fileStream = createReadStream(filePath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${originalName}"`,
    });

    return new StreamableFile(fileStream);
  }
}
