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
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const) || 'production',
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  DB_HOST: Env.schema.string(),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string(),
  DB_DATABASE: Env.schema.string(),

  // DB_HOST2: Env.schema.string(),
  // DB_PORT2: Env.schema.number(),
  // DB_USER2: Env.schema.string(),
  // DB_PASSWORD2: Env.schema.string(),
  // DB_DATABASE2: Env.schema.string(),

  ASAAS_MIN_VALUE: Env.schema.number(),

  BALANCE_READ_CONNECTIONS: Env.schema.string(),
  V2_ENDPOINT: Env.schema.string(),
  // GROVE_NFE_URL: Env.schema.string(),
  // DB_HOST_POOLING: Env.schema.string(),
})
