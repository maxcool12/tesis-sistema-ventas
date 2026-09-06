import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CrearVentaDto } from './dto/crear-venta.dto';


@Controller('ventas')
export class VentasController {
  constructor(private service: VentasService) { }

  @Post()
  crear(@Body() data: CrearVentaDto) {
    return this.service.crearVenta(data);
  }

  

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('clienteId') clienteId?: string,
    @Query('metodoPagoId') metodoPagoId?: string,

  ) {

    return this.service.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      desde,
      hasta,
      clienteId ? Number(clienteId) : undefined,
      metodoPagoId ? Number(metodoPagoId) : undefined,
    );
  }


  @Get('dashboard')
  getDashboard(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    console.log('CONTROLLER DESDE:', desde);
    console.log('CONTROLLER HASTA:', hasta);

    return this.service.getDashboard(desde, hasta);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

}