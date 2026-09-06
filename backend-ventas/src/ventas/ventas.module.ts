import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Venta } from './venta.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { MetodoPago } from '../metodo-pago/metodo-pago.entity';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  Venta,
  DetalleVenta,
  Producto,
  Cliente,
  MetodoPago,
]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}