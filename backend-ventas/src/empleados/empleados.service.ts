import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { Empleado } from './empleado.entity';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private repo: Repository<Empleado>,
  ) {}

 async create(data: CreateEmpleadoDto) {
    const existente = await this.repo.findOne({
      where: { dni: data.dni },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe un empleado con ese DNI',
      );
    }

    const empleado = this.repo.create({
      ...data,
      activo: true,
    });

    return this.repo.save(empleado);
  }

  async findAll(
    buscar?: string,
    page = 1,
    limit = 10,
  ) {
    const query = this.repo
      .createQueryBuilder('empleado')
      .where('empleado.activo = :activo', {
        activo: true,
      });

    if (buscar) {
      query.andWhere(
        `(empleado.nombre LIKE :buscar
        OR empleado.apellido LIKE :buscar
        OR empleado.dni LIKE :buscar
        OR empleado.email LIKE :buscar)`,
        {
          buscar: `%${buscar}%`,
        },
      );
    }

    const total = await query.getCount();

    const totalPages = Math.ceil(total / limit);

    const empleados = await query
      .orderBy('empleado.apellido', 'ASC')
      .addOrderBy('empleado.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: empleados,
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
        apellido: 'ASC',
        nombre: 'ASC',
      },
    });
  }

  async findInactive() {
    return this.repo.find({
      where: { activo: false },
      order: {
        apellido: 'ASC',
        nombre: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const empleado = await this.repo.findOne({
      where: { id },
    });

    if (!empleado) {
      throw new NotFoundException(
        'Empleado no encontrado',
      );
    }

    return empleado;
  }

  async update(id: number, data: UpdateEmpleadoDto) {
    const empleado = await this.findOne(id);

    if (
      data.dni &&
      data.dni !== empleado.dni
    ) {
      const existente = await this.repo.findOne({
        where: { dni: data.dni },
      });

      if (
        existente &&
        existente.id !== id
      ) {
        throw new ConflictException(
          'Ya existe un empleado con ese DNI',
        );
      }
    }

    Object.assign(empleado, data);

    return this.repo.save(empleado);
  }

  async remove(id: number) {
    const empleado = await this.findOne(id);

    empleado.activo = false;

    return this.repo.save(empleado);
  }

  async reactivate(id: number) {
    const empleado = await this.findOne(id);

    empleado.activo = true;

    return this.repo.save(empleado);
  }
}