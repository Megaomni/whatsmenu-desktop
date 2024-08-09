import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION', 'sqlite'),
  connections: {
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST', '0.0.0.0'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER', 'wagnerdev'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_DATABASE', 'adonis'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
