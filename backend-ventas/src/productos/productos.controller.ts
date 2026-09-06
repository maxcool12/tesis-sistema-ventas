import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Put
} from '@nestjs/common';
import { CreateProductoDto } from './dto/CreateProductoDto';
import { UpdateProductoDto } from './dto/UpdateProductoDto';
import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductosController {
  constructor(private service: ProductosService) { }
  @Get('todos')
getTodos() {
  return this.service.findAllIncludingInactive();
}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: CreateProductoDto) {
  return this.service.create(data);
}

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.desactivar(Number(id));
  }
  @Put(':id')
  update(
  @Param('id') id: string,
  @Body() data: UpdateProductoDto,
) {
  return this.service.actualizar(
    Number(id),
    data,
  );
}
  @Put(':id/reactivar')
reactivar(@Param('id') id: number) {
  return this.service.reactivar(
    Number(id)
  );
}
}