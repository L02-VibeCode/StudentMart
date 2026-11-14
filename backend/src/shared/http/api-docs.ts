import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { parse } from "yaml";

export function configureApiDocs(app: NestFastifyApplication): void {
  const bundledContract = resolve(__dirname, "accounts.openapi.yaml");
  const contractPath = existsSync(bundledContract)
    ? bundledContract
    : resolve(__dirname, "../../../../docs/contracts/accounts.openapi.yaml");
  const contract = parse(readFileSync(contractPath, "utf8")) as OpenAPIObject;
  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle("StudentMart API")
    .setDescription("API đang triển khai của StudentMart. Đăng ký tạo tài khoản MEMBER, không cấp phiên đăng nhập.")
    .setVersion(contract.info.version)
    .addServer("/", "Backend đang mở trang tài liệu")
    .build());
  document.openapi = contract.openapi;
  document.security = contract.security;

  // Discover implemented routes in Nest, then enrich them with the canonical contract.
  // Planned endpoints from the contract must not appear as callable implementations.
  document.components = { ...contract.components, ...document.components,
    schemas: { ...contract.components?.schemas, ...document.components?.schemas } };
  for (const path of Object.keys(document.paths)) {
    const definition = contract.paths[path.replace(/^\/api\/v1(?=\/)/, "")];
    for (const method of ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const) {
      if (document.paths[path][method] && definition?.[method]) {
        document.paths[path][method] = definition[method];
      }
    }
  }
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "StudentMart API Docs",
    jsonDocumentUrl: "api/docs/openapi.json",
    yamlDocumentUrl: "api/docs/openapi.yaml",
    swaggerOptions: {
      persistAuthorization: false,
      validatorUrl: null,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  });
}
