import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { Venta } from './venta.entity';
import { DetalleVenta } from './detalle-venta.entity';
import { Producto } from '../productos/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}