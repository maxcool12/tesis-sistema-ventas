import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Cliente {

  @PrimaryGeneratedColumn()
id!: number;

@Column({
  length: 100,
})
nombre!: string;

@Column({
  length: 100,
})
apellido!: string;

@Column({
  unique: true,
  length: 150,
})
email!: string;

@Column({
  length: 30,
})
telefono!: string;

@Column({
  default: true,
})
activo!: boolean;

@CreateDateColumn()
createdAt!: Date;

@UpdateDateColumn()
updatedAt!: Date;

}