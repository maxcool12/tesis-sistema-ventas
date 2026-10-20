import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Length,
} from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @Length(2, 100)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @Length(2, 100)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios.',
  })
  apellido!: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio.' })
  @Matches(/^\d{7,8}$/, {
    message: 'El DNI debe contener 7 u 8 números, sin puntos ni espacios.',
  })
  dni!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7,30}$/, {
    message: 'El teléfono debe contener solo números y al menos 7 dígitos.',
  })
  telefono?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  @IsEmail({}, { message: 'Debe ingresar un email válido.' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'El cargo es obligatorio.' })
  @IsIn(['empleado', 'administrador'], {
    message: 'El cargo debe ser empleado o administrador.',
  })
  cargo!: string;

  @IsDateString({}, {
    message: 'La fecha de ingreso debe ser una fecha válida.',
  })
  fechaIngreso!: string;
}