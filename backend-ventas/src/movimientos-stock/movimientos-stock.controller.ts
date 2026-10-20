import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { MovimientosStockService } from './movimiento-stock.service';

@Controller('movimientos-stock')
export class MovimientosStockController {
  constructor(
    private service: MovimientosStockService,
  ) {}

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get()
  findAll(
    @Query('buscar') buscar?: string,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      buscar,
      tipo,
      desde,
      hasta,
      page ? Number(page) : 1,
      limit ? Number(limit) : 15,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }
}