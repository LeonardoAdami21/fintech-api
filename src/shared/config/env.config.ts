// src/shared/config/env.config.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  KAFKA_BROKERS: Joi.string().default('localhost:9092'),

  ALLOWED_ORIGINS: Joi.string().default('*'),

  // Session / token TTLs (optional overrides)
  ACCESS_TOKEN_TTL_SECONDS: Joi.number().default(900), // 15 min
  REFRESH_TOKEN_TTL_DAYS: Joi.number().default(7),

  // Fraud thresholds (optional overrides — useful for feature-flagging)
  FRAUD_BLOCK_THRESHOLD: Joi.number().min(0).max(100).default(75),
  FRAUD_REVIEW_THRESHOLD: Joi.number().min(0).max(100).default(50),
});

export interface EnvConfig {
  NODE_ENV: string;
  APP_PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  KAFKA_BROKERS: string;
  ALLOWED_ORIGINS: string;
  ACCESS_TOKEN_TTL_SECONDS: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  FRAUD_BLOCK_THRESHOLD: number;
  FRAUD_REVIEW_THRESHOLD: number;
}
