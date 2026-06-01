import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from './productos/productos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { VentasModule } from './ventas/ventas.module';
import { UsuariosModule } from './usuarios/usuarios.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'ventas_db',
      autoLoadEntities: true,
      synchronize: true, 
    }),
    ProductosModule,
    CategoriasModule,
    VentasModule,
    UsuariosModule,
  ],
})
export class AppModule {}