import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ObjectSchema } from 'joi';

// TYPES
type TransformValues = string | number | boolean;

/**
 * Custom pipe for Joi validate schemas
 */
@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(
    private schema: ObjectSchema,
    private parseObjs?: string[],
  ) {}

  transform(value: TransformValues, meta: { type: string }) {
    if (meta.type !== 'body') return value;

    // PARSE SPECIFIC KEYS
    this.parseDynamicObjs(value);

    // VALIDATE JOI SCHEMA
    const { error } = this.schema.validate(value);

    if (error) {
      throw new BadRequestException(error);
    }

    return value;
  }

  /**
   * PARSE DYNAMIC SPECIFIC OBJ KEYS (APPLY FOR FORM DATA BODIES)
   */
  private parseDynamicObjs(value: TransformValues) {
    this.parseObjs?.forEach((key) => {
      try {
        value[key] = JSON.parse(value[key]);
      } catch (error) {
        return;
      }
    });
  }
}
