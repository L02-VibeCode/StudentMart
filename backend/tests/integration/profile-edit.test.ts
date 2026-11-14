import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { School, Area } from "../../src/modules/accounts/business/catalog.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";

it("atomically updates only the current profile whitelist and real lookup references", async () => {
 const source = new DataSource(databaseOptions(loadConfig())); await source.initialize();
 const app = await authApp(source); const ids: string[] = [];
 const schoolId=randomUUID(), areaId=randomUUID();
 try {
  // Synthetic rows are scoped test fixtures, never approved TASK-15 seed data.
  await source.getRepository(School).save({id:schoolId,code:`test-${schoolId}`,name:"Fixture school"});
  await source.getRepository(Area).save({id:areaId,code:`test-${areaId}`,name:"Fixture area"});
  const service=new AccountsService(source.getRepository(Account));
  const a=await service.create({email:`edit-a-${randomUUID()}@example.invalid`,password:"test-password",displayName:"A"});ids.push(a.id);
  const b=await service.create({email:`edit-b-${randomUUID()}@example.invalid`,password:"test-password",displayName:"B"});ids.push(b.id);
  const login=await app.inject({method:"POST",url:"/api/v1/auth/login",payload:{email:a.email,password:"test-password"}});
  expect(login.statusCode).toBe(200);
  const headers={authorization:`Bearer ${login.json().session.token}`};
  const patch=(payload:unknown)=>app.inject({method:"PATCH",url:`/api/v1/accounts/me?accountId=${b.id}`,headers,payload:payload as object});
  const saved=await patch({displayName:"  Updated A  ",bio:"  Introduction  ",declaredSchoolId:schoolId,areaId});
  expect(saved.statusCode).toBe(200);
  expect(saved.headers["cache-control"]).toBe("no-store");
  expect(saved.json().account).toMatchObject({id:a.id,displayName:"Updated A",bio:"Introduction",declaredSchool:{id:schoolId,name:"Fixture school"},area:{id:areaId,name:"Fixture area"},schoolVerification:{status:"UNVERIFIED",school:null,verifiedAt:null}});
  expect(saved.body).not.toMatch(/password|token|loginDisabled/);
  const fresh=await app.inject({method:"GET",url:"/api/v1/accounts/me",headers});expect(fresh.json()).toEqual(saved.json());
  expect((await source.getRepository(Account).findOneByOrFail({id:b.id})).displayName).toBe("B");
  for(const key of ["role","schoolVerification","accountId","email","avatarUrl"]){expect((await patch({displayName:"attack",[key]:"forbidden"})).statusCode).toBe(400);}
  for(const payload of [{},{displayName:"  "},{displayName:null},{bio:"x".repeat(501)},{displayName:"uncommitted",declaredSchoolId:randomUUID()}])expect((await patch(payload)).statusCode).toBe(400);
  expect((await source.getRepository(Account).findOneByOrFail({id:a.id})).displayName).toBe("Updated A");
  const unicode=await patch({displayName:String.fromCodePoint(0x1f600).repeat(100)});expect(unicode.statusCode).toBe(200);
  expect((await patch({displayName:String.fromCodePoint(0x1f600).repeat(101)})).statusCode).toBe(400);
  const cleared=await patch({bio:"  ",declaredSchoolId:null,areaId:null});expect(cleared.statusCode).toBe(200);expect(cleared.json().account).toMatchObject({bio:null,declaredSchool:null,area:null});
  const catalog=await app.inject({method:"GET",url:"/api/v1/catalog/schools"});expect(catalog.statusCode).toBe(200);expect(catalog.json().items).toContainEqual({id:schoolId,code:`test-${schoolId}`,name:"Fixture school"});
  expect((await app.inject({method:"PATCH",url:"/api/v1/accounts/me",payload:{bio:"No session"}})).statusCode).toBe(401);
 } finally {
  await app.close();for(const id of ids){await source.getRepository(AuthSession).delete({accountId:id});await source.getRepository(Account).delete(id);}
  await source.getRepository(School).delete(schoolId);await source.getRepository(Area).delete(areaId);await source.destroy();
 }
},30000);
