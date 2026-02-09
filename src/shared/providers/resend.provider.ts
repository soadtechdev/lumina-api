import * as fs from 'fs';
import * as path from 'path';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
// CONSTANTS
import constants from 'src/contants';

export enum emailType {
  REGISTER_SUCCESS = 'register_success',
  CODE_VERIFICATION = 'code_verification',
  ADDED_FRIEND = 'added_friend',
}
interface Params {
  [key: string]: string;
}

@Injectable()
export default class ResendProvider {
  private readonly resend = new Resend(constants.RESEND_API_KEY);

  constructor() {}

  async sendTemplateEmail(payload: {
    email: string;
    type: emailType;
    param: Params;
    subject: string;
  }) {
    try {
      const templates = {
        register_success: path.join(__dirname, '..', 'templates', 'register_success.html'),
        code_verification: path.join(__dirname, '..', 'templates', 'code_verification.html'),
        added_friend: path.join(__dirname, '..', 'templates', 'added_friend.html'),
      };
      const html = this.insertParamsIntoHTML(templates[payload?.type], payload?.param);

      const response = await this.resend.emails.send({
        from: 'Splittier <admin@splittier.com>',
        to: [payload.email],
        subject: payload?.subject,
        html,
        headers: {
          'X-Entity-Ref-ID': '1234567891',
        },
      });

      console.log(response);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Envía un email con HTML raw (sin template file)
   * Usado para emails generados dinámicamente como resúmenes semanales
   */
  async sendRawEmail(payload: {
    email: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      const response = await this.resend.emails.send({
        from: 'Splittier <admin@splittier.com>',
        to: [payload.email],
        subject: payload.subject,
        html: payload.html,
        headers: {
          'X-Entity-Ref-ID': Date.now().toString(),
        },
      });

      console.log('Email sent:', response);
    } catch (e) {
      console.error('Error sending raw email:', e);
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  private insertParamsIntoHTML(htmlFilePath: string, params: Params): string {
    let html: string = fs.readFileSync(htmlFilePath, 'utf8');

    // Reemplazar los parámetros en el HTML
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');

      html = html.replace(regex, value);
    }

    return html;
  }
}
