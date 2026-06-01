import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetalleVenta } from './detalle-venta.entity';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta)
  detalles!: DetalleVenta[];
}