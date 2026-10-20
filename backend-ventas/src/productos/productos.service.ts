import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Producto } from './producto.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Empleado } from '../empleados/empleado.entity';
import { MovimientoStock } from '../movimientos-stock/movimiento-stock.entity';

import { CreateProductoDto } from './dto/CreateProductoDto';
import { UpdateProductoDto } from './dto/UpdateProductoDto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private repo: Repository<Producto>,

    @InjectRepository(Categoria)
    private categoriaRepo: Repository<Categoria>,

    private dataSource: DataSource,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: { activo: true },
      relations: ['categoria', 'proveedor', 'empleadoCarga'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: CreateProductoDto) {
    return this.dataSource.transaction(async (manager) => {
      const productoRepo = manager.getRepository(Producto);
      const categoriaRepo = manager.getRepository(Categoria);
      const proveedorRepo = manager.getRepository(Proveedor);
      const empleadoRepo = manager.getRepository(Empleado);
      const movimientoRepo = manager.getRepository(MovimientoStock);

      const categoria = await categoriaRepo.findOne({
        where: { id: data.categoriaId },
      });

      if (!categoria) {
        throw new BadRequestException('Categoría no encontrada');
      }

      const proveedor = await proveedorRepo.findOne({
        where: {
          id: data.proveedorId,
          activo: true,
        },
      });

      if (!proveedor) {
        throw new BadRequestException(
          'Proveedor no encontrado o inactivo',
        );
      }

      const empleado = await empleadoRepo.findOne({
        where: {
          id: data.empleadoCargaId,
          activo: true,
        },
      });

      if (!empleado) {
        throw new BadRequestException(
          'Empleado no encontrado o inactivo',
        );
      }

      const producto = productoRepo.create({
        nombre: data.nombre,
        codigo: data.codigo,
        descripcion: data.descripcion,
        detalle: data.detalle,
        costo: data.costo,
        precio: data.precio,
        marca: data.marca,
        stock: data.stock,
        categoria,
        proveedor,
        proveedorId: proveedor.id,
        empleadoCarga: empleado,
        empleadoCargaId: empleado.id,
      });

      const productoGuardado = await productoRepo.save(producto);

      if (productoGuardado.stock > 0) {
        const movimiento = movimientoRepo.create({
          productoId: productoGuardado.id,
          empleadoId: empleado.id,
          proveedorId: proveedor.id,
          tipo: 'entrada',
          cantidad: productoGuardado.stock,
          motivo: 'Stock inicial del producto',
        });

        await movimientoRepo.save(movimiento);
      }

      return productoGuardado;
    });
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
      return { mensaje: 'Producto no encontrado' };
    }

    producto.activo = true;
    await this.repo.save(producto);

    return { mensaje: 'Producto reactivado' };
  }

  async actualizar(id: number, data: UpdateProductoDto) {
    return this.dataSource.transaction(async (manager) => {
      const productoRepo = manager.getRepository(Producto);
      const categoriaRepo = manager.getRepository(Categoria);
      const proveedorRepo = manager.getRepository(Proveedor);
      const empleadoRepo = manager.getRepository(Empleado);
      const movimientoRepo = manager.getRepository(MovimientoStock);

      const producto = await productoRepo.findOne({
        where: { id },
      });

      if (!producto) {
        throw new BadRequestException('Producto no encontrado');
      }

      const stockAnterior = Number(producto.stock);

      if (data.categoriaId !== undefined) {
        const categoria = await categoriaRepo.findOne({
          where: { id: data.categoriaId },
        });

        if (!categoria) {
          throw new BadRequestException('Categoría no encontrada');
        }

        producto.categoria = categoria;
      }

      if (data.proveedorId !== undefined) {
        const proveedor = await proveedorRepo.findOne({
          where: {
            id: data.proveedorId,
            activo: true,
          },
        });

        if (!proveedor) {
          throw new BadRequestException(
            'Proveedor no encontrado o inactivo',
          );
        }

        producto.proveedor = proveedor;
        producto.proveedorId = proveedor.id;
      }

      if (data.nombre !== undefined) producto.nombre = data.nombre;
      if (data.codigo !== undefined) producto.codigo = data.codigo;
      if (data.descripcion !== undefined) producto.descripcion = data.descripcion;
      if (data.detalle !== undefined) producto.detalle = data.detalle;
      if (data.costo !== undefined) producto.costo = data.costo;
      if (data.precio !== undefined) producto.precio = data.precio;
      if (data.marca !== undefined) producto.marca = data.marca;
      if (data.stock !== undefined) producto.stock = data.stock;

      const productoGuardado = await productoRepo.save(producto);
      const stockNuevo = Number(productoGuardado.stock);

      if (data.stock !== undefined && stockNuevo !== stockAnterior) {
        const empleadoId = (data as UpdateProductoDto & {
          empleadoId?: number;
        }).empleadoId;

        if (!empleadoId) {
          throw new BadRequestException(
            'Debés seleccionar el empleado responsable del ajuste de stock',
          );
        }

        const empleado = await empleadoRepo.findOne({
          where: {
            id: empleadoId,
            activo: true,
          },
        });

        if (!empleado) {
          throw new BadRequestException(
            'Empleado no encontrado o inactivo',
          );
        }

        const movimiento = movimientoRepo.create({
          productoId: productoGuardado.id,
          empleadoId: empleado.id,
          proveedorId: productoGuardado.proveedorId ?? null,
          tipo: 'ajuste',
          cantidad: stockNuevo,
          motivo: `Ajuste automático. Stock anterior: ${stockAnterior}. Stock nuevo: ${stockNuevo}.`,
        });

        await movimientoRepo.save(movimiento);
      }

      return productoGuardado;
    });
  }

  async findAllIncludingInactive() {
    return this.repo.find({
      relations: ['categoria', 'proveedor', 'empleadoCarga'],
    });
  }
}