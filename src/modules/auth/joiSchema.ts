import * as Joi from 'joi';

const registerUserValidationSchema = Joi.object({
  email: Joi.string().email(),
});

const validateOtpValidationSchema = Joi.object({
  email: Joi.string().email(),
  otpCode: Joi.string().max(4),
});

const regenerateOtpValidationSchema = Joi.object({
  email: Joi.string().email(),
});

const createPasswordUserValidationSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string(),
});

const loginValidationSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string(),
});

const recoveryPasswordRequestValidationSchema = Joi.object({
  email: Joi.string().email(),
});

const changePasswordValidationSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string(),
  otpCode: Joi.string().required(),
});

const loginGoogleValidationSchema = Joi.object({
  idToken: Joi.string().required(),
});

export {
  registerUserValidationSchema,
  validateOtpValidationSchema,
  regenerateOtpValidationSchema,
  createPasswordUserValidationSchema,
  loginValidationSchema,
  recoveryPasswordRequestValidationSchema,
  changePasswordValidationSchema,
  loginGoogleValidationSchema,
};
