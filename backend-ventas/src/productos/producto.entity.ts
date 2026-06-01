import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  codigo!: string;

  @Column({ nullable: true })
  descripcion!: string;

  @Column({ type: 'text', nullable: true })
  detalle!: string;

  @Column({ type: 'decimal', default: 0 })
  costo!: number;

  @Column({ type: 'decimal', default: 0 })
  precio!: number;

  @Column({ nullable: true })
  marca!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ default: 0 })
  stock!: number;

  @ManyToOne(() => Categoria, categoria => categoria.productos, { eager: true })
  categoria!: Categoria;
}