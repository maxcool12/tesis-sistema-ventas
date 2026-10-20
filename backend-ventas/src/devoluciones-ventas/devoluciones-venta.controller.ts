import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';

import { DevolucionesVentaService } from './devoluciones-venta.service';
import { CrearDevolucionDto } from './dto/crear-devolucion.dto';

@Controller('devoluciones-venta')
export class DevolucionesVentaController {
  constructor(
    private readonly devolucionesVentaService: DevolucionesVentaService,
  ) {}

  @Post()
  crear(@Body() data: CrearDevolucionDto) {
    return this.devolucionesVentaService.crear(data);
  }

  @Get()
  buscarTodas() {
    return this.devolucionesVentaService.buscarTodas();
  }

  @Get(':id')
  buscarUna(@Param('id', ParseIntPipe) id: number) {
    return this.devolucionesVentaService.buscarUna(id);
  }
  @Patch(':id/confirmar-reintegro')
confirmarReintegro(@Param('id', ParseIntPipe) id: number) {
  return this.devolucionesVentaService.confirmarReintegro(id);
}
}