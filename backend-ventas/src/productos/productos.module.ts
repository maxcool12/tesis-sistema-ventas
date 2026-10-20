import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Producto } from './producto.entity';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Categoria } from '../categorias/categoria.entity';
import { MovimientoStock } from '../movimientos-stock/movimiento-stock.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Empleado } from '../empleados/empleado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Categoria,
      MovimientoStock,
      Proveedor,
      Empleado,
    ]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}