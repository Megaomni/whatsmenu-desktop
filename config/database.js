'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Default Connection
    |--------------------------------------------------------------------------
    |
    | Connection defines the default connection settings to be used while
    | interacting with SQL databases.
    |
    */
    connection: Env.get('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Sqlite
    |--------------------------------------------------------------------------
    |
    | Sqlite is a flat file database and can be good choice under development
    | environment.
    |
    | npm i --save sqlite3
    |
    */
    sqlite: {
        client: 'sqlite3',
        connection: {
            filename: Helpers.databasePath(`${Env.get('DB_DATABASE', 'development')}.sqlite`)
        },
        useNullAsDefault: true
    },

    /*
    |--------------------------------------------------------------------------
    | MySQL
    |--------------------------------------------------------------------------
    |
    | Here we define connection settings for MySQL database.
    |
    | npm i --save mysql
    |
    */
    mysql: {
        client: 'mysql',
        connection: {
            host: Env.get('DB_HOST', '127.0.0.1'),
            port: Env.get('DB_PORT', ''),
            user: Env.get('DB_USER', 'root'),
            password: Env.get('DB_PASSWORD', 'NO'),
            database: Env.get('DB_DATABASE', 'adonis')
        }
    },

    mysql_v3: {
        client: 'mysql',
        connection: {
            host: Env.get('DB_HOST_V3', 'localhost'),
            port: Env.get('DB_PORT_V3', '3306'),
            user: Env.get('DB_USER_V3', 'wmv3'),
            password: Env.get('DB_PASSWORD_V3', 'q1w2e3r4t5'),
            database: Env.get('DB_DATABASE_V3', 'whatsmenuv3')
        }
    },

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL
    |--------------------------------------------------------------------------
    |
    | Here we define connection settings for PostgreSQL database.
    |
    | npm i --save pg
    |
    */
    pg: {
        client: 'pg',
        connection: {
            host: Env.get('DB_HOST', 'localhost'),
            port: Env.get('DB_PORT', ''),
            user: Env.get('DB_USER', 'root'),
            password: Env.get('DB_PASSWORD', 'NO'),
            database: Env.get('DB_DATABASE', 'adonis')
        }
    }
}
