import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DevolucionVenta } from './devolucion-venta.entity';
import { DetalleDevolucionVenta } from './detalle-devolucion-venta.entity';
import { DevolucionesVentaController } from './devoluciones-venta.controller';
import { DevolucionesVentaService } from './devoluciones-venta.service';

import { Venta } from '../ventas/venta.entity';
import { DetalleVenta } from '../ventas/detalle-venta.entity';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Empleado } from '../empleados/empleado.entity';
import { MovimientoStock } from '../movimientos-stock/movimiento-stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DevolucionVenta,
      DetalleDevolucionVenta,
      Venta,
      DetalleVenta,
      Producto,
      Cliente,
      Empleado,
      MovimientoStock,
    ]),
  ],
  controllers: [DevolucionesVentaController],
  providers: [DevolucionesVentaService],
  exports: [DevolucionesVentaService],
})
export class DevolucionesVentaModule {}