import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateCategoriaDto {

  @IsString()
  @IsNotEmpty({
    message: 'El nombre de la categoría es obligatorio.',
  })
  @Length(2, 100, {
    message: 'El nombre de la categoría debe tener entre 2 y 100 caracteres.',
  })
  nombre!: string;
}