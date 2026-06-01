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

  findAll() {
    return this.repo.find();
  }

  create(data: Partial<Producto>) {
    const producto = this.repo.create(data);
    return this.repo.save(producto);
  }
}