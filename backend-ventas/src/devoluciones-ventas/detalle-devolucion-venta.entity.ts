import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DevolucionVenta } from './devolucion-venta.entity';
import { DetalleVenta } from '../ventas/detalle-venta.entity';
import { Producto } from '../productos/producto.entity';

@Entity()
export class DetalleDevolucionVenta {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => DevolucionVenta,
    devolucion => devolucion.detalles,
    { nullable: false },
  )
  @JoinColumn({ name: 'devolucionId' })
  devolucion!: DevolucionVenta;

  @Column({ type: 'int' })
devolucionId!: number;

  @ManyToOne(() => DetalleVenta, { nullable: false })
  @JoinColumn({ name: 'detalleVentaId' })
  detalleVenta!: DetalleVenta;

  @Column()
  detalleVentaId!: number;

  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'productoId' })
  producto!: Producto;

  @Column()
  productoId!: number;

  @Column()
  cantidad!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precioUnitario!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;
}