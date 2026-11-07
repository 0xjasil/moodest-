import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@ApiTags('Store Operations')
@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // --- COUPONS ---

  @Public()
  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validate coupon code against order amount' })
  async validateCoupon(@Body() body: { code: string; orderAmount: number }) {
    return this.storeService.validateCoupon(body.code, body.orderAmount);
  }

  @Get('coupons')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all coupons (Admin)' })
  async getCoupons() {
    return this.storeService.getAllCoupons();
  }

  @Post('coupons')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create new coupon (Admin)' })
  async createCoupon(@Body() body: any) {
    return this.storeService.createCoupon(body);
  }

  @Delete('coupons/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete coupon (Admin)' })
  async deleteCoupon(@Param('id') id: string) {
    return this.storeService.deleteCoupon(id);
  }

  // --- REVIEWS ---

  @Public()
  @Get('reviews/product/:id')
  @ApiOperation({ summary: 'Get product reviews' })
  async getProductReviews(
    @Param('id') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.storeService.getProductReviews(
      productId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Post('reviews/product/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add product review' })
  async createReview(
    @CurrentUser() user: { id: string },
    @Param('id') productId: string,
    @Body() body: { rating: number; title?: string; body?: string; comment?: string },
  ) {
    return this.storeService.createReview(user.id, productId, body);
  }

  // --- WISHLIST ---

  @Get('wishlist')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get current user's wishlist" })
  async getWishlist(@CurrentUser() user: { id: string }) {
    return this.storeService.getWishlist(user.id);
  }

  @Post('wishlist/:productId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addToWishlist(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.storeService.addToWishlist(user.id, productId);
  }

  @Delete('wishlist/:productId')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  async removeFromWishlist(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.storeService.removeFromWishlist(user.id, productId);
  }

  // --- BANNERS & FLASH SALES ---

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Get active storefront banners' })
  async getBanners() {
    return this.storeService.getBanners();
  }

  @Public()
  @Get('flash-sales')
  @ApiOperation({ summary: 'Get active flash sales' })
  async getFlashSales() {
    return this.storeService.getFlashSales();
  }

  // --- WALLET ---

  @Get('wallet/me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user wallet balance' })
  async getWallet(@CurrentUser() user: { id: string }) {
    return this.storeService.getWallet(user.id);
  }

  @Get('wallet/me/transactions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user wallet transactions' })
  async getWalletTransactions(@CurrentUser() user: { id: string }) {
    return this.storeService.getWalletTransactions(user.id);
  }

  @Post('wallet/withdraw')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request wallet withdrawal' })
  async withdraw(@CurrentUser() user: { id: string }, @Body() body: { amount: number }) {
    return { message: 'Withdrawal request submitted', amount: body.amount };
  }

  @Get('wallet/ledger')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get wallet ledger (Admin)' })
  async getWalletLedger(@Query('from') from?: string, @Query('to') to?: string) {
    return this.storeService.getWalletLedger(from, to);
  }
}

