/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller')
const CuponsController = () => import('#controllers/cupons_controller')
const ProfilesController = () => import('#controllers/profiles_controller')
const VouchersController = () => import('#controllers/vouchers_controller')
const ReportsController = () => import('#controllers/reports_controller')
const CronsController = () => import('#controllers/crons_controller')
const ClientsController = () => import('#controllers/clients_controller')
const CartsController = () => import('#controllers/carts_controller')

import { middleware } from './kernel.js'
import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
const GroveNfesController = () => import('#controllers/grove_nfes_controller')

// returns swagger in YAML
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Renders Swagger-UI and passes YAML-output of /swagger
router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
  // return AutoSwagger.default.scalar("/swagger", swagger); to use Scalar instead
  // return AutoSwagger.default.rapidoc("/swagger", swagger); to use RapiDoc instead
})

router
  .group(() => {
    router.post('/', [AuthController, 'login'])
    router.get('/switch/:userId', [AuthController, 'switchLogin'])
    router.post('/app', [AuthController, 'loginApp'])
  })
  .prefix('login')
  .use(middleware.getOldToken())

router
  .group(() => {
    router.post('/user/password', [AuthController, 'recoverPassword'])
  })
  .prefix('recovery')

router
  .group(() => {
    // USER
    router
      .group(() => {
        router.patch('/alterPassword', [AuthController, 'userAlterPassword'])
        router
          .patch('/alterSecurityKey', [AuthController, 'userAlterSecurityKey'])
          .use(middleware.validateSecurityKey())
      })
      .prefix('user')

    // PROFILE
    router
      .group(() => {
        router.get('/', [ProfilesController, 'userProfile'])
      })
      .prefix('profile')

    // CUPOM
    router
      .group(() => {
        router.get('/', [CuponsController, 'index'])
        router.post('/', [CuponsController, 'store'])
        router.patch('/:id', [CuponsController, 'playPause'])
        router.put('/feature', [CuponsController, 'activeDeactive'])
        router.delete('/:id', [CuponsController, 'delete'])
      })
      .prefix('cupons')

    // VOUCHER
    router
      .group(() => {
        router.patch('/config', [VouchersController, 'config'])
        router.patch('/toggle-cashback', [VouchersController, 'toggleCashback'])
      })
      .prefix('vouchers')

    router
      .group(() => {
        router.any('/client/top10', [ReportsController, 'top10'])
      })
      .prefix('reports')

    router
      .group(() => {
        router.patch('general', [ProfilesController, 'generalBasicSettings'])
      })
      .prefix('settings')
  })
  .prefix('dashboard')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
// API
router
  .group(() => {
    // LOJA
    router
      .group(() => {
        router.get('/cupom', [CuponsController, 'getCupom'])
        router.get('/findClient', [ClientsController, 'findClient'])
        router.get('/findClient/:clientId', [ClientsController, 'findClient'])
        router.get('/clients', [ClientsController, 'list'])
        router.get('/cart/:cartId/getStatus', [CartsController, 'statusCart'])
      })
      .prefix('business/:slug')
    // CLIENT
    router
      .group(() => {
        router.patch('/:clientId/updateVouchers', [ClientsController, 'updateVouchers'])
      })
      .prefix('clients')
    // VOUCHER
    router
      .group(() => {
        router.post('/create', [VouchersController, 'create'])
        router.patch('/update/:id', [VouchersController, 'update'])
      })
      .prefix('vouchers')

    // DESKTOP
    router
      .group(() => {
        router.get('/findClient', [ClientsController, 'findClient'])
      })
      .prefix('desktop')
  })
  .prefix('api/v3')

router
  .group(() => {
    router.get('/cancelExpiredVouchers', [CronsController, 'cancelExpiredVouchers'])
    router.get('/closeCashiers', [CronsController, 'closeCashiers'])
  })
  .prefix('cron')

router
  .group(() => {
    router.post('/webhook', [GroveNfesController, 'webhook'])
  })
  .prefix('grovenfe')
