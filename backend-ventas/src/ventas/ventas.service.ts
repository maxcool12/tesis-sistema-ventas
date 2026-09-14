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
import { CrearVentaDto } from './dto/crear-venta.dto';

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

  async crearVenta(data: CrearVentaDto) {
    return await this.dataSource.transaction(async (manager) => {

      const cliente = await manager.getRepository(Cliente).findOne({
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

      const metodoPago = await manager
        .getRepository(MetodoPago)
        .findOne({
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

      const productosIds = data.productos.map(
        (item) => item.productoId,
      );

      const idsRepetidos = productosIds.filter(
        (id, index) =>
          productosIds.indexOf(id) !== index,
      );

      if (idsRepetidos.length > 0) {
        throw new BadRequestException(
          'No se puede repetir un producto dentro de la misma venta',
        );
      }

      const venta = manager.getRepository(Venta).create({
        total: 0,
        cliente,
        metodoPago,
      });

      const detalles: DetalleVenta[] = [];

      for (const item of data.productos) {

        const producto = await manager
          .getRepository(Producto)
          .findOne({
            where: {
              id: item.productoId,
              activo: true,
            },
          });

        if (!producto) {
          throw new BadRequestException(
            'Producto no encontrado o inactivo',
          );
        }

        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}`,
          );
        }

        producto.stock -= item.cantidad;

        await manager
          .getRepository(Producto)
          .save(producto);

        const detalle = manager
          .getRepository(DetalleVenta)
          .create({
            producto,
            cantidad: item.cantidad,
            precio_unitario: Number(producto.precio),
            total:
              Number(producto.precio) * item.cantidad,
          });

        venta.total +=
          Number(producto.precio) * item.cantidad;

        detalles.push(detalle);
      }

      const ventaGuardada = await manager
        .getRepository(Venta)
        .save(venta);

      for (const detalle of detalles) {

        detalle.venta = ventaGuardada;

        await manager
          .getRepository(DetalleVenta)
          .save(detalle);
      }

      return ventaGuardada;
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
      .leftJoinAndSelect(
        'venta.cliente',
        'cliente',
      )
      .leftJoinAndSelect(
        'venta.metodoPago',
        'metodoPago',
      )
      .leftJoinAndSelect(
        'venta.detalles',
        'detalles',
      )
      .leftJoinAndSelect(
        'detalles.producto',
        'producto',
      )
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
      query.andWhere(
        'cliente.id = :clienteId',
        { clienteId },
      );
    }

    if (metodoPagoId) {
      query.andWhere(
        'metodoPago.id = :metodoPagoId',
        { metodoPagoId },
      );
    }

    const [ventas, total] =
      await query.getManyAndCount();

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
      .leftJoinAndSelect(
        'venta.cliente',
        'cliente',
      )
      .leftJoinAndSelect(
        'venta.metodoPago',
        'metodoPago',
      )
      .leftJoinAndSelect(
        'venta.detalles',
        'detalles',
      )
      .leftJoinAndSelect(
        'detalles.producto',
        'producto',
      )
      .where('venta.id = :id', { id })
      .getOne();

    if (!venta) {
      throw new BadRequestException(
        'Venta no encontrada',
      );
    }

    return venta;
  }

  async getDashboard(
    desde?: string,
    hasta?: string,
  ) {
    const query = this.detalleRepo
      .createQueryBuilder('detalle')
      .leftJoinAndSelect(
        'detalle.venta',
        'venta',
      )
      .leftJoinAndSelect(
        'venta.metodoPago',
        'metodoPago',
      )
      .leftJoinAndSelect(
        'detalle.producto',
        'producto',
      )
      .leftJoinAndSelect(
        'producto.categoria',
        'categoria',
      );

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

    const detalles = await query.getMany();

    console.log('DESDE:', desde);
    console.log('HASTA:', hasta);
    console.log(
      'DETALLES ENCONTRADOS:',
      detalles.length,
    );

    const productosActivos =
      await this.productoRepo.count({
        where: { activo: true },
      });

    const productosInactivos =
      await this.productoRepo.count({
        where: { activo: false },
      });

    let totalIngresos = 0;
    let totalProductos = 0;
    let cantidadVentas = 0;

    const productosVendidos: any = {};
    const categorias: any = {};
    const metodosPago: any = {};

    for (const d of detalles) {

      totalIngresos += Number(d.total);

      totalProductos += d.cantidad;

      const nombreProducto =
        d.producto.nombre;

      if (!productosVendidos[nombreProducto]) {
        productosVendidos[nombreProducto] = 0;
      }

      productosVendidos[nombreProducto] +=
        d.cantidad;

      const categoria =
        d.producto?.categoria?.nombre ||
        'Sin categoría';

      if (!categorias[categoria]) {
        categorias[categoria] = 0;
      }

      categorias[categoria] += Number(d.total);

      const metodoPago =
        d.venta?.metodoPago?.nombre ||
        'Sin método de pago';

      if (!metodosPago[metodoPago]) {
        metodosPago[metodoPago] = 0;
      }

      metodosPago[metodoPago] +=
        Number(d.total);
    }

    const ventasPorCategoria =
      Object.keys(categorias).map((c) => ({
        categoria: c,
        total: categorias[c],
      }));

    const ventasPorMetodoPago =
      Object.keys(metodosPago).map((m) => ({
        metodoPago: m,
        total: metodosPago[m],
      }));

    const productoMasVendido =
      Object.keys(productosVendidos).length > 0
        ? Object.entries(productosVendidos)
            .sort(
              (a: any, b: any) =>
                b[1] - a[1],
            )[0][0]
        : 'Sin ventas';

    const ventaQuery =
      this.ventaRepo
        .createQueryBuilder('venta');

    if (desde) {
      ventaQuery.andWhere(
        'venta.fecha >= :desde',
        {
          desde: `${desde} 00:00:00`,
        },
      );
    }

    if (hasta) {
      ventaQuery.andWhere(
        'venta.fecha <= :hasta',
        {
          hasta: `${hasta} 23:59:59`,
        },
      );
    }

    cantidadVentas =
      await ventaQuery.getCount();

    return {
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