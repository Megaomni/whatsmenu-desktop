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
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const ProfilesController = () => import('#controllers/profiles_controller')
const VouchersController = () => import('#controllers/vouchers_controller')

import swagger from '#config/swagger'
import AutoSwagger from 'adonis-autoswagger'
const ReportsController = () => import('#controllers/reports_controller')
const CronsController = () => import('#controllers/crons_controller')
const IfoodIntegrationsController = () => import('#controllers/ifood_integrations_controller')
const ClientsController = () => import('#controllers/clients_controller')
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

    // IFOOD
    router
      .group(() => {
        router.get('/userCode', [IfoodIntegrationsController, 'authUserCode'])
        router.post('/token', [IfoodIntegrationsController, 'authToken'])
        router.get('/merchants', [IfoodIntegrationsController, 'merchants'])
        router.post('/merchantId', [IfoodIntegrationsController, 'merchantId'])
        router.get('/ordersData', [IfoodIntegrationsController, 'getOrdersData'])
        router.get('/order/:orderId/cancellationReasons', [
          IfoodIntegrationsController,
          'cancellationReasons',
        ])
        router.post('/order/:orderId/updateStatus', [IfoodIntegrationsController, 'updateStatus'])
      })
      .prefix('ifood')
    router
      .group(() => {
        router.any('/client/top10', [ReportsController, 'top10'])
      })
      .prefix('reports')
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
        router.post('/ifood/polling', [IfoodIntegrationsController, 'polling'])
        router.get('/ifood/merchant', [IfoodIntegrationsController, 'getMerchant'])
      })
      .prefix('desktop')
  })
  .prefix('api/v3')

router
  .group(() => {
    router.get('/cancelExpiredVouchers', [CronsController, 'cancelExpiredVouchers'])
  })
  .prefix('cron')
