import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Producto } from '../productos/producto.entity';
import { Empleado } from '../empleados/empleado.entity';
import { Proveedor } from '../proveedores/proveedor.entity';

@Entity()
export class MovimientoStock {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'productoId' })
  producto!: Producto;

  @Column()
  productoId!: number;

  @Column()
  tipo!: string;

  @Column()
  cantidad!: number;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @Column({ nullable: true })
  motivo!: string;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleadoId' })
  empleado!: Empleado | null;

  @Column({ nullable: true })
  empleadoId!: number | null;

 @Column({ type: 'int', nullable: true })
devolucionId!: number | null;

  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn({ name: 'proveedorId' })
  proveedor!: Proveedor | null;

  @Column({ nullable: true })
  proveedorId!: number | null;
}