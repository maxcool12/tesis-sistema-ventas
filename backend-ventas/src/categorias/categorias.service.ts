import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from './categoria.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private repo: Repository<Categoria>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  create(data: Partial<Categoria>) {
    const categoria = this.repo.create(data);
    return this.repo.save(categoria);
  }
}