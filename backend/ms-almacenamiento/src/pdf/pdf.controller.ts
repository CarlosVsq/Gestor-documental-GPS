import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PdfService } from './pdf.service';
import { ALMACENAMIENTO_PATTERNS } from '../common/constants';

@Controller()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  /** HU-29: Generar PDF inmutable al cerrar un Requerimiento */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.GENERATE_PDF)
  async generatePdf(@Payload() data: {
    requerimientoId: number;
    firmadoPorId: number;
    firmaBase64?: string;
    storagePath: string;
  }) {
    return this.pdfService.generateCierrePdf(data);
  }

  /** HU-11: Estampar firma en un PDF existente (genera versión firmada) */
  @MessagePattern(ALMACENAMIENTO_PATTERNS.FIRMAR_DOCUMENTO)
  async firmarDocumento(@Payload() data: {
    documentoId: number;
    firmaBase64: string;
    pagina?: number;
    xPct?: number;
    yPct?: number;
    anchoPct?: number;
    altoPct?: number;
    firmadoPorId: number;
    creadoPor?: string;
  }) {
    return this.pdfService.firmarDocumento(data);
  }
}
