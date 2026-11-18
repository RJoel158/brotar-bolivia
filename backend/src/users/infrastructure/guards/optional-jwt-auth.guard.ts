import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Allows unauthenticated access; if a Bearer token is present, validates it
 * and attaches request.user. Invalid tokens yield 401.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err) {
      throw err;
    }
    return user ?? null;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const authorization = request.headers?.authorization;
    if (!authorization) {
      return true;
    }
    return super.canActivate(context);
  }
}
