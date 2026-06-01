import { Controller, Post, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private service: UsuariosService) {}

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Post('login')
  login(@Body() data: any) {
    return this.service.login(data);
  }
}