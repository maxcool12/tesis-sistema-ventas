import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Repository } from 'typeorm';
import { CreateProductoDto } from './dto/CreateProductoDto';
import { UpdateProductoDto } from '../productos/dto/UpdateProductoDto';

@Injectable()
export class ProductosService {
 constructor(
  @InjectRepository(Producto)
  private repo: Repository<Producto>,

  @InjectRepository(Categoria)
  private categoriaRepo: Repository<Categoria>,
) {}

  async findAll(
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;

  const [data, total] = await this.repo.findAndCount({
    where: { activo: true },
    relations: ['categoria'],
    order: {
      id: 'ASC',
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

  async create(data: CreateProductoDto) {

  const categoria = await this.categoriaRepo.findOne({
    where: {
      id: data.categoriaId,
    },
  });

  if (!categoria) {
    throw new BadRequestException(
      'Categoría no encontrada',
    );
  }

  const producto = this.repo.create({
    nombre: data.nombre,
    codigo: data.codigo,
    descripcion: data.descripcion,
    detalle: data.detalle,
    costo: data.costo,
    precio: data.precio,
    marca: data.marca,
    stock: data.stock,
    categoria,
  });

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

  async actualizar(id: number, data: UpdateProductoDto) {

  const producto = await this.repo.findOne({
    where: {
      id,
    },
  });

  if (!producto) {
    throw new BadRequestException(
      'Producto no encontrado',
    );
  }

  if (data.categoriaId !== undefined) {

    const categoria = await this.categoriaRepo.findOne({
      where: {
        id: data.categoriaId,
      },
    });

    if (!categoria) {
      throw new BadRequestException(
        'Categoría no encontrada',
      );
    }

    producto.categoria = categoria;
  }

  if (data.nombre !== undefined) {
    producto.nombre = data.nombre;
  }

  if (data.codigo !== undefined) {
    producto.codigo = data.codigo;
  }

  if (data.descripcion !== undefined) {
    producto.descripcion = data.descripcion;
  }

  if (data.detalle !== undefined) {
    producto.detalle = data.detalle;
  }

  if (data.costo !== undefined) {
    producto.costo = data.costo;
  }

  if (data.precio !== undefined) {
    producto.precio = data.precio;
  }

  if (data.marca !== undefined) {
    producto.marca = data.marca;
  }

  if (data.stock !== undefined) {
    producto.stock = data.stock;
  }

  return this.repo.save(producto);
}
async findAllIncludingInactive() {
  return await this.repo.find({
    relations: ['categoria']
  });
}
}