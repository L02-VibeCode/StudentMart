import { createParamDecorator, SetMetadata, type ExecutionContext, type InjectionToken } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthError } from "../business/auth-errors";
import type { ResourceAccessResolver } from "../business/resource-access";
import type { SessionActor } from "../business/session-actor";

export const PUBLIC_ROUTE = Symbol("studentmart.public-route");
export const ACCESS_POLICIES = Symbol("studentmart.access-policies");
export const SESSION_ACTOR = Symbol("studentmart.session-actor");
export type AuthenticatedRequest = FastifyRequest & { [SESSION_ACTOR]?: SessionActor };
export type AccessPolicy =
  | { kind: "admin" }
  | { kind: "owner" | "conversationMember"; resolver: InjectionToken<ResourceAccessResolver>; resourceParam: string };

/** Skips live-session verification only. Logout still validates its bearer itself. */
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE, true);
/** Every supplied policy must pass; class and handler policies are combined. */
export function RequireAccess(...policies: AccessPolicy[]): ClassDecorator & MethodDecorator {
  return (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => {
    const destination = descriptor?.value ?? target;
    const existing = Reflect.getOwnMetadata(ACCESS_POLICIES, destination) as AccessPolicy[] | undefined;
    Reflect.defineMetadata(ACCESS_POLICIES, [...(existing ?? []), ...policies], destination);
  };
}

export function requestActor(request: AuthenticatedRequest): SessionActor {
  const actor = request[SESSION_ACTOR];
  if (!actor) throw new AuthError(401, "UNAUTHENTICATED");
  return actor;
}
export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext): SessionActor =>
  requestActor(context.switchToHttp().getRequest<AuthenticatedRequest>()));
