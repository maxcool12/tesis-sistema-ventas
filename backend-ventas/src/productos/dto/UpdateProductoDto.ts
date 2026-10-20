import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

import { CreateProductoDto } from './CreateProductoDto';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @IsOptional()
  @IsInt()
  @Min(1)
  empleadoId?: number;
}