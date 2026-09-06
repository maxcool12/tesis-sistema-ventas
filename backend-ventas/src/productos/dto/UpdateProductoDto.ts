import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './CreateProductoDto';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {}