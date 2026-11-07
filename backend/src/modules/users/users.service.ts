import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAddressDto {
  fullName?: string;
  name?: string;
  phone: string;
  line1?: string;
  street?: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      ...user,
      firstName,
      lastName,
    };
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; name?: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    let resolvedName = dto.name;
    if (!resolvedName && (dto.firstName || dto.lastName)) {
      resolvedName = `${dto.firstName || ''} ${dto.lastName || ''}`.trim();
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: resolvedName !== undefined ? resolvedName : existing.name,
        phone: dto.phone !== undefined ? dto.phone : existing.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.getProfile(updated.id);
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const name = dto.name || dto.fullName;
    const street = dto.street || dto.line1;
    const landmark = dto.landmark || dto.line2;

    if (!name || !dto.phone || !street || !dto.city || !dto.state || !dto.pincode) {
      throw new BadRequestException('Required address fields are missing');
    }

    // If setting as default, unset other addresses
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const existingCount = await this.prisma.address.count({ where: { userId } });
    const isDefault = dto.isDefault ?? existingCount === 0;

    return this.prisma.address.create({
      data: {
        userId,
        name,
        phone: dto.phone,
        street,
        landmark: landmark || null,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        country: dto.country || 'India',
        isDefault,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: Partial<CreateAddressDto>) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        name: (dto.name || dto.fullName) ?? existing.name,
        phone: dto.phone ?? existing.phone,
        street: (dto.street || dto.line1) ?? existing.street,
        landmark: dto.landmark || dto.line2 !== undefined ? (dto.landmark || dto.line2) : existing.landmark,
        city: dto.city ?? existing.city,
        state: dto.state ?? existing.state,
        pincode: dto.pincode ?? existing.pincode,
        country: dto.country ?? existing.country,
        isDefault: dto.isDefault !== undefined ? dto.isDefault : existing.isDefault,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted successfully', id: addressId };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
