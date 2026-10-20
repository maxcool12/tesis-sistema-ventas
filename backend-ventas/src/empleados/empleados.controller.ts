import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { EmpleadosService } from './empleados.service';

@Controller('empleados')
export class EmpleadosController {
  constructor(private service: EmpleadosService) { }

  @Post()
  create(@Body() data: CreateEmpleadoDto) {
    return this.service.create(data);
  }
  @Get()
  findAll(
    @Query('buscar') buscar?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      buscar,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('todos')
  findAllActive() {
    return this.service.findAllActive();
  }

  @Get('inactivos')
  findInactive() {
    return this.service.findInactive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateEmpleadoDto,
  ) {
    return this.service.update(Number(id), data);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Patch(':id/reactivar')
  reactivate(@Param('id') id: string) {
    return this.service.reactivate(Number(id));
  }
}