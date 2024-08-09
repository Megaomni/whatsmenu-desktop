/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const OrdersController = () => import('#controllers/orders_controller')
const UsersController = () => import('#controllers/users_controller')
const MerchantsController = () => import('#controllers/merchants_controller')

import swagger from '#config/swagger'
import AutoSwagger from 'adonis-autoswagger'
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
router.post('/user', [UsersController, 'create'])

router
  .group(() => {
    router.get('/userCode', [AuthController, 'authUserCode'])
    router.post('/token', [AuthController, 'authToken'])

    router
      .group(() => {
        router.post('/merchants', [MerchantsController, 'merchants'])
        router.post('/merchantId', [MerchantsController, 'setMerchant'])
        router.post('/merchant', [MerchantsController, 'getMerchant'])
        router.post('/polling', [OrdersController, 'polling'])
        router.post('/ordersData', [OrdersController, 'getOrdersData'])
        router.post('/order/updateStatus', [OrdersController, 'updateStatus'])
        router.get('/order/:orderId/cancellationReasons', [OrdersController, 'cancellationReasons'])
      })
      .use(middleware.diffHour())
  })
  .prefix('ifood')
  .use(middleware.auth({ guards: ['api'] }))
