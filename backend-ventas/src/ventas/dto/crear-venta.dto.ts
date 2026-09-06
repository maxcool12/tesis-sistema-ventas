import {
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
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

  @IsInt()
  @Min(1)
  metodoPagoId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductoVentaDto)
  productos!: ProductoVentaDto[];
}