import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Backend service health check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  checkHealth() {
    return {
      message: 'Service is operational',
      data: this.healthService.getHealth(),
    };
  }
}
