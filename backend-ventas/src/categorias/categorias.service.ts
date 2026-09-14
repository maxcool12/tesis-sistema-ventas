import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from './categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private repo: Repository<Categoria>,
  ) {}

  
  async findAll() {
    return this.repo.find({
      where: { activo: true },
      order: {
        nombre: 'ASC',
      },
    });
  }

 
  async findAllIncludingInactive() {
    return this.repo.find({
      order: {
        nombre: 'ASC',
      },
    });
  }

  
  async findOne(id: number) {
    const categoria = await this.repo.findOne({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException(
        'Categoría no encontrada',
      );
    }

    return categoria;
  }

 
  async create(dto: CreateCategoriaDto) {
    const nombreLimpio = dto.nombre.trim();

    const existe = await this.repo.findOne({
      where: {
        nombre: nombreLimpio,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'Ya existe una categoría con ese nombre.',
      );
    }

    const categoria = this.repo.create({
      nombre: nombreLimpio,
      activo: true,
    });

    return this.repo.save(categoria);
  }

  
  async update(
    id: number,
    dto: UpdateCategoriaDto,
  ) {
    const categoria = await this.findOne(id);

    if (dto.nombre !== undefined) {
      const nombreLimpio = dto.nombre.trim();

      const existe = await this.repo.findOne({
        where: {
          nombre: nombreLimpio,
        },
      });

      if (existe && existe.id !== id) {
        throw new BadRequestException(
          'Ya existe una categoría con ese nombre.',
        );
      }

      categoria.nombre = nombreLimpio;
    }

    return this.repo.save(categoria);
  }

  
  async remove(id: number) {
    const categoria = await this.findOne(id);

    categoria.activo = false;

    return this.repo.save(categoria);
  }

  
  async reactivar(id: number) {
    const categoria = await this.findOne(id);

    categoria.activo = true;

    return this.repo.save(categoria);
  }
}