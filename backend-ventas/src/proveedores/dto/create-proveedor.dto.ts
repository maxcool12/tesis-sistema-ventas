import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { IsCuitValido } from '../validators/cuit.validator';


export class CreateProveedorDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio.' })
    @Length(2, 100, {
        message: 'El nombre debe tener entre 2 y 100 caracteres.',
    })
    @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
        message: 'El nombre solo puede contener letras y espacios.',
    })
    nombre!: string;
    @IsCuitValido({
        message: 'El CUIT ingresado no es válido.',
    })
    cuit!: string;
    @IsString()
    @IsNotEmpty({ message: 'El CUIT es obligatorio.' })
    @Matches(/^\d{11}$/, {
        message: 'El CUIT debe contener exactamente 11 números.',
    })


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

    @IsOptional()
    @IsString()
    @Length(0, 200, {
        message: 'La dirección no puede superar los 200 caracteres.',
    })
    direccion?: string;
}