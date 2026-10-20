import { Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class ClientesService {

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(dto: CreateClienteDto) {

    const existe = await this.clienteRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'Ya existe un cliente con ese email.',
      );
    }

    const cliente = this.clienteRepository.create(dto);

    return this.clienteRepository.save(cliente);
  }

  async findAll(
    buscar?: string,
    page: number = 1,
    limit: number = 10,
  ) {

    const skip = (page - 1) * limit;

    const where = buscar
      ? [
          {
            nombre: Like(`%${buscar}%`),
            activo: true,
          },
          {
            apellido: Like(`%${buscar}%`),
            activo: true,
          },
          {
            email: Like(`%${buscar}%`),
            activo: true,
          },
        ]
      : {
          activo: true,
        };

    const [data, total] =
      await this.clienteRepository.findAndCount({
        where,
        order: {
          apellido: 'ASC',
        },
        skip,
        take: limit,
      });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllIncludingInactive() {

    return this.clienteRepository.find({
      order: {
        apellido: 'ASC',
      },
    });

  }

  async findOne(id: number) {

    const cliente = await this.clienteRepository.findOne({
      where: {
        id,
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  async update(id: number, dto: UpdateClienteDto) {
  const cliente = await this.findOne(id);

  if (dto.email && dto.email.toLowerCase() !== cliente.email.toLowerCase()) {
    const existe = await this.clienteRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'Ya existe un cliente con ese email.',
      );
    }
  }

  Object.assign(cliente, dto);

  return this.clienteRepository.save(cliente);
}
  async remove(id: number) {

    const cliente = await this.findOne(id);

    cliente.activo = false;

    return this.clienteRepository.save(cliente);
  }

  async reactivar(id: number) {

    const cliente = await this.findOne(id);

    cliente.activo = true;

    return this.clienteRepository.save(cliente);
  }

  
}