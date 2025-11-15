import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'online')
    .default('development'),
  APP_PORT: Joi.number().default(3000),
  APP_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  APP_BASE_URL_DEV: Joi.string().uri(),
  APP_BASE_URL_PROD: Joi.string().uri(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // MongoDB
  MONGODB_HOST: Joi.string().default('127.0.0.1'),
  MONGODB_PORT: Joi.number().default(27017),
  MONGODB_DB: Joi.string().default('test'),
  MONGODB_USER: Joi.string().allow('').default(''),
  MONGODB_PASS: Joi.string().allow('').default(''),

  // Redis
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // OpenAI
  OPENAI_API_KEY: Joi.string().allow(''),
  OPENAI_MODEL: Joi.string().allow(''),

  // AI Service
  AI_API_BASE_URL: Joi.string()
    .uri()
    .default('https://generativelanguage.googleapis.com'),
  AI_API_KEY: Joi.string().required(),
  AI_MODEL: Joi.string().default('models/gemini-1.5-flash'),
  AI_IMAGE_MODEL: Joi.string().default('models/gemini-2.5-flash-image'),
  AI_API_TIMEOUT_MS: Joi.number().default(20000),
});
