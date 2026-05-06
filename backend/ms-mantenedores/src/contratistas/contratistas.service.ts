import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contratista } from './contratista.entity';
import { CreateContratistaDto } from './dto/create-contratista.dto';
import { UpdateContratistaDto } from './dto/update-contratista.dto';

/**
 * Servicio de Contratistas - HU-01
 * Implementa la lógica de negocio para el CRUD de contratistas.
 * Incluye soft delete y auditoría básica.
 */
@Injectable()
export class ContratistasService {
  constructor(
    @InjectRepository(Contratista)
    private readonly contratistaRepository: Repository<Contratista>,
  ) { }

  /**
   * CA-1: Crear un nuevo contratista
   */
  async create(createDto: CreateContratistaDto): Promise<Contratista> {
    const existente = await this.contratistaRepository.findOne({
      where: { rut: createDto.rut },
      withDeleted: true,
    });
    if (existente) {
      throw new RpcException({ statusCode: 409, message: `Ya existe un contratista con RUT ${createDto.rut}` });
    }

    const contratista = this.contratistaRepository.create({
      ...createDto,
      creadoPor: 'admin',
      actualizadoPor: 'admin',
    });
    return this.contratistaRepository.save(contratista);
  }

  /**
   * CA-2: Obtener todos los contratistas activos (paginados)
   */
  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Contratista[]; total: number }> {
    const [data, total] = await this.contratistaRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { creadoEn: 'DESC' },
    });
    return { data, total };
  }

  /**
   * Obtener un contratista por ID
   */
  async findOne(id: number): Promise<Contratista> {
    const contratista = await this.contratistaRepository.findOne({
      where: { id },
    });
    if (!contratista) {
      throw new RpcException({ statusCode: 404, message: `Contratista con ID ${id} no encontrado` });
    }
    return contratista;
  }

  /**
   * CA-3: Actualizar un contratista existente
   */
  async update(id: number, updateDto: UpdateContratistaDto): Promise<Contratista> {
    const contratista = await this.findOne(id);

    if (updateDto.rut && updateDto.rut !== contratista.rut) {
      const existente = await this.contratistaRepository.findOne({
        where: { rut: updateDto.rut },
        withDeleted: true,
      });
      if (existente) {
        throw new RpcException({ statusCode: 409, message: `Ya existe un contratista con RUT ${updateDto.rut}` });
      }
    }

    Object.assign(contratista, updateDto);
    contratista.actualizadoPor = 'admin';
    return this.contratistaRepository.save(contratista);
  }

  /**
   * CA-4: Desactivar/reactivar un contratista (toggle de estado)
   */
  async toggle(id: number): Promise<{ activo: boolean }> {
    const contratista = await this.findOne(id);
    contratista.activo = !contratista.activo;
    contratista.actualizadoPor = 'admin';
    await this.contratistaRepository.save(contratista);
    return { activo: contratista.activo };
  }

  /**
   * Obtener estadísticas básicas
   */
  async getStats(): Promise<{ total: number; activos: number; inactivos: number }> {
    const total = await this.contratistaRepository.count();
    const activos = await this.contratistaRepository.count({ where: { activo: true } });
    return {
      total,
      activos,
      inactivos: total - activos,
    };
  }
}
