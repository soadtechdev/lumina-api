import { UserGenders } from '@shared/schemas/user.schema';
import * as Joi from 'joi';

const UpdateUserValidation = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  password: Joi.string(),
  avatar: Joi.string(),
  gender: Joi.string().allow(...Object.values(UserGenders)),
  birthday: Joi.date(),
  isActive: Joi.boolean(),
});

const createContactUserValidationSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string(),
  email: Joi.string().email().empty().optional(),
  phone: Joi.string(),
  avatar: Joi.string(),
});

export { UpdateUserValidation, createContactUserValidationSchema };
