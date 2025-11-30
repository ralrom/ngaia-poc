/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum.optional(['development', 'production', 'test'] as const),
  PORT: Env.schema.number.optional(),
  APP_KEY: Env.schema.string.optional(),
  HOST: Env.schema.string.optional({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Session
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum.optional(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | AWS Cognito Configuration
  |----------------------------------------------------------
  */
  COGNITO_CLIENT_ID: Env.schema.string(),
  COGNITO_CLIENT_SECRET: Env.schema.string(),
  COGNITO_ISSUER: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum.optional(['s3', 'minio'] as const),

  /*
  |----------------------------------------------------------
  | AWS / S3 Configuration
  |----------------------------------------------------------
  */
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  KMS_KEY_ID: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | MinIO Configuration (S3-compatible)
  |----------------------------------------------------------
  */
  S3_ENDPOINT: Env.schema.string.optional(),
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | AWS SQS Configuration
  |----------------------------------------------------------
  */
  SQS_QUEUE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Service Account Authentication
  |----------------------------------------------------------
  */
  AWS_SERVICE_ACCOUNT_KEY: Env.schema.string.optional(),
})
