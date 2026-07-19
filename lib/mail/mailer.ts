import 'server-only';

import { isProduction } from '@/lib/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Transport contract for outbound email.
 *
 * Stage 1 ships a console transport so the reset-password flow is fully
 * exercisable with no third-party account. Swapping in Resend/SES/Postmark is a
 * new class here plus one line in the factory below.
 */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Development transport: prints the message instead of sending it. */
class ConsoleMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.info(
      [
        '',
        '─────────── ✉️  outgoing email (console transport) ───────────',
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        '',
        message.text,
        '──────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );
  }
}

/**
 * No-op transport used if the app is ever deployed without a configured
 * provider — silently dropping mail is safer than printing reset links into
 * production logs.
 */
class NoopMailer implements Mailer {
  async send(): Promise<void> {
    console.warn('[mailer] No email provider configured; message dropped.');
  }
}

export const mailer: Mailer = isProduction ? new NoopMailer() : new ConsoleMailer();
