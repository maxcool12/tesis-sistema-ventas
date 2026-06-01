import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from '../productos/producto.entity';

@Entity()
export class DetalleVenta {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles)
  @JoinColumn({ name: 'venta_id' })
  venta!: Venta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @Column()
  cantidad!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precio_unitario!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;
}