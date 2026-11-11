import { BadRequestException, Logger } from '@nestjs/common';
import { promises as dns } from 'dns';

const logger = new Logger('EmailValidation');

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'burnermail.io',
  'discard.email',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamailblock.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'sharklasers.com',
  'spamgourmet.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempr.email',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
]);

export function isDisposableEmailDomain(email: string): boolean {
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) return false;
  const domain = email.slice(atIdx + 1).trim().toLowerCase();
  if (!domain) return false;

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;

  // Catch subdomains of known disposable providers (e.g. sub.mailinator.com)
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return true;
    }
  }
  return false;
}

/**
 * Rejects disposable email providers and non-existent mail domains (via MX lookup).
 * Transient DNS resolver timeouts fail open so legitimate signups proceed to OTP verification.
 */
export async function assertDeliverableEmail(email: string): Promise<void> {
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) {
    throw new BadRequestException('Please provide a valid email address');
  }

  const domain = email.slice(atIdx + 1).trim().toLowerCase();
  if (!domain || !domain.includes('.')) {
    throw new BadRequestException('Please provide a valid email address');
  }

  if (isDisposableEmailDomain(email)) {
    throw new BadRequestException(
      'Disposable or temporary email addresses are not allowed. Please use a valid email address.',
    );
  }

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('DNS timeout'), { code: 'ETIMEOUT' })), 2500),
      ),
    ]);

    if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
      throw new BadRequestException(
        'This email domain cannot receive mail. Please double-check your email address.',
      );
    }
  } catch (err: any) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    const code = err?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ENOTIMP') {
      throw new BadRequestException(
        'This email domain does not exist or cannot receive mail. Please double-check your email address.',
      );
    }
    // Transient DNS error/timeout: log and let email OTP verification enforce ownership
    logger.warn(`MX lookup skipped for ${domain} (${code || err?.message || 'unknown error'})`);
  }
}

