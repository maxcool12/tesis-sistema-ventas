import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovimientoStock } from './movimiento-stock.entity';
import { MovimientosStockService } from './movimiento-stock.service';
import { MovimientosStockController } from './movimientos-stock.controller';
import { Producto } from '../productos/producto.entity';
import { Empleado } from '../empleados/empleado.entity';
import { Proveedor } from '../proveedores/proveedor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovimientoStock,
      Producto,
      Empleado,
      Proveedor,
    ]),
  ],
  providers: [MovimientosStockService],
  controllers: [MovimientosStockController],
})
export class MovimientosStockModule {}