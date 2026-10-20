import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MetodoPago } from './metodo-pago.entity';

@Injectable()
export class MetodoPagoService {

  constructor(
    @InjectRepository(MetodoPago)
    private metodoPagoRepository: Repository<MetodoPago>,
  ) {}

  async create(nombre: string) {

    if (!nombre || !nombre.trim()) {
      throw new BadRequestException(
        'El nombre del método de pago es obligatorio.',
      );
    }

    const nombreLimpio = nombre.trim();

    const existe = await this.metodoPagoRepository.findOne({
      where: {
        nombre: nombreLimpio,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'Ya existe un método de pago con ese nombre.',
      );
    }

    const metodoPago = this.metodoPagoRepository.create({
      nombre: nombreLimpio,
    });

    return this.metodoPagoRepository.save(metodoPago);
  }

  async findAll() {

    return this.metodoPagoRepository.find({
      where: {
        activo: true,
      },
      order: {
        nombre: 'ASC',
      },
    });

  }

  async findAllIncludingInactive() {

    return this.metodoPagoRepository.find({
      order: {
        nombre: 'ASC',
      },
    });

  }

  async findOne(id: number) {

    const metodoPago = await this.metodoPagoRepository.findOne({
      where: {
        id,
      },
    });

    if (!metodoPago) {
      throw new NotFoundException(
        'Método de pago no encontrado.',
      );
    }

    return metodoPago;
  }

  async update(id: number, nombre: string) {

    const metodoPago = await this.findOne(id);

    if (!nombre || !nombre.trim()) {
      throw new BadRequestException(
        'El nombre del método de pago es obligatorio.',
      );
    }

    const nombreLimpio = nombre.trim();

    const existe = await this.metodoPagoRepository.findOne({
      where: {
        nombre: nombreLimpio,
      },
    });

    if (existe && existe.id !== id) {
      throw new BadRequestException(
        'Ya existe un método de pago con ese nombre.',
      );
    }

    metodoPago.nombre = nombreLimpio;

    return this.metodoPagoRepository.save(metodoPago);
  }

  async remove(id: number) {

    const metodoPago = await this.findOne(id);

    metodoPago.activo = false;

    return this.metodoPagoRepository.save(metodoPago);
  }

  async reactivar(id: number) {

    const metodoPago = await this.findOne(id);

    metodoPago.activo = true;

    return this.metodoPagoRepository.save(metodoPago);
  }
}