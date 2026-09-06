import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MetodoPago {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 50,
    unique: true,
  })
  nombre!: string;

  @Column({
    default: true,
  })
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}