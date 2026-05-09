import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Subtipo } from '../subtipos/subtipo.entity';

/**
 * Seed Service — Inyección inicial de datos de ejemplo
 * Se ejecuta automáticamente al arrancar ms-mantenedores.
 * Solo inserta datos si las tablas están vacías (idempotente).
 */
@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger('SeedService');

    constructor(
        @InjectRepository(Categoria)
        private readonly categoriaRepo: Repository<Categoria>,
        @InjectRepository(Subtipo)
        private readonly subtipoRepo: Repository<Subtipo>,
    ) {}

    async onModuleInit() {
        const count = await this.categoriaRepo.count();
        if (count > 0) {
            this.logger.log('🌱 Seed omitido: ya existen categorías en la BD.');
            return;
        }

        this.logger.log('🌱 Ejecutando seed inicial de Categorías y Subtipos...');

        // ── Categorías ──────────────────────────────────────
        const categorias = await this.categoriaRepo.save([
            this.categoriaRepo.create({ nombre: 'Seguridad', descripcion: 'Documentos relacionados a seguridad y prevención de riesgos', creadoPor: 'seed', actualizadoPor: 'seed' }),
            this.categoriaRepo.create({ nombre: 'Calidad', descripcion: 'Documentos de control y aseguramiento de calidad', creadoPor: 'seed', actualizadoPor: 'seed' }),
            this.categoriaRepo.create({ nombre: 'Medio Ambiente', descripcion: 'Documentos de gestión ambiental y sustentabilidad', creadoPor: 'seed', actualizadoPor: 'seed' }),
            this.categoriaRepo.create({ nombre: 'Administración', descripcion: 'Documentos administrativos y contractuales', creadoPor: 'seed', actualizadoPor: 'seed' }),
            this.categoriaRepo.create({ nombre: 'Ingeniería', descripcion: 'Planos, cálculos y documentación técnica de ingeniería', creadoPor: 'seed', actualizadoPor: 'seed' }),
        ]);

        // ── Subtipos por Categoría ──────────────────────────
        const subtiposData = [
            // Seguridad
            { nombre: 'Inducción Hombre Nuevo', descripcion: 'Registro de inducción para nuevos trabajadores', categoriaId: categorias[0].id },
            { nombre: 'Charla Diaria', descripcion: 'Registro de charlas de 5 minutos diarias', categoriaId: categorias[0].id },
            { nombre: 'Reporte de Incidente', descripcion: 'Documentación de incidentes o accidentes', categoriaId: categorias[0].id },
            { nombre: 'Permiso de Trabajo', descripcion: 'Permisos para trabajos especiales o de alto riesgo', categoriaId: categorias[0].id },
            // Calidad
            { nombre: 'Protocolo de Ensayo', descripcion: 'Protocolos de pruebas de materiales', categoriaId: categorias[1].id },
            { nombre: 'No Conformidad', descripcion: 'Registro de no conformidades detectadas', categoriaId: categorias[1].id },
            { nombre: 'Acta de Inspección', descripcion: 'Actas de inspección de obra', categoriaId: categorias[1].id },
            // Medio Ambiente
            { nombre: 'Declaración de Impacto', descripcion: 'Declaraciones de impacto ambiental', categoriaId: categorias[2].id },
            { nombre: 'Plan de Manejo de Residuos', descripcion: 'Planes de manejo y disposición de residuos', categoriaId: categorias[2].id },
            // Administración
            { nombre: 'Contrato', descripcion: 'Contratos y anexos contractuales', categoriaId: categorias[3].id },
            { nombre: 'Boleta de Garantía', descripcion: 'Boletas y garantías bancarias', categoriaId: categorias[3].id },
            { nombre: 'Estado de Pago', descripcion: 'Estados de pago mensuales', categoriaId: categorias[3].id },
            // Ingeniería
            { nombre: 'Plano As-Built', descripcion: 'Planos de construcción real (as-built)', categoriaId: categorias[4].id },
            { nombre: 'Memoria de Cálculo', descripcion: 'Memorias de cálculo estructural', categoriaId: categorias[4].id },
            { nombre: 'Especificación Técnica', descripcion: 'Especificaciones técnicas del proyecto', categoriaId: categorias[4].id },
        ];

        for (const sub of subtiposData) {
            await this.subtipoRepo.save(
                this.subtipoRepo.create({ ...sub, creadoPor: 'seed', actualizadoPor: 'seed' }),
            );
        }

        this.logger.log(`🌱 Seed completado: ${categorias.length} categorías y ${subtiposData.length} subtipos creados.`);
    }
}
