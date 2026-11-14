import { Inject, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { AuthError } from "../business/auth-errors";
import type { ResourceAccessResolver } from "../business/resource-access";
import { ACCESS_POLICIES, requestActor, type AccessPolicy, type AuthenticatedRequest } from "./access.decorators";

@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(ModuleRef) private readonly modules: ModuleRef) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const classPolicies = this.reflector.get<AccessPolicy[] | undefined>(ACCESS_POLICIES, context.getClass());
    const methodPolicies = this.reflector.get<AccessPolicy[] | undefined>(ACCESS_POLICIES, context.getHandler());
    if (classPolicies === undefined && methodPolicies === undefined) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = requestActor(request);
    const policies = [...(classPolicies ?? []), ...(methodPolicies ?? [])];
    if (!policies.length) throw new AuthError(403, "FORBIDDEN");
    for (const policy of policies) {
      if (policy.kind === "admin") {
        if (actor.account.role !== "ADMIN") throw new AuthError(403, "FORBIDDEN");
        continue;
      }
      const resourceId = (request.params as Record<string, unknown> | undefined)?.[policy.resourceParam];
      if (typeof resourceId !== "string" || !resourceId) throw new AuthError(403, "FORBIDDEN");
      let resolver: ResourceAccessResolver;
      try { resolver = this.modules.get<ResourceAccessResolver>(policy.resolver, { strict: false }); }
      catch { throw new AuthError(403, "FORBIDDEN"); }
      if (policy.kind === "owner") {
        if (typeof resolver?.ownerId !== "function" || await resolver.ownerId(resourceId) !== actor.account.id) throw new AuthError(403, "FORBIDDEN");
      } else if (policy.kind === "conversationMember") {
        if (typeof resolver?.isConversationMember !== "function" || await resolver.isConversationMember(resourceId, actor.account.id) !== true) throw new AuthError(403, "FORBIDDEN");
      } else throw new AuthError(403, "FORBIDDEN");
    }
    return true;
  }
}
