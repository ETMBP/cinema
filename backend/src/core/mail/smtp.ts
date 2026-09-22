// Email handler to deliver mails to users
import nodemailer, { type Transporter } from 'nodemailer';
import type { IMailOptions } from '../config.js';
import type { IMailTemplate } from './templates.js';
import type { Logger } from 'pino';

export class SmtpMailer {
  readonly #transport: Transporter;
  readonly #options: IMailOptions;
  readonly #logger: Logger;

  constructor(options: IMailOptions, logger: Logger) {
    this.#options = options;
    this.#transport = this.#newSmtpTransport(this.#options);
    this.#logger = logger;
  }

  #newSmtpTransport(options: IMailOptions): Transporter {
    return nodemailer.createTransport({
      auth: {
        user: options.username,
        pass: options.password,
      },
      host: options.host,
      port: options.port,
      secure: false,
      requireTLS: true,
    });
  }

  async verify(): Promise<void> {
    try {
      await this.#transport.verify();
    } catch (error) {
      throw new Error('SMTP test failed', { cause: error });
    }
  }

  // Sending mail never throws, so it doesn't break registration and other callers
  async sendMail(template: IMailTemplate, to: string): Promise<void> {
    try {
      await this.#transport.sendMail({
        ...template,
        from: {
          name: this.#options.fromName,
          address: this.#options.fromAddress,
        },
        to: to,
      });
      this.#logger.info({ to: to }, 'Email was sent');
    } catch (error) {
      this.#logger.error(error);
    }
  }
}
