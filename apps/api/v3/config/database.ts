import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const BALANCE_READ_CONNECTIONS = JSON.parse(env.get('BALANCE_READ_CONNECTIONS')) as string[]

const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION', 'mysql'),
  prettyPrintDebugQueries: true,
  connections: {
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
        debug: true,
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/v2_migrations', 'database/migrations'],
      },
    },
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST', '0.0.0.0'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER', 'root'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_DATABASE', 'adonis'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      replicas: {
        read: {
          connection: BALANCE_READ_CONNECTIONS.filter(Boolean).map((host) => ({
            host,
          })),
        },
        write: {
          connection: {
            host: `${env.get('DB_HOST', '0.0.0.0')}`,
          },
        },
      },
      // debug: env.get('DB_DEBUG', false),
    },
    mysql2: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST2', '0.0.0.0'),
        port: env.get('DB_PORT2'),
        user: env.get('DB_USER2', 'root'),
        password: env.get('DB_PASSWORD2', ''),
        database: env.get('DB_DATABASE2', 'adonis'),
      },
      // debug: env.get('DB_DEBUG', false),
    },
    mysql_pooling: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST_POOLING') || env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER', 'root'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_DATABASE', 'adonis'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      replicas: {
        read: {
          connection: BALANCE_READ_CONNECTIONS.filter(Boolean).map((host) => ({
            host,
          })),
        },
        write: {
          connection: {
            host: `${env.get('DB_HOST', '0.0.0.0')}`,
          },
        },
      },
      // debug: env.get('DB_DEBUG', false),
    },
  },
})

export default dbConfig
