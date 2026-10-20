import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductoDevolucionDto {
  @IsInt()
  @Min(1)
  detalleVentaId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CrearDevolucionDto {
  @IsInt()
  @Min(1)
  ventaId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  empleadoId?: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['reintegro', 'saldo_favor'])
  tipoCredito!: 'reintegro' | 'saldo_favor';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductoDevolucionDto)
  productos!: ProductoDevolucionDto[];
}