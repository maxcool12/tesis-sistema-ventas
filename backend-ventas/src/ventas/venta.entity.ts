import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';

import { DetalleVenta } from './detalle-venta.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { MetodoPago } from '../metodo-pago/metodo-pago.entity';

@Entity()
export class Venta {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  total!: number;

  @ManyToOne(() => Cliente, {
    nullable: true,
  })
  cliente!: Cliente;

  @ManyToOne(() => MetodoPago, {
    nullable: true,
  })
  metodoPago!: MetodoPago;

  @OneToMany(
    () => DetalleVenta,
    (detalle) => detalle.venta,
  )
  detalles!: DetalleVenta[];
}