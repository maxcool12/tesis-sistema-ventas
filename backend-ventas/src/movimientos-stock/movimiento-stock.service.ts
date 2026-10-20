import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { MovimientoStock } from './movimiento-stock.entity';
import { Producto } from '../productos/producto.entity';
import { Empleado } from '../empleados/empleado.entity';
import { Proveedor } from '../proveedores/proveedor.entity';

@Injectable()
export class MovimientosStockService {
  constructor(
    @InjectRepository(MovimientoStock)
    private movimientoRepo: Repository<MovimientoStock>,

    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,

    @InjectRepository(Empleado)
    private empleadoRepo: Repository<Empleado>,

    private dataSource: DataSource,
  ) {}

  async create(data: any) {
    return this.dataSource.transaction(async (manager) => {
      const tiposValidos = ['entrada', 'salida', 'ajuste'];

      if (!tiposValidos.includes(data.tipo)) {
        throw new BadRequestException(
          'El tipo de movimiento debe ser entrada, salida o ajuste',
        );
      }

      if (
        !Number.isInteger(Number(data.cantidad)) ||
        Number(data.cantidad) <= 0
      ) {
        throw new BadRequestException(
          'La cantidad debe ser un número entero mayor a 0',
        );
      }

      const productoRepo = manager.getRepository(Producto);
      const empleadoRepo = manager.getRepository(Empleado);
      const proveedorRepo = manager.getRepository(Proveedor);
      const movimientoRepo = manager.getRepository(MovimientoStock);

      const producto = await productoRepo.findOne({
        where: { id: Number(data.productoId) },
        lock: { mode: 'pessimistic_write' },
      });

      if (!producto) {
        throw new NotFoundException('Producto no encontrado');
      }

      let empleado: Empleado | null = null;

      if (data.empleadoId) {
        empleado = await empleadoRepo.findOne({
          where: {
            id: Number(data.empleadoId),
            activo: true,
          },
        });

        if (!empleado) {
          throw new BadRequestException(
            'Empleado no encontrado o inactivo',
          );
        }
      }

      let proveedor: Proveedor | null = null;

      if (data.proveedorId) {
        proveedor = await proveedorRepo.findOne({
          where: {
            id: Number(data.proveedorId),
            activo: true,
          },
        });

        if (!proveedor) {
          throw new BadRequestException(
            'Proveedor no encontrado o inactivo',
          );
        }
      }

      if (data.tipo === 'entrada' && !proveedor) {
        throw new BadRequestException(
          'Debés seleccionar el proveedor de la mercadería',
        );
      }

      const cantidad = Number(data.cantidad);

      if (data.tipo === 'salida') {
        if (producto.stock < cantidad) {
          throw new BadRequestException(
            'No hay stock suficiente para realizar la salida',
          );
        }

        producto.stock -= cantidad;
      }

      if (data.tipo === 'entrada') {
        producto.stock += cantidad;
      }

      if (data.tipo === 'ajuste') {
        producto.stock = cantidad;
      }

      await productoRepo.save(producto);

      const movimiento = movimientoRepo.create({
        productoId: producto.id,
        empleadoId: empleado?.id ?? null,
        proveedorId: proveedor?.id ?? null,
        tipo: data.tipo,
        cantidad,
        motivo: data.motivo || null,
      });

      return movimientoRepo.save(movimiento);
    });
  }

  async findAll(
    buscar?: string,
    tipo?: string,
    desde?: string,
    hasta?: string,
    page = 1,
    limit = 15,
  ) {
    const query = this.movimientoRepo
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.producto', 'producto')
      .leftJoinAndSelect('movimiento.empleado', 'empleado')
      .leftJoinAndSelect('movimiento.proveedor', 'proveedor')
      .orderBy('movimiento.fecha', 'DESC');

    if (buscar) {
      query.andWhere(
        `(producto.nombre LIKE :buscar
        OR movimiento.motivo LIKE :buscar
        OR empleado.nombre LIKE :buscar
        OR empleado.apellido LIKE :buscar
        OR proveedor.nombre LIKE :buscar)`,
        {
          buscar: `%${buscar}%`,
        },
      );
    }

    if (tipo) {
      query.andWhere('movimiento.tipo = :tipo', { tipo });
    }

    if (desde) {
      query.andWhere('movimiento.fecha >= :desde', {
        desde: `${desde} 00:00:00`,
      });
    }

    if (hasta) {
      query.andWhere('movimiento.fecha <= :hasta', {
        hasta: `${hasta} 23:59:59`,
      });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);

    const movimientos = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: movimientos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const movimiento = await this.movimientoRepo.findOne({
      where: { id },
      relations: {
        producto: true,
        empleado: true,
        proveedor: true,
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    return movimiento;
  }
}