import { Controller, Get, Req } from "@nestjs/common";
import { HealthService } from "./health.service";
import { Request } from "express";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(@Req() request: Request) {
    const healthData = await this.healthService.check();

    // Add debug info for health checks
    return {
      ...healthData,
      debug: {
        timestamp: new Date().toISOString(),
        origin: request.headers.origin || 'no-origin',
        userAgent: request.headers['user-agent'] || 'no-user-agent',
        host: request.headers.host,
      }
    };
  }
}
