import {
  Controller, Get, Post, Patch,
  Body, Param, Query, ParseIntPipe,
  Inject, UseGuards, Request, Res, StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { callService } from '../common/rpc.utils';
import { SERVICE_NAMES, REQUERIMIENTOS_PATTERNS, Role, Permission, CONTRATISTAS_PATTERNS } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

/**
 * Gateway Controller de Requerimientos — HU-17/HU-10
 * Proxy HTTP → TCP hacia ms-requerimientos.
 * 
 * HU-17: Endpoints protegidos con @Permissions() granulares.
 * - Crear: requiere CREATE_REQUERIMIENTO
 * - Listar: autenticado (filtro por contratistaId para contratistas)
 * - Cambiar estado: requiere CHANGE_REQUERIMIENTO_STATE
 */
@ApiTags('requerimientos')
@Controller('requerimientos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RequerimientosGatewayController {
  constructor(
    @Inject(SERVICE_NAMES.REQUERIMIENTOS) private readonly client: ClientProxy,
    @Inject(SERVICE_NAMES.MANTENEDORES) private readonly mantenedoresClient: ClientProxy,
  ) { }

  @Post()
  @Permissions(Permission.CREATE_REQUERIMIENTO)
  @ApiOperation({ summary: 'Crear un nuevo Requerimiento (Ticket)' })
  @ApiResponse({ status: 201, description: 'Requerimiento creado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear requerimientos' })
  async create(@Body() createDto: any, @Request() req: any) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.CREATE, {
      ...createDto,
      usuarioCreadorId: req.user.id,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'Listar Requerimientos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'prioridad', required: false })
  @ApiQuery({ name: 'proyectoId', required: false, type: Number })
  @ApiQuery({ name: 'areaId', required: false, type: Number })
  @ApiQuery({ name: 'contratistaId', required: false, type: Number })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Query('proyectoId') proyectoId?: string,
    @Query('areaId') areaId?: string,
    @Query('contratistaId') contratistaId?: string,
    @Request() req?: any,
  ) {
    // HU-N3: Contratistas solo ven sus propios requerimientos (forzado desde JWT).
    // Otros roles pueden filtrar opcionalmente pasando contratistaId como query param.
    const filterContratistaId =
      req.user.rol === Role.CONTRATISTA
        ? req.user.contratistaId
        : contratistaId ? Number(contratistaId) : undefined;

    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ALL, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      filtros: {
        contratistaId: filterContratistaId,
        estado,
        prioridad,
        proyectoId: proyectoId ? Number(proyectoId) : undefined,
        areaId: areaId ? Number(areaId) : undefined,
      },
    }));
  }

  @Get('volumen')
  @ApiOperation({ summary: 'HU-22: Volumen de requerimientos por contratista + serie mensual' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  async getVolumen(@Query() query: any, @Request() req: any) {
    const contratistaId =
      req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    return callService(
      this.client.send(REQUERIMIENTOS_PATTERNS.VOLUMEN, {
        contratistaId,
        desde: query.desde || undefined,
        hasta: query.hasta || undefined,
      }),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'HU-23: KPIs de estados de requerimientos (tiempo real)' })
  @ApiResponse({ status: 200, description: 'Conteos por estado, estancados y tendencia semanal' })
  async getStats(@Request() req: any) {
    // El contratista solo ve sus propios KPIs (HU-N3).
    const contratistaId = req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.STATS, { contratistaId }));
  }

  @Get('volumen/export')
  @ApiOperation({ summary: 'HU-24: Exportar volumen por contratista a Excel' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  async exportVolumen(
    @Query() query: any,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const contratistaId =
      req.user.rol === Role.CONTRATISTA ? req.user.contratistaId : undefined;

    const [volumenData, contratistasData] = await Promise.all([
      firstValueFrom(
        this.client.send(REQUERIMIENTOS_PATTERNS.VOLUMEN, {
          contratistaId,
          desde: query.desde || undefined,
          hasta: query.hasta || undefined,
        }),
      ),
      firstValueFrom(
        this.mantenedoresClient.send(CONTRATISTAS_PATTERNS.FIND_ALL, { page: 1, limit: 1000 }),
      ),
    ]);

    const nombreMap: Record<number, string> = {};
    (contratistasData?.data || []).forEach((c: any) => {
      nombreMap[c.id] = c.nombre;
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SGD — Sistema de Gestión Documental';
    workbook.created = new Date();

    const sheet1 = workbook.addWorksheet('Volumen por Contratista');
    sheet1.columns = [
      { header: 'Contratista', key: 'nombre', width: 30 },
      { header: 'Total Requerimientos', key: 'total', width: 22 },
      { header: 'Abiertos', key: 'abiertos', width: 12 },
      { header: 'En Progreso', key: 'enProgreso', width: 14 },
      { header: 'Cerrados', key: 'cerrados', width: 12 },
    ];
    sheet1.getRow(1).font = { bold: true };
    (volumenData?.byContratista || []).forEach((row: any) => {
      sheet1.addRow({
        nombre: nombreMap[row.contratistaId] || `Contratista #${row.contratistaId}`,
        total: row.total,
        abiertos: row.abiertos,
        enProgreso: row.enProgreso,
        cerrados: row.cerrados,
      });
    });

    const sheet2 = workbook.addWorksheet('Tendencia Mensual');
    sheet2.columns = [
      { header: 'Mes', key: 'mes', width: 12 },
      { header: 'Requerimientos Creados', key: 'creados', width: 24 },
    ];
    sheet2.getRow(1).font = { bold: true };
    (volumenData?.mensual || []).forEach((row: any) => {
      sheet2.addRow({ mes: row.mes, creados: row.creados });
    });

    const meta = workbook.addWorksheet('Filtros Aplicados');
    meta.addRow(['Filtro', 'Valor']);
    meta.addRow(['Desde', query.desde || 'Sin filtro']);
    meta.addRow(['Hasta', query.hasta || 'Sin filtro']);
    meta.addRow(['Generado', new Date().toISOString()]);

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const filename = `volumen-requerimientos-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un requerimiento por ID' })
  @ApiResponse({ status: 200, description: 'Requerimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Requerimiento no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.FIND_ONE, id));
  }

  @Patch(':id/estado')
  @Permissions(Permission.CHANGE_REQUERIMIENTO_STATE)
  @ApiOperation({ summary: 'Actualizar el estado del requerimiento' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para cambiar estado' })
  @ApiResponse({ status: 409, description: 'Transición de estado no permitida' })
  async updateState(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return callService(this.client.send(REQUERIMIENTOS_PATTERNS.UPDATE_STATE, { id, updateDto }));
  }
}
