import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { MetodoPagoService } from './metodo-pago.service';

@Controller('metodos-pago')
export class MetodoPagoController {

  constructor(
    private readonly metodoPagoService: MetodoPagoService,
  ) {}

  @Post()
  create(@Body('nombre') nombre: string) {
    return this.metodoPagoService.create(nombre);
  }

  @Get()
  findAll() {
    return this.metodoPagoService.findAll();
  }

  @Get('todos')
  findAllIncludingInactive() {
    return this.metodoPagoService.findAllIncludingInactive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metodoPagoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('nombre') nombre: string,
  ) {
    return this.metodoPagoService.update(+id, nombre);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metodoPagoService.remove(+id);
  }

  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.metodoPagoService.reactivar(+id);
  }
}