import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as crypto from 'crypto';
import { SeaweedFsService } from '../seaweedfs/seaweedfs.service';
import { DocumentosService } from '../documentos/documentos.service';
import { EstadoDocumento } from '../common/constants';

/**
 * PdfService — Generación de PDF inmutable con firma digital (HU-29, HU-11)
 *
 * Al cerrar un Requerimiento, genera un PDF que compila:
 *   - Encabezado corporativo (SGD / GPS)
 *   - Datos completos del Requerimiento
 *   - Lista de documentos adjuntos con sus hashes SHA-256
 *   - Firma digital del responsable (imagen base64 incrustada)
 *   - Hash SHA-256 del propio PDF (para inmutabilidad ISO 30300)
 *
 * El PDF se sube a SeaweedFS y se registra como documento OFICIAL.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly seaweedFsService: SeaweedFsService,
    private readonly documentosService: DocumentosService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Genera el PDF inmutable de cierre de un Requerimiento.
   * Llamado cuando el estado cambia a 'Cerrado'.
   */
  async generateCierrePdf(params: {
    requerimientoId: number;
    firmadoPorId: number;
    firmaBase64?: string;  // PNG del canvas de firma (opcional)
    storagePath: string;
  }): Promise<{ documentoId: number; sha256Hash: string }> {
    // 1. Obtener datos del requerimiento
    const [reqData] = await this.dataSource.query(
      `SELECT r.*, p.nombre AS "proyectoNombre", a.nombre AS "areaNombre",
              c.nombre AS "contratistaNombre", cat.nombre AS "categoriaNombre"
       FROM requerimientos r
       LEFT JOIN proyectos p ON p.id = r."proyectoId"
       LEFT JOIN areas a ON a.id = r."areaId"
       LEFT JOIN contratistas c ON c.id = r."contratistaId"
       LEFT JOIN categorias cat ON cat.id = r."categoriaId"
       WHERE r.id = $1`,
      [params.requerimientoId],
    );

    if (!reqData) {
      throw new RpcException({ statusCode: 404, message: `Requerimiento #${params.requerimientoId} no encontrado` });
    }

    // 2. Obtener documentos adjuntos
    const documentos = await this.documentosService.findByRequerimiento(params.requerimientoId);

    // 3. Generar PDF con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const colors = {
      primary: rgb(0.08, 0.16, 0.38),    // Azul oscuro corporativo
      accent: rgb(0.18, 0.47, 0.87),     // Azul claro
      gray: rgb(0.5, 0.5, 0.5),
      black: rgb(0, 0, 0),
      white: rgb(1, 1, 1),
      lightGray: rgb(0.95, 0.95, 0.95),
    };

    let y = height - 60;

    // ─── Encabezado corporativo ────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: colors.primary });
    page.drawText('SGD — Sistema de Gestión Documental', {
      x: 40, y: height - 35,
      font: fontBold, size: 16, color: colors.white,
    });
    page.drawText('Expediente de Cierre de Requerimiento · Generado automáticamente', {
      x: 40, y: height - 55,
      font: fontRegular, size: 9, color: colors.white,
    });
    page.drawText(new Date().toLocaleString('es-CL'), {
      x: width - 180, y: height - 45,
      font: fontRegular, size: 9, color: colors.white,
    });

    y = height - 100;

    // ─── Datos del requerimiento ───────────────────────────────────────────
    const drawField = (label: string, value: string, yPos: number): number => {
      page.drawText(label, { x: 40, y: yPos, font: fontBold, size: 9, color: colors.gray });
      page.drawText(value || '—', { x: 180, y: yPos, font: fontRegular, size: 10, color: colors.black });
      return yPos - 20;
    };

    page.drawText('DATOS DEL REQUERIMIENTO', {
      x: 40, y: y, font: fontBold, size: 11, color: colors.primary,
    });
    y -= 8;
    page.drawRectangle({ x: 40, y: y, width: width - 80, height: 1, color: colors.accent });
    y -= 20;

    y = drawField('Código:', reqData.codigoTicket, y);
    y = drawField('Título:', reqData.titulo, y);
    y = drawField('Descripción:', reqData.descripcion || '—', y);
    y = drawField('Estado:', reqData.estado, y);
    y = drawField('Prioridad:', reqData.prioridad, y);
    y = drawField('Contratista:', reqData.contratistaNombre || `ID: ${reqData.contratistaId}`, y);
    y = drawField('Área:', reqData.areaNombre || `ID: ${reqData.areaId}`, y);
    y = drawField('Proyecto:', reqData.proyectoNombre || `ID: ${reqData.proyectoId}`, y);
    y = drawField('Categoría:', reqData.categoriaNombre || `ID: ${reqData.categoriaId}`, y);
    y = drawField('Fecha Creación:', new Date(reqData.creadoEn).toLocaleDateString('es-CL'), y);
    y = drawField('Fecha Cierre:', reqData.fechaCierre ? new Date(reqData.fechaCierre).toLocaleDateString('es-CL') : '—', y);

    y -= 20;

    // ─── Documentos adjuntos ───────────────────────────────────────────────
    page.drawText('DOCUMENTOS ADJUNTOS', {
      x: 40, y, font: fontBold, size: 11, color: colors.primary,
    });
    y -= 8;
    page.drawRectangle({ x: 40, y, width: width - 80, height: 1, color: colors.accent });
    y -= 20;

    if (documentos.length === 0) {
      page.drawText('Sin documentos adjuntos', { x: 40, y, font: fontRegular, size: 9, color: colors.gray });
      y -= 20;
    } else {
      // Cabecera de tabla
      page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: colors.lightGray });
      page.drawText('N°', { x: 45, y: y, font: fontBold, size: 8, color: colors.black });
      page.drawText('Nombre Archivo', { x: 65, y, font: fontBold, size: 8, color: colors.black });
      page.drawText('Tipo', { x: 280, y, font: fontBold, size: 8, color: colors.black });
      page.drawText('Estado', { x: 360, y, font: fontBold, size: 8, color: colors.black });
      page.drawText('SHA-256 (parcial)', { x: 430, y, font: fontBold, size: 8, color: colors.black });
      y -= 18;

      for (const [i, doc] of documentos.entries()) {
        if (y < 100) break; // Prevenir overflow de página
        page.drawText(`${i + 1}`, { x: 45, y, font: fontRegular, size: 8, color: colors.black });
        const nombre = doc.nombreOriginal.length > 28 ? doc.nombreOriginal.substring(0, 25) + '...' : doc.nombreOriginal;
        page.drawText(nombre, { x: 65, y, font: fontRegular, size: 8, color: colors.black });
        page.drawText(doc.mimeType.split('/')[1]?.toUpperCase() || '—', { x: 280, y, font: fontRegular, size: 8, color: colors.black });
        page.drawText(doc.estadoDocumento, { x: 360, y, font: fontRegular, size: 8, color: colors.black });
        page.drawText(doc.sha256Hash ? doc.sha256Hash.substring(0, 16) + '…' : '—', { x: 430, y, font: fontRegular, size: 8, color: colors.gray });
        y -= 16;
      }
    }

    y -= 20;

    // ─── Firma digital ─────────────────────────────────────────────────────
    if (params.firmaBase64) {
      try {
        const firmaBuffer = Buffer.from(params.firmaBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
        const firmaImg = await pdfDoc.embedPng(firmaBuffer);
        const firmaDims = firmaImg.scale(0.4);

        const auditText = `Firmado el ${new Date().toLocaleString('es-CL')}, Sistema de Gestion Documental - GPS`;

        if (y < 120) {
          const sigPage = pdfDoc.addPage([595, 842]);
          y = 700;
          sigPage.drawText('FIRMA DIGITAL DEL RESPONSABLE', {
            x: 40, y, font: fontBold, size: 11, color: colors.primary,
          });
          y -= 10;
          sigPage.drawImage(firmaImg, { x: 40, y: y - firmaDims.height, width: firmaDims.width, height: firmaDims.height });
          sigPage.drawText(auditText, { x: 40, y: y - firmaDims.height - 12, font: fontRegular, size: 7, color: colors.gray });
          y -= firmaDims.height + 30;
        } else {
          page.drawText('FIRMA DIGITAL DEL RESPONSABLE', {
            x: 40, y, font: fontBold, size: 11, color: colors.primary,
          });
          y -= 10;
          page.drawImage(firmaImg, { x: 40, y: y - firmaDims.height, width: firmaDims.width, height: firmaDims.height });
          page.drawText(auditText, { x: 40, y: y - firmaDims.height - 12, font: fontRegular, size: 7, color: colors.gray });
          y -= firmaDims.height + 30;
        }
      } catch (err) {
        this.logger.warn(`No se pudo incrustar la firma: ${err?.message}`);
      }
    }

    // ─── Footer con hash placeholder ──────────────────────────────────────
    page.drawText('Documento generado automáticamente por SGD · GPS - UBB 2026 · ISO 30300', {
      x: 40, y: 30, font: fontRegular, size: 7, color: colors.gray,
    });

    // 4. Serializar PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 5. Calcular SHA-256 del PDF completo
    const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // 6. Subir a SeaweedFS
    const pdfFilename = `cierre_${reqData.codigoTicket}_${Date.now()}.pdf`;
    const { path: pathSeaweed } = await this.seaweedFsService.uploadFile(
      params.storagePath,
      pdfFilename,
      pdfBuffer,
      'application/pdf',
    );

    // 7. Registrar en tabla documentos como OFICIAL
    const doc = await this.documentosService.upload({
      nombreOriginal: pdfFilename,
      mimeType: 'application/pdf',
      tamañoBytes: pdfBuffer.length,
      requerimientoId: params.requerimientoId,
      autorId: params.firmadoPorId,
      creadoPor: `usuario_${params.firmadoPorId}`,
      fileBase64: pdfBuffer.toString('base64'),
      storagePath: params.storagePath,
    });

    // Marcar como OFICIAL (el upload crea en BORRADOR por defecto)
    // Usamos el repositorio directamente vía dataSource para el update
    await this.dataSource.query(
      `UPDATE documentos SET "estadoDocumento" = $1, "sha256Hash" = $2 WHERE id = $3`,
      [EstadoDocumento.OFICIAL, sha256Hash, doc.id],
    );

    this.logger.log(`PDF inmutable generado: ${pdfFilename}, SHA-256: ${sha256Hash}`);
    return { documentoId: doc.id, sha256Hash };
  }

  /**
   * Estampa una firma digital en un PDF existente (HU-11).
   *
   * Descarga el PDF de SeaweedFS, incrustra la firma PNG en la posición indicada
   * (coordenadas relativas 0-1 respecto al tamaño de la página) y genera una nueva
   * versión firmada. El documento original queda intacto (inmutabilidad).
   *
   * @param params.documentoId  ID del documento PDF a firmar
   * @param params.firmaBase64  PNG data URL del canvas de firma
   * @param params.pagina       Página donde se estampa (0-indexed)
   * @param params.xPct         Posición X relativa (0-1)
   * @param params.yPct         Posición Y relativa (0-1, 0=abajo en PDF coords)
   * @param params.anchoPct     Ancho relativo de la firma (0-1)
   * @param params.altoPct      Alto relativo de la firma (0-1)
   * @param params.firmadoPorId ID del usuario que firma
   */
  async firmarDocumento(params: {
    documentoId: number;
    firmaBase64: string;
    pagina?: number;
    xPct?: number;
    yPct?: number;
    anchoPct?: number;
    altoPct?: number;
    firmadoPorId: number;
    creadoPor?: string;
  }): Promise<{ pdfBase64: string; filename: string; sha256Hash: string }> {
    // 1. Obtener metadata del documento original
    const docOriginal = await this.documentosService.findOne(params.documentoId);

    if (!docOriginal.mimeType.includes('pdf')) {
      throw new RpcException({
        statusCode: 400,
        message: 'Solo se puede firmar documentos de tipo PDF',
      });
    }

    if (!params.firmaBase64) {
      throw new RpcException({
        statusCode: 400,
        message: 'Se requiere una firma (firmaBase64) para estampar en el documento',
      });
    }

    // 2. Descargar PDF original de SeaweedFS
    const { buffer: pdfOriginalBuffer } = await this.seaweedFsService.downloadFile(docOriginal.pathSeaweed);

    // 3. Cargar PDF con pdf-lib y estampar la firma
    const pdfDoc = await PDFDocument.load(pdfOriginalBuffer);
    const pages = pdfDoc.getPages();
    const paginaIdx = Math.min(params.pagina ?? 0, pages.length - 1);
    const page = pages[paginaIdx];
    const { width: pageW, height: pageH } = page.getSize();

    const xPct = params.xPct ?? 0.55;
    const yPct = params.yPct ?? 0.06;
    const anchoPct = params.anchoPct ?? 0.35;
    const altoPct = params.altoPct ?? 0.12;

    const x = pageW * xPct;
    const y = pageH * yPct;
    const w = pageW * anchoPct;
    const h = pageH * altoPct;

    const firmaBuffer = Buffer.from(
      params.firmaBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
      'base64',
    );
    const firmaImg = await pdfDoc.embedPng(firmaBuffer);
    page.drawImage(firmaImg, { x, y, width: w, height: h });

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const auditText = `Firmado el ${new Date().toLocaleString('es-CL')}, Sistema de Gestion Documental - GPS`;
    page.drawText(auditText, { x, y: y - 12, font: fontRegular, size: 7, color: rgb(0.45, 0.45, 0.45) });

    // 4. Serializar y calcular hash — NO se guarda en SeaweedFS ni en BD
    const signedBytes = await pdfDoc.save();
    const signedBuffer = Buffer.from(signedBytes);
    const sha256Hash = crypto.createHash('sha256').update(signedBuffer).digest('hex');

    const baseName = docOriginal.nombreOriginal.replace(/\.pdf$/i, '');
    const filename = `${baseName}_firmado.pdf`;

    this.logger.log(`Documento firmado generado para descarga: ${filename}, SHA-256: ${sha256Hash}`);

    // Retorna los bytes en base64 para que el gateway los envíe como descarga directa
    return { pdfBase64: signedBuffer.toString('base64'), filename, sha256Hash };
  }
}
