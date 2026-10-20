import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCuitValido(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCuitValido',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !/^\d{11}$/.test(value)) {
            return false;
          }

          const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

          const suma = value
            .slice(0, 10)
            .split('')
            .reduce(
              (total, digito, indice) =>
                total + Number(digito) * multiplicadores[indice],
              0,
            );

          const resto = suma % 11;
          let verificador = 11 - resto;

          if (verificador === 11) verificador = 0;
          if (verificador === 10) verificador = 9;

          return Number(value[10]) === verificador;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no es un CUIT válido.`;
        },
      },
    });
  };
}