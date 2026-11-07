import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IMailService {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';

@Injectable()
export class DevMailService implements IMailService {
  private readonly logger = new Logger(DevMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, _resetToken: string): Promise<void> {
    const masked = this.maskEmail(email);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    // Development logging: log masked recipient and base URL only.
    // NEVER log the raw token, token hash, or complete reset link URL.
    this.logger.log(
      `[DevMailService] Dispatched password reset notification for recipient: ${masked} (target origin: ${frontendUrl})`,
    );
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@unknown';
    }
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }
}

