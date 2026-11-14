import type { FastifyInstance, FastifyRequest } from "fastify";
// Development diagnostics only: never record headers, query strings, image/file data,
// user IDs, bearer tokens, provider details or original exception messages.
export function configureAvatarDiagnostics(server: FastifyInstance): void {
  const started = new WeakMap<FastifyRequest, number>();
  const path = "/api/v1/accounts/me/avatar";
  const emit = (request: FastifyRequest, phase: string, status?: number) => {
    console.info(JSON.stringify({event:"avatar_request",phase,method:request.method,path,
      elapsedMs:Math.max(0,Date.now()-(started.get(request)??Date.now())),...(status===undefined?{}:{status})}));
  };
  server.addHook("onRequest",async request=>{
    if(request.url.split("?")[0]!==path)return;
    started.set(request,Date.now());emit(request,"received");
  });
  server.addHook("onResponse",async(request,reply)=>{
    if(!started.has(request))return;
    emit(request,"completed",reply.statusCode);started.delete(request);
  });
  server.addHook("onRequestAbort",async request=>{
    if(!started.has(request))return;
    emit(request,"client_aborted");started.delete(request);
  });
}
