import { Controller, Get, Req, Res } from "@nestjs/common";
import { HealthService } from "./health.service";
import { Request, Response } from "express";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(@Req() request: Request, @Res() response: Response) {
    // Set CORS headers manually for health checks to prevent CORS issues
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type');

    const healthData = await this.healthService.check();

    // Add debug info for health checks (only in development)
    const responseData = process.env.NODE_ENV === "development" ? {
      ...healthData,
      debug: {
        timestamp: new Date().toISOString(),
        origin: request.headers.origin || 'no-origin',
        userAgent: request.headers['user-agent'] || 'no-user-agent',
        host: request.headers.host,
      }
    } : healthData;

    return response.json(responseData);
  }

}
