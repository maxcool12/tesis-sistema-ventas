import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio.',
  })
  @Length(2, 100)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  codigo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  descripcion?: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsNumber()
  @Min(0)
  costo!: number;

  @IsNumber()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  marca?: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsInt()
  @Min(1)
  categoriaId!: number;

  @IsInt()
  @Min(1)
  proveedorId!: number;

  @IsInt()
  @Min(1)
  empleadoCargaId!: number;
}