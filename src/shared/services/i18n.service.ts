import { Injectable } from '@nestjs/common';
import { notificationTranslations } from '../i18n/notifications.translations';
import { UserLanguage } from '../schemas/user.schema';

@Injectable()
export class I18nService {
  translate(
    key: string,
    language: UserLanguage,
    params?: Record<string, any>,
  ): string {
    const translations =
      notificationTranslations[language] ||
      notificationTranslations[UserLanguage.ES];
    let text = translations[key] || key;

    // Reemplazar parámetros {param}
    if (params) {
      Object.keys(params).forEach((param) => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }

    return text;
  }
}
