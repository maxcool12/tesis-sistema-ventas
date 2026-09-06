import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateClienteDto {

  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio.',
  })
  @Length(2, 100)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El nombre solo puede contener letras.',
  })

  nombre!: string;

  @IsString()
  @IsNotEmpty({
    message: 'El apellido es obligatorio.',
  })
  @Length(2, 100)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El apellido solo puede contener letras.',
  })
  apellido!: string;

  @IsEmail(
    {},
    {
      message: 'Debe ingresar un email válido.',
    },
  )
  email!: string;

  @IsString()
  @IsNotEmpty({
    message: 'El teléfono es obligatorio.',
  })
  @Length(6, 30)
  telefono!: string;

}