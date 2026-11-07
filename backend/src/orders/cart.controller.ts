import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's cart" })
  async getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add variant to cart' })
  async addItem(
    @CurrentUser() user: { id: string },
    @Body() body: { variantId: string; quantity?: number },
  ) {
    return this.cartService.addItem(user.id, body.variantId, body.quantity || 1);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @CurrentUser() user: { id: string },
    @Param('id') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItem(user.id, itemId, body.quantity);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@CurrentUser() user: { id: string }, @Param('id') itemId: string) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }

  @Post('reserve')
  @ApiOperation({ summary: 'Reserve inventory for items in cart' })
  async reserveCart(@CurrentUser() user: { id: string }) {
    return this.cartService.reserveCart(user.id);
  }

  @Delete('reserve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release cart reservation' })
  async releaseReservation(@Param('id') reservationId: string) {
    return this.cartService.releaseReservation(reservationId);
  }
}

