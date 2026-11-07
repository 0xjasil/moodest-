import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@ApiTags('Admin')
@Controller('admin')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('ping')
  @ApiOperation({ summary: 'Admin health probe' })
  ping() {
    return {
      message: 'Admin service operational',
      data: { ping: 'pong' },
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('revenue-report')
  @ApiOperation({ summary: 'Get daily revenue breakdown' })
  async getRevenueReport(@Query('days') days?: number) {
    return this.adminService.getRevenueReport(days ? Number(days) : 30);
  }

  @Get('customer-analytics')
  @ApiOperation({ summary: 'Get customer analytics and top spenders' })
  async getCustomerAnalytics() {
    return this.adminService.getCustomerAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users with pagination and search' })
  async getUsers(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAdminUsers({ search, page, limit });
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List admin activity and audit logs' })
  async getAuditLogs(
    @Query('limit') limit?: number,
    @Query('entity') entity?: string,
  ) {
    return this.adminService.getAuditLogs({ limit, entity });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'List low stock variants' })
  async getLowStockVariants(@Query('threshold') threshold?: number) {
    return this.adminService.getLowStockVariants(threshold ? Number(threshold) : 5);
  }

  @Get('export/revenue.csv')
  @ApiOperation({ summary: 'Export revenue report as CSV' })
  async exportRevenueCsv(@Query('days') days?: number, @Res() res?: Response) {
    const report = await this.adminService.getRevenueReport(days ? Number(days) : 30);
    const csvRows = ['Date,Revenue,Orders'];
    for (const r of report) {
      csvRows.push(`${r.date},${r.revenue},${r.orders}`);
    }
    const csvContent = csvRows.join('\n');
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="revenue.csv"');
      return res.send(csvContent);
    }
    return csvContent;
  }
}
