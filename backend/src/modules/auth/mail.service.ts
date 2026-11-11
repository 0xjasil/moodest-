import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface IMailService {
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendVerificationOtpEmail(email: string, otp: string): Promise<void>;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@unknown';
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

@Injectable()
export class SmtpMailService implements IMailService {
  private readonly logger = new Logger(SmtpMailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly smtpFrom: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(
      this.configService.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '587',
      10,
    );
    const secure =
      (this.configService.get<string>('SMTP_SECURE') || process.env.SMTP_SECURE) === 'true';

    this.smtpUser = this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER || '';
    this.smtpPass = this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS || '';
    this.smtpFrom =
      this.configService.get<string>('SMTP_FROM') ||
      process.env.SMTP_FROM ||
      (this.smtpUser ? `"Modest Studio" <${this.smtpUser}>` : '"Modest Studio" <no-reply@modest.local>');

    if (this.smtpUser && this.smtpPass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });
    }
  }

  async sendVerificationOtpEmail(email: string, otp: string): Promise<void> {
    const masked = maskEmail(email);

    if (!this.transporter) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('SMTP credentials are missing in production; cannot send verification OTP.');
        throw new ServiceUnavailableException(
          'Email verification service is temporarily unavailable. Please try again later.',
        );
      }
      this.logger.warn(`[SmtpMailService:dev] SMTP not configured; skipped sending OTP to ${masked}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.smtpFrom,
        to: email,
        subject: 'Your Modest Studio Verification Code',
        text: `Your Modest Studio email verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e6ddd8; background: #fdfbf9; color: #2b211f;">
            <h2 style="margin: 0 0 12px; color: #5c1a24; font-weight: 600;">Verify Your Email</h2>
            <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5;">
              Use the verification code below to complete your Modest Studio registration. This code is valid for <strong>10 minutes</strong>.
            </p>
            <div style="margin: 20px 0; padding: 14px; background: #ffffff; border: 1px solid #d9cbc4; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #5c1a24;">
              ${otp}
            </div>
            <p style="margin: 16px 0 0; font-size: 12px; color: #6e605d;">
              If you did not create an account on Modest Studio, please ignore this email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Sent verification OTP email to ${masked}`);
    } catch (err: any) {
      this.logger.error(`Failed to send verification OTP email to ${masked}: ${err?.message || err}`);
      throw new ServiceUnavailableException(
        'Could not send verification email right now. Please verify your email address and try again.',
      );
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const masked = maskEmail(email);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'https://modest-eta.vercel.app';
    const cleanOrigin = frontendUrl.replace(/\/+$/, '');
    const resetUrl = `${cleanOrigin}/login?resetToken=${encodeURIComponent(resetToken)}`;

    if (!this.transporter) {
      this.logger.warn(
        `[SmtpMailService] SMTP not configured; skipped password reset email for ${masked}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.smtpFrom,
      to: email,
      subject: 'Reset Your Modest Studio Password',
      text: `You requested a password reset for your Modest Studio account. Use this link within 1 hour: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e6ddd8; background: #fdfbf9; color: #2b211f;">
          <h2 style="margin: 0 0 12px; color: #5c1a24; font-weight: 600;">Reset Your Password</h2>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5;">
            We received a request to reset your Modest Studio password. Click below within <strong>1 hour</strong> to continue:
          </p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: #5c1a24; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
              Reset Password
            </a>
          </p>
          <p style="margin: 16px 0 0; font-size: 12px; color: #6e605d;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    this.logger.log(`Sent password reset email to ${masked}`);
  }
}
