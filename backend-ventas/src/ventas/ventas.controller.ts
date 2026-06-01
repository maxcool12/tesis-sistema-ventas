import { Controller, Post, Body, Get } from '@nestjs/common';
import { VentasService } from './ventas.service';

@Controller('ventas')
export class VentasController {
  constructor(private service: VentasService) {}

  @Post()
  crear(@Body() data: any) {
    return this.service.crearVenta(data);
  }
@Get('dashboard')
getDashboard() {
  return this.service.getDashboard();
}
  
}
