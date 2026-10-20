import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { Proveedor } from './proveedor.entity';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private repo: Repository<Proveedor>,
  ) {}

  async create(data: CreateProveedorDto) {
    const existente = await this.repo.findOne({
      where: { cuit: data.cuit },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe un proveedor con ese CUIT',
      );
    }

    const proveedor = this.repo.create({
      ...data,
      activo: true,
    });

    return this.repo.save(proveedor);
  }

  async findAll(
    buscar?: string,
    page = 1,
    limit = 10,
  ) {
    const query = this.repo
      .createQueryBuilder('proveedor')
      .where('proveedor.activo = :activo', {
        activo: true,
      });

    if (buscar) {
      query.andWhere(
        `(proveedor.nombre LIKE :buscar
        OR proveedor.cuit LIKE :buscar
        OR proveedor.email LIKE :buscar)`,
        {
          buscar: `%${buscar}%`,
        },
      );
    }

    const total = await query.getCount();

    const totalPages = Math.ceil(total / limit);

    const proveedores = await query
      .orderBy('proveedor.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: proveedores,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllActive() {
    return this.repo.find({
      where: { activo: true },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async findInactive() {
    return this.repo.find({
      where: { activo: false },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const proveedor = await this.repo.findOne({
      where: { id },
    });

    if (!proveedor) {
      throw new NotFoundException(
        'Proveedor no encontrado',
      );
    }

    return proveedor;
  }

 async update(id: number, data: UpdateProveedorDto) {
    const proveedor = await this.findOne(id);

    if (
      data.cuit &&
      data.cuit !== proveedor.cuit
    ) {
      const existente = await this.repo.findOne({
        where: { cuit: data.cuit },
      });

      if (
        existente &&
        existente.id !== id
      ) {
        throw new ConflictException(
          'Ya existe un proveedor con ese CUIT',
        );
      }
    }

    Object.assign(proveedor, data);

    return this.repo.save(proveedor);
  }

  async remove(id: number) {
    const proveedor = await this.findOne(id);

    proveedor.activo = false;

    return this.repo.save(proveedor);
  }

  async reactivate(id: number) {
    const proveedor = await this.findOne(id);

    proveedor.activo = true;

    return this.repo.save(proveedor);
  }
}