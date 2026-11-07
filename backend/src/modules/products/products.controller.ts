import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService, ProductQueryFilters } from './products.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  async getAll(@Query() query: ProductQueryFilters) {
    return this.productsService.getAll(query);
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete search suggestions' })
  async autocomplete(@Query('q') q: string) {
    return this.productsService.autocomplete(q);
  }

  @Public()
  @Get('trending-searches')
  @ApiOperation({ summary: 'Get trending search queries' })
  async getTrendingSearches(@Query('limit') limit?: number) {
    return this.productsService.getTrendingSearches(limit ? Number(limit) : 10);
  }

  @Public()
  @Get('facets')
  @ApiOperation({ summary: 'Get catalog facets and filters' })
  async getFacets(@Query() filters: Partial<ProductQueryFilters>) {
    return this.productsService.getFacets(filters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID or slug' })
  async getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  async getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getRelated(id, limit ? Number(limit) : 8);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create new product (Admin)' })
  async create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product (Admin)' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive product (Admin)' })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  // --- PRODUCT VARIANTS ---

  @Public()
  @Get(':productId/variants')
  @ApiOperation({ summary: 'List product variants' })
  async getVariants(@Param('productId') productId: string) {
    return this.productsService.getVariants(productId);
  }

  @Post(':productId/variants')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add product variant (Admin)' })
  async addVariant(@Param('productId') productId: string, @Body() body: any) {
    return this.productsService.addVariant(productId, body);
  }

  @Patch(':productId/variants/:variantId')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product variant (Admin)' })
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() body: any,
  ) {
    return this.productsService.updateVariant(variantId, body);
  }

  @Delete(':productId/variants/:variantId')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product variant (Admin)' })
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.productsService.deleteVariant(variantId);
  }
}

