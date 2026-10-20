import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Venta } from './venta.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { Producto } from '../productos/producto.entity';
import { Repository, DataSource } from 'typeorm';
import { Cliente } from '../clientes/entities/cliente.entity';
import { MetodoPago } from '../metodo-pago/metodo-pago.entity';
import { Empleado } from '../empleados/empleado.entity';
import { MovimientoStock } from '../movimientos-stock/movimiento-stock.entity';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { DevolucionVenta } from '../devoluciones-ventas/devolucion-venta.entity';
import { DetalleDevolucionVenta } from '../devoluciones-ventas/detalle-devolucion-venta.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepo: Repository<Venta>,

    @InjectRepository(DetalleVenta)
    private detalleRepo: Repository<DetalleVenta>,

    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,

    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,

    @InjectRepository(MetodoPago)
    private metodoPagoRepo: Repository<MetodoPago>,

    private dataSource: DataSource,
  ) {}

  async crearVenta(data: CrearVentaDto & { empleadoId: number }) {
    return this.dataSource.transaction(async (manager) => {
      const clienteRepo = manager.getRepository(Cliente);
      const metodoPagoRepo = manager.getRepository(MetodoPago);
      const empleadoRepo = manager.getRepository(Empleado);
      const productoRepo = manager.getRepository(Producto);
      const ventaRepo = manager.getRepository(Venta);
      const detalleRepo = manager.getRepository(DetalleVenta);
      const movimientoRepo = manager.getRepository(MovimientoStock);

      const cliente = await clienteRepo.findOne({
        where: {
          id: data.clienteId,
          activo: true,
        },
      });

      if (!cliente) {
        throw new BadRequestException(
          'Cliente no encontrado o inactivo',
        );
      }

      const metodoPago = await metodoPagoRepo.findOne({
        where: {
          id: data.metodoPagoId,
          activo: true,
        },
      });

      if (!metodoPago) {
        throw new BadRequestException(
          'Método de pago no encontrado o inactivo',
        );
      }

      const empleado = await empleadoRepo.findOne({
        where: {
          id: data.empleadoId,
          activo: true,
        },
      });

      if (!empleado) {
        throw new BadRequestException(
          'Empleado no encontrado o inactivo',
        );
      }

      if (!data.productos?.length) {
        throw new BadRequestException(
          'La venta debe contener al menos un producto',
        );
      }

      const productosIds = data.productos.map(
        (item) => item.productoId,
      );

      const idsRepetidos = productosIds.filter(
        (id, index) => productosIds.indexOf(id) !== index,
      );

      if (idsRepetidos.length > 0) {
        throw new BadRequestException(
          'No se puede repetir un producto dentro de la misma venta',
        );
      }

      const venta = ventaRepo.create({
        total: 0,
        cliente,
        metodoPago,
        empleado,
        empleadoId: empleado.id,
      });

      const detalles: DetalleVenta[] = [];

      for (const item of data.productos) {
        const producto = await productoRepo.findOne({
          where: {
            id: item.productoId,
            activo: true,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!producto) {
          throw new BadRequestException(
            `Producto ${item.productoId} no encontrado o inactivo`,
          );
        }

        if (
          !Number.isInteger(Number(item.cantidad)) ||
          Number(item.cantidad) <= 0
        ) {
          throw new BadRequestException(
            'La cantidad debe ser un número entero mayor a cero',
          );
        }

        if (Number(producto.stock) < Number(item.cantidad)) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}`,
          );
        }

        producto.stock =
          Number(producto.stock) - Number(item.cantidad);

        await productoRepo.save(producto);

        const detalle = detalleRepo.create({
          producto,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(producto.precio),
          total:
            Number(producto.precio) * Number(item.cantidad),
        });

        venta.total +=
          Number(producto.precio) * Number(item.cantidad);

        detalles.push(detalle);

        const movimiento = movimientoRepo.create({
          productoId: producto.id,
          empleadoId: empleado.id,
          proveedorId: null,
          tipo: 'salida',
          cantidad: Number(item.cantidad),
          motivo: 'Salida automática por venta',
        });

        await movimientoRepo.save(movimiento);
      }

      const ventaGuardada = await ventaRepo.save(venta);

      for (const detalle of detalles) {
        detalle.venta = ventaGuardada;
        await detalleRepo.save(detalle);
      }

      return ventaRepo.findOne({
        where: {
          id: ventaGuardada.id,
        },
        relations: {
          cliente: true,
          metodoPago: true,
          empleado: true,
          detalles: {
            producto: true,
          },
        },
      });
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    desde?: string,
    hasta?: string,
    clienteId?: number,
    metodoPagoId?: number,
  ) {
    const skip = (page - 1) * limit;

    const query = this.ventaRepo
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.metodoPago', 'metodoPago')
      .leftJoinAndSelect('venta.empleado', 'empleado')
      .leftJoinAndSelect('venta.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .orderBy('venta.fecha', 'DESC')
      .skip(skip)
      .take(limit);

    if (desde) {
      query.andWhere('venta.fecha >= :desde', {
        desde: `${desde} 00:00:00`,
      });
    }

    if (hasta) {
      query.andWhere('venta.fecha <= :hasta', {
        hasta: `${hasta} 23:59:59`,
      });
    }

    if (clienteId) {
      query.andWhere('cliente.id = :clienteId', {
        clienteId,
      });
    }

    if (metodoPagoId) {
      query.andWhere('metodoPago.id = :metodoPagoId', {
        metodoPagoId,
      });
    }

    const [ventas, total] = await query.getManyAndCount();

    return {
      data: ventas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const venta = await this.ventaRepo
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.metodoPago', 'metodoPago')
      .leftJoinAndSelect('venta.empleado', 'empleado')
      .leftJoinAndSelect('venta.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .where('venta.id = :id', { id })
      .getOne();

    if (!venta) {
      throw new BadRequestException('Venta no encontrada');
    }

    return venta;
  }

  
async getDashboard(
  desde?: string,
  hasta?: string,
  clienteId?: number,
) {
  const query = this.detalleRepo
    .createQueryBuilder('detalle')
    .leftJoinAndSelect('detalle.venta', 'venta')
    .leftJoinAndSelect('venta.cliente', 'cliente')
    .leftJoinAndSelect('venta.metodoPago', 'metodoPago')
    .leftJoinAndSelect('detalle.producto', 'producto')
    .leftJoinAndSelect('producto.categoria', 'categoria')
    .where('venta.estado = :estado', { estado: 'confirmada' });

  if (desde) {
    query.andWhere('venta.fecha >= :desde', {
      desde: `${desde} 00:00:00`,
    });
  }

  if (hasta) {
    query.andWhere('venta.fecha <= :hasta', {
      hasta: `${hasta} 23:59:59`,
    });
  }

  if (clienteId) {
    query.andWhere('cliente.id = :clienteId', { clienteId });
  }

  const detalles = await query.getMany();

  const devolucionesQuery = this.dataSource
    .getRepository(DetalleDevolucionVenta)
    .createQueryBuilder('detalleDevolucion')
    .leftJoinAndSelect('detalleDevolucion.devolucion', 'devolucion')
    .leftJoinAndSelect('devolucion.venta', 'ventaDevolucion')
    .leftJoinAndSelect('ventaDevolucion.cliente', 'clienteDevolucion')
    .leftJoinAndSelect('ventaDevolucion.metodoPago', 'metodoPagoDevolucion')
    .leftJoinAndSelect('detalleDevolucion.producto', 'productoDevolucion')
    .leftJoinAndSelect('productoDevolucion.categoria', 'categoriaDevolucion')
    .where('devolucion.estadoCredito = :completado', {
      completado: 'completado',
    });

  if (desde) {
    devolucionesQuery.andWhere('devolucion.fecha >= :desde', {
      desde: `${desde} 00:00:00`,
    });
  }

  if (hasta) {
    devolucionesQuery.andWhere('devolucion.fecha <= :hasta', {
      hasta: `${hasta} 23:59:59`,
    });
  }

  if (clienteId) {
    devolucionesQuery.andWhere('clienteDevolucion.id = :clienteId', {
      clienteId,
    });
  }

  const detallesDevoluciones = await devolucionesQuery.getMany();

  const productosActivos = await this.productoRepo.count({
    where: { activo: true },
  });

  const productosInactivos = await this.productoRepo.count({
    where: { activo: false },
  });

  let ventasBrutas = 0;
  let totalDevoluciones = 0;
  let totalProductosVendidos = 0;
  let totalProductosDevueltos = 0;

  const productosVendidos: Record<string, number> = {};
  const categorias: Record<string, number> = {};
  const metodosPago: Record<string, number> = {};

  for (const detalle of detalles) {
    const cantidad = Number(detalle.cantidad);
    const total = Number(detalle.total);
    const nombreProducto = detalle.producto.nombre;
    const categoria = detalle.producto?.categoria?.nombre || 'Sin categoría';
    const metodoPago = detalle.venta?.metodoPago?.nombre || 'Sin método de pago';

    ventasBrutas += total;
    totalProductosVendidos += cantidad;

    productosVendidos[nombreProducto] =
      (productosVendidos[nombreProducto] || 0) + cantidad;

    categorias[categoria] = (categorias[categoria] || 0) + total;
    metodosPago[metodoPago] = (metodosPago[metodoPago] || 0) + total;
  }

  for (const detalle of detallesDevoluciones) {
    const cantidad = Number(detalle.cantidad);
    const total = Number(detalle.total);
    const nombreProducto = detalle.producto.nombre;
    const categoria =
      detalle.producto?.categoria?.nombre || 'Sin categoría';
    const metodoPago =
      detalle.devolucion?.venta?.metodoPago?.nombre || 'Sin método de pago';

    totalDevoluciones += total;
    totalProductosDevueltos += cantidad;

    productosVendidos[nombreProducto] =
      (productosVendidos[nombreProducto] || 0) - cantidad;

    categorias[categoria] = (categorias[categoria] || 0) - total;
    metodosPago[metodoPago] = (metodosPago[metodoPago] || 0) - total;
  }

  const totalIngresos = ventasBrutas - totalDevoluciones;
  const totalProductos = totalProductosVendidos - totalProductosDevueltos;

  const ventasPorCategoria = Object.entries(categorias).map(
    ([categoria, total]) => ({
      categoria,
      total: Math.max(0, total),
    }),
  );

  const ventasPorMetodoPago = Object.entries(metodosPago).map(
    ([metodoPago, total]) => ({
      metodoPago,
      total: Math.max(0, total),
    }),
  );

  const productoMasVendido =
    Object.entries(productosVendidos)
      .filter(([, cantidad]) => cantidad > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin ventas';

  const ventaQuery = this.ventaRepo
    .createQueryBuilder('venta')
    .leftJoin('venta.cliente', 'cliente')
    .where('venta.estado = :estado', { estado: 'confirmada' });

  if (desde) {
    ventaQuery.andWhere('venta.fecha >= :desde', {
      desde: `${desde} 00:00:00`,
    });
  }

  if (hasta) {
    ventaQuery.andWhere('venta.fecha <= :hasta', {
      hasta: `${hasta} 23:59:59`,
    });
  }

  if (clienteId) {
    ventaQuery.andWhere('cliente.id = :clienteId', { clienteId });
  }

  const cantidadVentas = await ventaQuery.getCount();

  return {
    ventasBrutas,
    totalDevoluciones,
    totalIngresos,
    totalProductos,
    cantidadVentas,
    productoMasVendido,
    productosActivos,
    productosInactivos,
    ventasPorCategoria,
    ventasPorMetodoPago,
  };
}

}