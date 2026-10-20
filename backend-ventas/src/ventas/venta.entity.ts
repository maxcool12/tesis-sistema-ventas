import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { DetalleVenta } from './detalle-venta.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { MetodoPago } from '../metodo-pago/metodo-pago.entity';
import { Empleado } from '../empleados/empleado.entity';

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

  @Column({ type: 'varchar', length: 20, default: 'confirmada' })
estado!: 'confirmada' | 'pendiente' | 'cancelada';

  @ManyToOne(() => Cliente, { nullable: true })
  cliente!: Cliente;

  @ManyToOne(() => MetodoPago, { nullable: true })
  metodoPago!: MetodoPago;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleadoId' })
  empleado!: Empleado | null;

  @Column({ nullable: true })
  empleadoId!: number | null;

  @OneToMany(
    () => DetalleVenta,
    (detalle) => detalle.venta,
  )
  detalles!: DetalleVenta[];
}