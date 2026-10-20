import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosModule } from './productos/productos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { VentasModule } from './ventas/ventas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { MetodoPagoModule } from './metodo-pago/metodo-pago.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { MovimientosStockModule } from './movimientos-stock/movimientos-stock.module';
import { DevolucionesVentaModule } from './devoluciones-ventas/devoluciones-venta.module';

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
    ClientesModule,
    MetodoPagoModule,
    EmpleadosModule,
    ProveedoresModule,
    MovimientosStockModule,
    DevolucionesVentaModule,
  ],
})
export class AppModule {}