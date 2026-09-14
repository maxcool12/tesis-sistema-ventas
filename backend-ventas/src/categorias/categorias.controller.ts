import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly categoriasService: CategoriasService,
  ) {}

  
  @Get()
  findAll() {
    return this.categoriasService.findAll();
  }

  
  @Get('todos')
  findAllIncludingInactive() {
    return this.categoriasService.findAllIncludingInactive();
  }

  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriasService.findOne(Number(id));
  }

  
  @Post()
  create(@Body() dto: CreateCategoriaDto) {
    return this.categoriasService.create(dto);
  }

  
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    return this.categoriasService.update(
      Number(id),
      dto,
    );
  }

 
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriasService.remove(
      Number(id),
    );
  }

  
  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.categoriasService.reactivar(
      Number(id),
    );
  }
}