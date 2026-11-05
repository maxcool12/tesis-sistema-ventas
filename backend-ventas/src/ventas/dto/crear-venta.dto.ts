import {
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsOptional,
  IsNumber,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ProductoVentaDto {
  @IsInt()
  @Min(1)
  productoId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CrearVentaDto {
  @IsInt()
  @Min(1)
  clienteId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  metodoPagoId?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saldoFavorUsado?: number;

  @IsInt()
  @Min(1)
  empleadoId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductoVentaDto)
  productos!: ProductoVentaDto[];
}