import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { expect, it, vi } from "vitest";
import { configureHttp } from "../../src/shared/http/configure-http";
it("logs only sanitized avatar receive/response timing when explicitly enabled",async()=>{
 const spy=vi.spyOn(console,"info").mockImplementation(()=>{});
 const module=await Test.createTestingModule({}).compile();
 const app=module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(),{logger:false});
 configureHttp(app,{avatarDiagnostics:true});await app.init();await app.getHttpAdapter().getInstance().ready();
 try{
  const response=await app.inject({method:"PUT",url:"/api/v1/accounts/me/avatar?token=private-query",headers:{authorization:"Bearer private-header"},payload:{file:"private-content"}});
  expect(response.statusCode).toBe(404);
  expect(spy.mock.calls.map(([value])=>JSON.parse(value as string))).toEqual([
   {event:"avatar_request",phase:"received",method:"PUT",path:"/api/v1/accounts/me/avatar",elapsedMs:expect.any(Number)},
   {event:"avatar_request",phase:"completed",method:"PUT",path:"/api/v1/accounts/me/avatar",elapsedMs:expect.any(Number),status:404},
  ]);
  expect(JSON.stringify(spy.mock.calls)).not.toContain("private");
  await app.inject({method:"GET",url:"/health"});expect(spy).toHaveBeenCalledTimes(2);
 }finally{await app.close();spy.mockRestore();}
});
it("leaves avatar diagnostics disabled by default",async()=>{
 const spy=vi.spyOn(console,"info").mockImplementation(()=>{});
 const module=await Test.createTestingModule({}).compile();const app=module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(),{logger:false});configureHttp(app);await app.init();await app.getHttpAdapter().getInstance().ready();
 try{await app.inject({method:"PUT",url:"/api/v1/accounts/me/avatar",payload:{}});expect(spy).not.toHaveBeenCalled();}finally{await app.close();spy.mockRestore();}
});
