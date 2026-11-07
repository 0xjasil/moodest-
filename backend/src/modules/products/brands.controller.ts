import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all brands' })
  async getAll() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo || undefined,
      logo: b.logo,
      productCount: b._count.products,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID or slug' })
  async getById(@Param('id') idOrSlug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${idOrSlug} not found`);
    }

    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logo || undefined,
      logo: brand.logo,
      productCount: brand._count.products,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create brand (Admin)' })
  async create(@Body() body: { name: string; slug?: string; logo?: string }) {
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return this.prisma.brand.create({
      data: {
        name: body.name,
        slug,
        logo: body.logo || null,
        isActive: true,
      },
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update brand (Admin)' })
  async update(@Param('id') id: string, @Body() body: { name?: string; logo?: string; isActive?: boolean }) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Brand ${id} not found`);
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        logo: body.logo !== undefined ? body.logo : existing.logo,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete brand (Admin)' })
  async delete(@Param('id') id: string) {
    const existing = await this.prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Brand ${id} not found`);
    }

    await this.prisma.brand.delete({ where: { id } });
    return { message: 'Brand deleted successfully', id };
  }
}

