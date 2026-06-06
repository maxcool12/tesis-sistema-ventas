import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private repo: Repository<Producto>,
  ) {}

  async findAll() {
    return await this.repo.find({
      where: {
        activo: true
      },
      relations: ['categoria']
    });
  }

  create(data: Partial<Producto>) {
    const producto = this.repo.create(data);
    return this.repo.save(producto);
  }

  async desactivar(id: number) {
    const producto = await this.repo.findOneBy({ id });

    if (!producto) {
      return { mensaje: 'Producto no encontrado' };
    }

    producto.activo = false;

    await this.repo.save(producto);

    return { mensaje: 'Producto desactivado' };
  }
  async reactivar(id: number) {
  const producto = await this.repo.findOneBy({ id });

  if (!producto) {
    return {
      mensaje: 'Producto no encontrado'
    };
  }

  producto.activo = true;

  await this.repo.save(producto);

  return {
    mensaje: 'Producto reactivado'
  };
}

  async actualizar(id: number, data: Partial<Producto>) {
  await this.repo.update(id, data);

  return {
    mensaje: 'Producto actualizado'
  };
}
async findAllIncludingInactive() {
  return await this.repo.find({
    relations: ['categoria']
  });
}
}