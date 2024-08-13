'use strict'

/** @type {import('@adonisjs/framework/src/Server')} */
const Server = use('Server')

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
|
| Global middleware are executed on each http request only when the routes
| match.
|
*/
const globalMiddleware = [
  'Adonis/Middleware/BodyParser',
  'App/Middleware/ConvertEmptyStringsToNull'
]

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
|
| Named middleware is key/value object to conditionally add middleware on
| specific routes or group of routes.
|
| // define
| {
|   auth: 'Adonis/Middleware/Auth'
| }
|
| // use
| Route.get().middleware('auth')
|
*/
const namedMiddleware = {
  adonisAuth: 'Adonis/Middleware/Auth',
  auth: 'App/Middleware/Auth',
  guest: 'App/Middleware/Guest',
  adm: 'App/Middleware/Adm',
  security_key: 'App/Middleware/SecurityKey',
  basic_plan: 'App/Middleware/BasicPlan',
  table_plan: 'App/Middleware/TablePlan',
  schedule_plan: 'App/Middleware/SchedulePlan',
  tableAction: 'App/Middleware/TableAction',
  tableApi: 'App/Middleware/TableApi',
  profileCheckExists: 'App/Middleware/ProfileCheckExist',
  cashierOperatorCheck: 'App/Middleware/CashierOperatorCheck',
  cashierOpenedCheck: 'App/Middleware/CashierOpenedCheck',
  clientCheck: 'App/Middleware/ClientCheck',
  addressCheck: 'App/Middleware/AddressCheck',
  financialPassword: 'App/Middleware/FinancialPassword'
}

/*
|--------------------------------------------------------------------------
| Server Middleware
|--------------------------------------------------------------------------
|
| Server level middleware are executed even when route for a given URL is
| not registered. Features like `static assets` and `cors` needs better
| control over request lifecycle.
|
*/
const serverMiddleware = [
  'Adonis/Middleware/Static',
  'Adonis/Middleware/Cors'
]

Server
  .registerGlobal(globalMiddleware)
  .registerNamed(namedMiddleware)
  .use(serverMiddleware)
