import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Venta } from './venta.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { Producto } from '../productos/producto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private ventaRepo: Repository<Venta>,

    @InjectRepository(DetalleVenta)
    private detalleRepo: Repository<DetalleVenta>,

    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
  ) { }

  // 🔥 CREAR VENTA
  async crearVenta(data: any) {
    const venta = this.ventaRepo.create({
      total: 0,
    });

    const detalles: DetalleVenta[] = [];

    for (const item of data.productos) {
      const producto = await this.productoRepo.findOne({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // ⚠️ Validar stock
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${producto.nombre}`);
      }

      // 💥 DESCONTAR STOCK
      producto.stock -= item.cantidad;
      await this.productoRepo.save(producto);

      const detalle = new DetalleVenta();
      detalle.producto = producto;
      detalle.cantidad = item.cantidad;
      detalle.precio_unitario = Number(producto.precio);
      detalle.total = Number(producto.precio) * item.cantidad;

      venta.total += Number(producto.precio) * item.cantidad;
      detalles.push(detalle);
    }

    const ventaGuardada = await this.ventaRepo.save(venta);

    for (const detalle of detalles) {
      detalle.venta = ventaGuardada;
      await this.detalleRepo.save(detalle);
    }

    return ventaGuardada;
  }

  // 📋 LISTAR VENTAS
  async findAll() {
    return this.ventaRepo.find({
      relations: ['detalles', 'detalles.producto'],
    });
  }

  // 📊 DASHBOARD
  async getDashboard() {
    const detalles = await this.detalleRepo.find({
      relations: ['producto', 'producto.categoria'],
    });
    const productosActivos = await this.productoRepo.count({
      where: { activo: true },
    });

    const productosInactivos = await this.productoRepo.count({
      where: { activo: false },
    });

    let totalIngresos = 0;
    let totalProductos = 0;
    let cantidadVentas = 0;

    const productosVendidos: any = {};
    const categorias: any = {};

    for (const d of detalles) {
      totalIngresos += Number(d.total);
      totalProductos += d.cantidad;
      const nombreProducto = d.producto.nombre;

      if (!productosVendidos[nombreProducto]) {
        productosVendidos[nombreProducto] = 0;
      }

      productosVendidos[nombreProducto] += d.cantidad;

      const categoria = d.producto?.categoria?.nombre || "Sin categoría";


      if (!categorias[categoria]) {
        categorias[categoria] = 0;
      }

      categorias[categoria] += Number(d.total);
    }

    const ventasPorCategoria = Object.keys(categorias).map(c => ({
      categoria: c,
      total: categorias[c]
    }));
    const productoMasVendido =
      Object.keys(productosVendidos).length > 0
        ? Object.entries(productosVendidos)
          .sort((a: any, b: any) => b[1] - a[1])[0][0]
        : "Sin ventas";

    cantidadVentas = await this.ventaRepo.count();

    return {
      totalIngresos,
      totalProductos,
      cantidadVentas,
      productoMasVendido,
      productosActivos,
      productosInactivos,
      ventasPorCategoria
    };
  }
}