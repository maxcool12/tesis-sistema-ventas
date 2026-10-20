import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Venta } from '../ventas/venta.entity';
import { Empleado } from '../empleados/empleado.entity';
import { DetalleDevolucionVenta } from './detalle-devolucion-venta.entity';

@Entity()
export class DevolucionVenta {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Venta, { nullable: false })
  @JoinColumn({ name: 'ventaId' })
  venta!: Venta;

  @Column()
  ventaId!: number;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleadoId' })
  empleado!: Empleado | null;

  @Column({ nullable: true })
  empleadoId!: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'varchar', length: 20 })
  tipoCredito!: 'reintegro' | 'saldo_favor';

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estadoCredito!: 'pendiente' | 'completado';

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo!: string | null;

  @OneToMany(
    () => DetalleDevolucionVenta,
    detalle => detalle.devolucion,
  )
  detalles!: DetalleDevolucionVenta[];
}