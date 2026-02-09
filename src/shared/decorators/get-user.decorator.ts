import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserDataJWT } from '@shared/interfaces/decodeJWT';

/**
 * Decorator personalizado para extraer el usuario autenticado del request
 * Uso: @GetUser() user: IUserDataJWT
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): IUserDataJWT => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se especifica una propiedad específica, retornarla
    if (data) {
      return user?.[data];
    }

    // Retornar el usuario completo
    return user;
  },
);
