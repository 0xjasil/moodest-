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

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories with subcategories' })
  async getAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        subCategories: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image,
      totalProducts: (c as any)._count?.products ?? 0,
      children: c.subCategories.map((sc) => ({
        id: sc.id,
        name: sc.name,
        slug: sc.slug,
        parentId: c.id,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID or slug' })
  async getById(@Param('id') idOrSlug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        subCategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${idOrSlug} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image,
      children: category.subCategories.map((sc) => ({
        id: sc.id,
        name: sc.name,
        slug: sc.slug,
        parentId: category.id,
      })),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create category or subcategory (Admin)' })
  async create(
    @Body()
    body: {
      name: string;
      slug?: string;
      description?: string;
      image?: string;
      parentId?: string;
      categoryId?: string;
    },
  ) {
    const parentId = body.parentId || body.categoryId;
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (parentId && parentId !== 'none') {
      const sub = await this.prisma.subCategory.create({
        data: {
          name: body.name,
          slug,
          categoryId: parentId,
        },
      });
      return sub;
    }

    const category = await this.prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        image: body.image || '/placeholder.png',
      },
      include: { subCategories: true },
    });

    return category;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update category (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; image?: string },
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        image: body.image ?? existing.image,
      },
      include: { subCategories: true },
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (Admin)' })
  async delete(@Param('id') id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully', id };
  }
}

