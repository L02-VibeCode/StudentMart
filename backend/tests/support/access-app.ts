import "reflect-metadata";
import { Controller, Get } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DataSource } from "typeorm";
import { AuthModule } from "../../src/modules/auth/auth.module";
import type { ResourceAccessResolver } from "../../src/modules/auth/business/resource-access";
import type { SessionActor } from "../../src/modules/auth/business/session-actor";
import { CurrentActor, PublicRoute, RequireAccess } from "../../src/modules/auth/presentation/access.decorators";
import { loadConfig } from "../../src/shared/config/env";
import { configureHttp } from "../../src/shared/http/configure-http";

const RESOURCE_SOURCE = Symbol("test-only-resource-source");
export class TestResourceAccess implements ResourceAccessResolver {
  readonly owners = new Map<string, string>();
  readonly conversationMembers = new Map<string, Set<string>>();
  async ownerId(id: string) { return this.owners.get(id) ?? null; }
  async isConversationMember(id: string, accountId: string) { return this.conversationMembers.get(id)?.has(accountId) ?? false; }
}

// These endpoints are only compiled by tests, never registered in AppModule.
class AccessFixtureController {
  public() { return { public: true }; }
  private(actor: SessionActor) { return { accountId: actor.account.id, role: actor.account.role }; }
  owner(actor: SessionActor) { return { accountId: actor.account.id }; }
  member(actor: SessionActor) { return { accountId: actor.account.id }; }
  admin() { return { allowed: true }; }
  unconfigured() { return { allowed: true }; }
  missingParam() { return { allowed: true }; }
  emptyPolicy() { return { allowed: true }; }
  stacked() { return { allowed: true }; }
}

class AdminOwnerFixtureController {
  owned() { return { allowed: true }; }
}
Controller("test/admin-owner")(AdminOwnerFixtureController);
RequireAccess({ kind: "admin" })(AdminOwnerFixtureController);
const combinedDescriptor = Object.getOwnPropertyDescriptor(AdminOwnerFixtureController.prototype, "owned")!;
Get(":id")(AdminOwnerFixtureController.prototype, "owned", combinedDescriptor);
RequireAccess({ kind: "owner", resolver: RESOURCE_SOURCE, resourceParam: "id" })(AdminOwnerFixtureController.prototype, "owned", combinedDescriptor);

// Tests are outside tsconfig's decorator transform; apply the same Nest metadata explicitly.
Controller("test/access")(AccessFixtureController);
function route(name: keyof AccessFixtureController, path: string, ...decorators: MethodDecorator[]) {
  const descriptor = Object.getOwnPropertyDescriptor(AccessFixtureController.prototype, name)!;
  Get(path)(AccessFixtureController.prototype, name, descriptor);
  decorators.forEach(decorator => decorator(AccessFixtureController.prototype, name, descriptor));
}
route("public", "public", PublicRoute());
route("private", "private");
route("owner", "owners/:id", RequireAccess({ kind: "owner", resolver: RESOURCE_SOURCE, resourceParam: "id" }));
route("member", "conversations/:id", RequireAccess({ kind: "conversationMember", resolver: RESOURCE_SOURCE, resourceParam: "id" }));
route("admin", "admin", RequireAccess({ kind: "admin" }));
route("unconfigured", "unconfigured/:id", RequireAccess({ kind: "owner", resolver: "missing-test-resource-source", resourceParam: "id" }));
route("missingParam", "missing-param", RequireAccess({ kind: "owner", resolver: RESOURCE_SOURCE, resourceParam: "id" }));
route("emptyPolicy", "empty-policy", RequireAccess());
route("stacked", "admin-and-owner/:id",
  RequireAccess({ kind: "owner", resolver: RESOURCE_SOURCE, resourceParam: "id" }), RequireAccess({ kind: "admin" }));
for (const name of ["private", "owner", "member"] as const) CurrentActor()(AccessFixtureController.prototype, name, 0);

export async function accessApp(source: DataSource, resources = new TestResourceAccess()): Promise<NestFastifyApplication> {
  const auth = AuthModule.register(loadConfig({ NODE_ENV: "test", AUTH_RATE_LIMIT_SECRET: "test-secret-not-for-deployment-123456" }));
  const module = await Test.createTestingModule({
    imports: [{ ...auth, providers: [...auth.providers!, { provide: DataSource, useValue: source }] }],
    controllers: [AccessFixtureController, AdminOwnerFixtureController], providers: [{ provide: RESOURCE_SOURCE, useValue: resources }],
  }).compile();
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ requestIdHeader: false, bodyLimit: 16384 }), { logger: false });
  configureHttp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
