import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Controller()
export class ProxyController {
  private frontendProxy = createProxyMiddleware({
    target: 'http://host.docker.internal:5173',
    changeOrigin: true,
    ws: true,
  });

  @Get(['express', 'express/*', 'full', 'full/*'])
  async proxyToFrontend(@Res() res: Response) {
    try {
      // Proxy the request to the frontend
      this.frontendProxy(res.req as any, res, (error) => {
        if (error) {
          throw new HttpException('Frontend proxy error', HttpStatus.BAD_GATEWAY);
        }
      });
    } catch (error) {
      throw new HttpException('Frontend not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get('/')
  async proxyRoot(@Res() res: Response) {
    try {
      this.frontendProxy(res.req as any, res, (error) => {
        if (error) {
          throw new HttpException('Frontend proxy error', HttpStatus.BAD_GATEWAY);
        }
      });
    } catch (error) {
      throw new HttpException('Frontend not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}