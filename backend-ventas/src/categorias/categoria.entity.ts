import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { Producto } from '../productos/producto.entity';

@Entity()
export class Categoria {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @OneToMany(
    () => Producto,
    (producto) => producto.categoria,
  )
  productos!: Producto[];
}