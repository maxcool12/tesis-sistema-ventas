import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { DevolucionVenta } from './devolucion-venta.entity';
import { DetalleDevolucionVenta } from './detalle-devolucion-venta.entity';
import { CrearDevolucionDto } from './dto/crear-devolucion.dto';
import { Venta } from '../ventas/venta.entity';
import { DetalleVenta } from '../ventas/detalle-venta.entity';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Empleado } from '../empleados/empleado.entity';
import { MovimientoStock } from '../movimientos-stock/movimiento-stock.entity';

@Injectable()
export class DevolucionesVentaService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(DevolucionVenta)
    private readonly devolucionesRepository: Repository<DevolucionVenta>,
  ) {}

  async confirmarReintegro(id: number) {
  return this.dataSource.transaction(async (manager) => {
    const devolucion = await manager.findOne(DevolucionVenta, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!devolucion) {
      throw new NotFoundException('La devolución no existe');
    }

    if (devolucion.tipoCredito !== 'reintegro') {
      throw new BadRequestException(
        'Esta devolución no corresponde a un reintegro en dinero',
      );
    }

    if (devolucion.estadoCredito !== 'pendiente') {
      throw new BadRequestException(
        'El reintegro ya fue procesado o no está pendiente',
      );
    }

    devolucion.estadoCredito = 'completado';

    await manager.save(DevolucionVenta, devolucion);

    return devolucion;
  });
}
  async crear(data: CrearDevolucionDto) {
    return this.dataSource.transaction(async (manager) => {
      const venta = await manager.findOne(Venta, {
        where: { id: data.ventaId },
        relations: { cliente: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!venta) {
        throw new NotFoundException('La venta no existe');
      }

      if (venta.estado !== 'confirmada') {
        throw new BadRequestException(
          'Solo se pueden devolver ventas confirmadas',
        );
      }

      if (!venta.cliente) {
        throw new BadRequestException(
          'La venta no tiene un cliente asociado',
        );
      }

      const cliente = await manager.findOne(Cliente, {
        where: { id: venta.cliente.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!cliente) {
        throw new NotFoundException('El cliente no existe');
      }

      let empleado: Empleado | null = null;

      if (data.empleadoId) {
        empleado = await manager.findOne(Empleado, {
          where: { id: data.empleadoId },
        });

        if (!empleado || !empleado.activo) {
          throw new BadRequestException(
            'El empleado no existe o está inactivo',
          );
        }
      }

      const detallesVenta = await manager.find(DetalleVenta, {
        where: { venta: { id: venta.id } },
        relations: { producto: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!detallesVenta.length) {
        throw new BadRequestException(
          'La venta no tiene productos registrados',
        );
      }

      const ids = data.productos.map((item) => item.detalleVentaId);

      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException(
          'No se puede repetir un detalle de venta',
        );
      }

      const devolucion = manager.create(DevolucionVenta, {
        ventaId: venta.id,
        venta,
        empleadoId: empleado?.id ?? null,
        empleado,
        total: 0,
        tipoCredito: data.tipoCredito,
        estadoCredito:
          data.tipoCredito === 'saldo_favor'
            ? 'completado'
            : 'pendiente',
        motivo: data.motivo?.trim() || null,
      });

      const detallesDevolucion: DetalleDevolucionVenta[] = [];
      const movimientos: MovimientoStock[] = [];
      let totalDevolucion = 0;

      for (const item of data.productos) {
        const detalleVenta = detallesVenta.find(
          (detalle) => detalle.id === item.detalleVentaId,
        );

        if (!detalleVenta) {
          throw new BadRequestException(
            `El detalle ${item.detalleVentaId} no pertenece a la venta`,
          );
        }

        if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
          throw new BadRequestException(
            'La cantidad a devolver debe ser un entero positivo',
          );
        }

        const devolucionesAnteriores = await manager
          .createQueryBuilder(DetalleDevolucionVenta, 'detalle')
          .innerJoin('detalle.devolucion', 'devolucion')
          .where('detalle.detalleVentaId = :detalleVentaId', {
            detalleVentaId: detalleVenta.id,
          })
          .select('COALESCE(SUM(detalle.cantidad), 0)', 'cantidad')
          .getRawOne<{ cantidad: string }>();

        const cantidadYaDevuelta = Number(
          devolucionesAnteriores?.cantidad ?? 0,
        );

        const cantidadVendida = Number(detalleVenta.cantidad);
        const cantidadDisponible = cantidadVendida - cantidadYaDevuelta;

        if (item.cantidad > cantidadDisponible) {
          throw new BadRequestException(
            `Solo quedan ${cantidadDisponible} unidades disponibles para devolver del detalle ${detalleVenta.id}`,
          );
        }

        const producto = await manager.findOne(Producto, {
          where: { id: detalleVenta.producto.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!producto) {
          throw new NotFoundException(
            `No existe el producto del detalle ${detalleVenta.id}`,
          );
        }

        const precioUnitario = Number(detalleVenta.precio_unitario);
        const totalDetalle = Number(
          (precioUnitario * item.cantidad).toFixed(2),
        );

        producto.stock = Number(producto.stock) + item.cantidad;

        await manager.save(Producto, producto);

        const detalleDevolucion = manager.create(
          DetalleDevolucionVenta,
          {
            devolucion,
            detalleVenta,
            detalleVentaId: detalleVenta.id,
            producto,
            productoId: producto.id,
            cantidad: item.cantidad,
            precioUnitario,
            total: totalDetalle,
          },
        );

        detallesDevolucion.push(detalleDevolucion);
        totalDevolucion += totalDetalle;

        movimientos.push(
          manager.create(MovimientoStock, {
            producto,
            productoId: producto.id,
            tipo: 'entrada',
            cantidad: item.cantidad,
            motivo: `Devolución de venta #${venta.id}`,
            empleado,
            empleadoId: empleado?.id ?? null,
            proveedor: null,
            proveedorId: null,
            devolucionId: 0,
          }),
        );
      }

      devolucion.total = Number(totalDevolucion.toFixed(2));

      const devolucionGuardada = await manager.save(
        DevolucionVenta,
        devolucion,
      );

      for (const detalle of detallesDevolucion) {
        detalle.devolucion = devolucionGuardada;
        detalle.devolucionId = devolucionGuardada.id;

        await manager.save(DetalleDevolucionVenta, detalle);
      }

      for (const movimiento of movimientos) {
        movimiento.devolucionId = devolucionGuardada.id;
        movimiento.motivo =
          `Devolución #${devolucionGuardada.id} de venta #${venta.id}`;

        await manager.save(MovimientoStock, movimiento);
      }

      if (data.tipoCredito === 'saldo_favor') {
        cliente.saldoFavor = Number(
          (Number(cliente.saldoFavor) + devolucionGuardada.total).toFixed(2),
        );

        await manager.save(Cliente, cliente);
      }

      return manager.findOne(DevolucionVenta, {
        where: { id: devolucionGuardada.id },
        relations: {
          venta: true,
          empleado: true,
          detalles: { producto: true, detalleVenta: true },
        },
      });
    });
  }

  async buscarTodas() {
    return this.devolucionesRepository.find({
      relations: {
        venta: true,
        empleado: true,
        detalles: { producto: true, detalleVenta: true },
      },
      order: { fecha: 'DESC' },
    });
  }

  async buscarUna(id: number) {
    const devolucion = await this.devolucionesRepository.findOne({
      where: { id },
      relations: {
        venta: true,
        empleado: true,
        detalles: { producto: true, detalleVenta: true },
      },
    });

    if (!devolucion) {
      throw new NotFoundException('La devolución no existe');
    }

    return devolucion;
  }
}