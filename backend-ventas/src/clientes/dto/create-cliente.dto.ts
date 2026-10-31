import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @Length(2, 100, {
    message: 'El nombre debe tener entre 2 y 100 caracteres.',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres.',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios.',
  })
  apellido!: string;

  @IsString()
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @IsEmail({}, { message: 'Debe ingresar un email válido.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^(?=(?:\D*\d){7,15}\D*$)\+?[\d\s()-]+$/, {
    message: 'El teléfono debe contener entre 7 y 15 números.',
  })
  telefono!: string;
}