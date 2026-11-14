import { Inject, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../business/auth.service";
import { PUBLIC_ROUTE, SESSION_ACTOR, type AuthenticatedRequest } from "./access.decorators";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Never reuse an actor supplied by another hook or an earlier request.
    delete request[SESSION_ACTOR];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()]) === true) return true;
    context.switchToHttp().getResponse<{ header(name: string, value: string): unknown }>().header("Cache-Control", "no-store");
    request[SESSION_ACTOR] = await this.auth.authenticate(request.headers.authorization);
    return true;
  }
}
