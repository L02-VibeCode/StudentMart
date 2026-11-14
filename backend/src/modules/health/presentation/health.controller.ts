import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PublicRoute } from "../../auth/presentation/access.decorators";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @PublicRoute()
  @ApiOperation({ summary: "Kiểm tra backend đang chạy", security: [] })
  @ApiOkResponse({ schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ok"] } } } })
  check() {
    return { status: "ok" };
  }
}
