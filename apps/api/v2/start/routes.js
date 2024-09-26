'use strict'

const GatewayController = require('../app/Controllers/Http/GatewayController')

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const fs = use('fs')
const Helpers = use('Helpers')

Route.get('/', async ({ response }) => response.redirect('/login'))
Route.get('/hash/:pass', async ({ response, params }) => {
  const Hash = use('Hash')
  response.json({
    password: await Hash.make(params.pass),
  })
})
Route.get('/switchLogin/:userId', 'AuthController.switchLogin').as('switchLogin')
Route.post('/recoveryPassword', 'AuthController.recoveryPassword').as('recoveryPassword')
Route.post('/user/passwordForgot', 'UserController.forgotUpdPassword').as('user.update.passwordForgot')

Route.post('/queueToRt2', 'RequestController.queueToRt2')
Route.post('/tableCommandsToRt2', 'TableController.tableCommandsToRt2')

Route.group(() => {
  Route.on('/').render('outer.login').as('login')
  Route.post('/', 'AuthController.login').as('postLogin')
  Route.get('/forgot', 'AuthController.forgot')
})
  .prefix('login')
  .middleware(['guest'])

Route.group(() => {
  Route.get('/', 'AuthController.getRegister').as('getRegister')
  Route.post('/', 'AuthController.postRegister').validator('registerUser').as('postRegister')
})
  .prefix('register')
  .middleware(['guest'])

Route.group(() => {
  Route.get('/', 'DashboardController.index').as('dashboard')
  Route.get('/inventory', 'DashboardController.checkLowInventory')
  Route.get('/logout', 'AuthController.logout').as('logout')
  Route.get('socialmedia', async ({ auth, response, view }) => {
    try {
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const images = fs.readdirSync(Helpers.publicPath('img/socialmedia'))
      // console.log(images)

      response.send(
        view.render('inner.socialmedia.index', {
          profile: profile.toJSON(),
          images: images,
          imagePath: '/img/socialmedia/',
          downloadPath: '/img/download/socialmedia/',
        })
      )
    } catch (error) {
      console.error(error)
    }
  }).as('socialmedia')

  Route.get('/profile/option/insert', 'ProfileController.insertOption').as('profile.option.insert')

  Route.get('/profile', 'ProfileController.index').as('profileIndex').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/myprofile', 'ProfileController.myProfile').as('myProfile')
  Route.get('/profile/token', 'ProfileController.getToken').as('profile.token')
  Route.get('/profile/register', 'ProfileController.getRegister').as('profileRegister')
  Route.post('/profile/step1', 'ProfileController.storeStep1').as('profileStoreStep1') // .validator('profile/step1')
  Route.post('/profile/taxDelivery', 'ProfileController.addTaxDelivery').as('profile.taxdelivery.add')
  Route.put('/profile/taxDelivery/alter', 'ProfileController.updateTaxType').as('profile.taxdelivery.type.update')
  Route.post('/profile/address', 'ProfileController.addAddress').as('profile.address.add')
  Route.patch('/profile/address', 'ProfileController.updAddress').as('profile.address.update')
  Route.delete('/profile/taxDelivery/:code/delete', 'ProfileController.deleteTaxDelivery').as('profile.taxdelivery.delete')
  Route.post('/profile/forceClose', 'ProfileController.setForceCloseDate')
  Route.patch('/profile/step1', 'ProfileController.updateStep1').as('profileUpdateStep1').middleware(['financialPassword']) //.validator('profile/step1')
  Route.get('/profile/week', 'ProfileController.getWeek').as('profile.week.get') //.validator('profile/step1')
  Route.post('/profile/week', 'ProfileController.saveWeek')
  // Route.post('/profile/week', 'ProfileController.addHour').as('profile.week.add') //.validator('profile/step1')
  // Route.patch('/profile/week', 'ProfileController.updHour').as('profile.week.update') //.validator('profile/step1')
  Route.patch('/profile/fuso', 'ProfileController.updateFuso').as('profile.update.fuso') //.validator('profile/step1')
  Route.delete('/profile/week/:day/remove/:code', 'ProfileController.removeHour').as('profile.week.rm') //.validator('profile/step1')
  /* Route.patch('/profile/formpayment/pix', 'ProfileController.updatePix').as('profile.update.pix') //.validator('profile/step1')
  Route.patch('/profile/formpayment/picpay', 'ProfileController.updatePicPay').as('profile.update.picpay') //.validator('profile/step1')
  Route.patch('/profile/formpayment/playpause', 'ProfileController.playPausePayment').as('profile.update.payment.playpause') //.validator('profile/step1') */
  Route.get('/profile/formpayment/add', 'ProfileController.addFormPayment').as('profile.add.payment') //.validator('profile/step1')
  Route.patch('/profile/formpayment/:paymentMethod/update', 'ProfileController.updatePaymentMethod')
    .as('profile.update.card')
    .middleware(['financialPassword']) //.validator('profile/step1')
  Route.get('/profile/fixTaxValue', 'ProfileController.fixTaxValue').as('profile.fixTaxValue') //.validator('profile/step1')
  Route.get('/profile/taxdeliveries', 'ProfileController.getTaxDelivery').as('profile.get.taxDeliveries') //.validator('profile/step1')
  Route.get('/profile/allactives', 'ProfileController.getAllProfiles').as('profile.get.allProfiles') //.validator('profile/step1')
  /* Route.post('/profile/formpayment/:payment/flag', 'ProfileController.addFlagPayment').as('profile.add.payment.flag') //.validator('profile/step1')
  Route.delete('/profile/formpayment/:payment/flag/:code/delete', 'ProfileController.deleteFlagPayment').as('profile.delete.payment.flag') //.validator('profile/step1') */
  Route.put('/profile/tax/neighborhood/update', 'ProfileController.updateNeighborhood').as('profile.tax.neighborhood.update')
  Route.put('/profile/tax/km/update', 'ProfileController.updateTaxKM').as('profile.tax.KM.update')
  Route.post('/profile/auth/securityKey', 'AuthController.authSecurityKey').middleware(['security_key'])
  Route.post('/profile/addNewPixNegotiationAsaas', 'ProfileController.addNewPixNegotiationAsaas')

  Route.get('/menu', 'MenuController.index').as('menuIndex').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/api/menu', 'MenuController.menu').as('dashboard.api.menu')

  Route.post('/menu/category/register', 'CategoryController.store').validator('category/register').as('categoryRegister')
  Route.patch('/menu/category/:id/update', 'CategoryController.update').as('categoryUpdate')
  Route.patch('/menu/category/reorder', 'CategoryController.reorder').as('category.reorder')
  Route.delete('/menu/category/:id/delete', 'CategoryController.delete').as('category.delete')
  Route.post('/menu/category/:id/playpause', 'CategoryController.playAndPause').as('categoryPlayPause')
  Route.post('/menu/category/:id/duplicate', 'CategoryController.duplicate').as('duplicateCategory')
  Route.post('/menu/categoryPizza/:id/duplicate', 'CategoryController.duplicatePizza').as('category.duplicate.pizza')

  Route.post('/menu/product/register', 'ProductController.store').as('storeProduct')
  Route.post('/menu/product/register/massive', 'ProductController.storeMassive').as('storeMassive')
  Route.patch('/menu/product/:id/update', 'ProductController.update').validator('product/register').as('updateProduct')
  Route.patch('/menu/product/updateMassive', 'ProductController.updateMassive').validator('product/register').as('updateProducts')
  Route.delete('/menu/product/:id/delete', 'ProductController.delete').as('product.delete')
  Route.patch('/menu/product/default/:id/playpause', 'ProductController.productDefaultPlayPause').as('productDefaultPlayPause')
  Route.post('/menu/product/default/:id/duplicate', 'ProductController.duplicate').as('productDuplicate')
  Route.patch('/menu/product/reorder', 'ProductController.reorder').as('product.reorder')
  Route.delete('/menu/product/default/:product/complement/:complement', 'ProductController.removeComplement').as('product.removeComplement')
  Route.patch('/menu/complement/playpause', 'ComplementController.playPause').as('complement.playPause')
  Route.patch('/menu/complement/itens/reorder', 'ComplementController.itemReorder').as('complement.itens.reorder')
  Route.patch('/menu/complement/reorder', 'ComplementController.reorder').as('complement.reorder')

  Route.post('/menu/product/pizza/:id/addsize', 'PizzaController.addSize').as('pizza.addSize')
  Route.patch('/menu/product/pizza/:id/updsize/:code', 'PizzaController.updSize').as('pizza.updSize')
  Route.delete('/menu/product/pizza/:id/size/:code/delete', 'PizzaController.deleteSize').as('pizza.size.delete')
  Route.post('/menu/product/pizza/:id/addimplementation', 'PizzaController.addImplementation').as('pizza.addImplementation')
  Route.patch('/menu/product/pizza/:id/updimplementation/:code', 'PizzaController.updImplementation').as('pizza.updImplementation')
  Route.delete('/menu/product/pizza/:id/implementation/:code/delete', 'PizzaController.deleteImplementation').as('pizza.implementation.delete')
  Route.post('/menu/product/pizza/:id/addflavor', 'PizzaController.addFlavor').as('pizza.addFlavor')
  Route.patch('/menu/product/pizza/:id/updamount/', 'PizzaController.updAmount').as('pizza.updAmount')
  Route.patch('/menu/product/pizza/:id/updflavor/:code', 'PizzaController.updFlavor').as('pizza.updFlavor')
  Route.patch('/menu/product/pizza/updFlavorMassive', 'PizzaController.updFlavorMassive').as('pizza.updFlavorMassive')
  Route.patch('/menu/product/pizza/:pizzaId/updComplements', 'PizzaController.updateComplements')
  Route.patch('/menu/product/pizza/flavor/reorder', 'PizzaController.flavorReorder').as('pizza.flavor.reorder')
  Route.patch('/menu/product/pizza/size/reorder', 'PizzaController.sizeReorder').as('pizza.size.reorder')
  Route.patch('/menu/product/pizza/implementation/reorder', 'PizzaController.implementationReorder').as('pizza.implementation.reorder')
  Route.patch('/menu/product/pizza/:id/updcover/:code', 'PizzaController.changeCovers').as('pizza.changeCover')
  Route.patch('/menu/product/pizza/:id/size/:code', 'PizzaController.sizePlayPause').as('pizza.size.playpause')
  Route.patch('/menu/product/pizza/:id/implementation/:code', 'PizzaController.implementationPlayPause').as('pizza.implementation.playpause')
  Route.patch('/menu/product/pizza/:id/flavor/:code', 'PizzaController.flavorPlayPause').as('pizza.flavor.playpause')
  Route.get('/menu/product/pizza/json/update', 'PizzaController.updateJSON').as('pizza.json.update')
  Route.delete('/menu/product/pizza/:id/flavor/:code/delete', 'PizzaController.deleteFlavor').as('pizza.flavor.delete')
  Route.patch('/menu/product/pizza/reorder', 'PizzaController.flavorsReorder').as('pizza.order')
  // REQUESTS
  Route.get('/request', 'RequestController.index').as('request.index').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/request/:id', 'RequestController.request')
  Route.get('/requests', 'RequestController.myRequests').as('request.myRequests')
  Route.get('/requests/package', 'RequestController.requestsPackage').as('request.requestsPackage')
  Route.post('/request/wsVerification', 'RequestController.myRequestsWs')
  Route.post('/request/:id/print/app', 'RequestController.sendPrintFromADM').as('request.sendPrintFromADM')
  Route.patch('/request/:requestId/print/confirm', 'RequestController.confirmRequestPrint').as('request.confirmRequestPrint')
  Route.patch('/request/status/update', 'RequestController.update').as('request.update.status')
  Route.post('/request/status/send', 'RequestController.sendMessage').as('request.sendMessage')

  // REQUESTS
  Route.get('/carts', 'CartController.carts').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/carts/page/:page', 'CartController.cartsPaginate').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/carts/package', 'CartController.cartsPackage').as('cartPackage.update.print')
  Route.patch('/carts/:cartId/status', 'CartController.status').as('cart.update.status')
  Route.patch('/carts/:cartId/print', 'CartController.confirmCartPrint').as('cart.update.print')
  Route.patch('/carts/:id/package/date', 'CartController.updatePackageDate')
  // Route.get('/request/:id', 'RequestController.request')
  // Route.get('/requests', 'RequestController.myRequests').as('request.myRequests')
  // Route.get('/requests/package', 'RequestController.requestsPackage').as('request.requestsPackage')
  // Route.post('/request/wsVerification', 'RequestController.myRequestsWs')
  // Route.post('/request/:id/print/app', 'RequestController.sendPrintFromADM').as('request.sendPrintFromADM')
  // Route.patch('/request/:requestId/print/confirm', 'RequestController.confirmRequestPrint').as('request.confirmRequestPrint')
  // Route.patch('/request/status/update', 'RequestController.update').as('request.update.status')
  // Route.post('/request/status/send', 'RequestController.sendMessage').as('request.sendMessage')

  // SETTINGS
  Route.get('/settings', 'SettingsController.index').as('settings.index').middleware(['basic_plan', 'table_plan', 'schedule_plan'])
  Route.get('/settings/package', 'SettingsController.package').as('settings.package').middleware(['schedule_plan', 'table_plan', 'basic_plan'])
  Route.patch('/settings/step1', 'SettingsController.updateStep1').as('settingsUpdateStep1').validator('profile/step1')
  Route.patch('/settings/textConfigUpdate', 'SettingsController.textConfigUpdate').as('settingsTextConfigUpdate')
  Route.patch('/settings/general', 'SettingsController.generalBasicSettings').as('settingsBasicConfigUpdate')
  Route.patch('/settings/printConfigUpdate', 'SettingsController.printConfigUpdate').as('settingsPrintConfigUpdate')
  Route.patch('/settings/pizzaConfigUpdate', 'SettingsController.pizzaConfigUpdate').as('settingsPizzaConfigUpdate')
  Route.patch('/settings/disponibilityConfigUpdate', 'SettingsController.disponibilityConfigUpdate').as('settingsDisponibilityConfigUpdate')
  Route.patch('/settings/whatsConfigUpdate', 'SettingsController.whatsConfigUpdate').as('settingsWhatsConfigUpdate')
  Route.patch('/settings/facebookConfigUpdate', 'SettingsController.facebookConfigUpdate').as('settingsFacebookConfigUpdate')
  Route.patch('/settings/googleConfigUpdate', 'SettingsController.googleConfigUpdate').as('settingsgoogleConfigUpdate')
  Route.patch('/settings/tableConfigUpdate', 'SettingsController.tableConfigUpdate').as('settingstableConfigUpdate')

  // SUBMENU
  Route.get('/settings/domains', 'DomainController.index').as('domains.index')
  Route.get('/settings/table', 'TableController.settings').as('table.settings').middleware(['basic_plan', 'table_plan'])

  // DOMAINS
  Route.get('/domains', 'DomainController.getDomains')
  Route.get('/domain', 'DomainController.getDefaultDomain')
  Route.post('/domains', 'DomainController.storeDomain')
  Route.post('/domains/dnsRecords', 'DomainController.getDnsRecords')
  Route.post('/domains/storeDnsConfig', 'DomainController.storeDnsConfig')
  Route.patch('/domains/updateDomain', 'DomainController.updateDomain')
  Route.delete('/domains/deleteDomain', 'DomainController.deleteDomain')
  Route.delete('/domains/deleteDns', 'DomainController.deleteDnsConfig')

  // ACCOUNT
  Route.patch('/account', 'AccountController.saveSecurityKey')
  Route.patch('/account/updateSecurityKey', 'AccountController.updateSecurityKey')
  Route.patch('/account/forceChangePassword', 'AccountController.forceChangePassword')
  Route.patch('/account/resetSecurityKey', 'AccountController.resetSecurityKey').middleware(['adm'])
  Route.post('/account/recoverySecurityPassword', 'AccountController.recoverySecurityPassword')
  Route.get('/account/recovery', 'AccountController.recovery')

  // TABLE
  Route.post('/table/create', 'TableController.create')
  Route.patch('/table/update', 'TableController.update').middleware(['tableAction:status'])
  Route.patch('/table/delete', 'TableController.delete').middleware(['tableAction:status'])
  Route.patch('/table/status/:id', 'TableController.changeStatus')
  Route.get('/tables', 'TableController.getTables')
  Route.get('/beforeCloseTable/:tableId', 'TableController.beforeCloseTable')
  Route.get('/getTable/:tableId', 'TableController.getTable')
  Route.get('/tableByCommand/:commandId', 'TableController.getTableByCommand')
  // Route.get('/table/:tableId', 'TableController.getTableById')
  // Route.get('/tablesReports', 'TableController.reports').as('table.reports')
  Route.patch('/table/closeAllTableCommands', 'TableController.closeAllTableCommands')

  // COMMANDS
  // Route.get('/commands/:tableId', 'TableController.getCommands')
  // Route.get('/commandRequests/:commandId', 'CommandController.getCommandRequests')
  Route.get('/command/:commandId', 'CommandController.getCommand')
  Route.patch('/command/updateFees', 'CommandController.updateFees')
  Route.patch('/command/updateTableFees', 'CommandController.updateTableFees')
  // Route.patch('/command/updateAllPercentTableFees', 'CommandController.updateAllPercentTableFees')
  Route.patch('/commandChangeStatus/:commandId', 'CommandController.changeStatus')
  Route.patch('/command/changeTable', 'CommandController.changeTable')
  Route.patch('/command/updateFormPayment', 'CommandController.updateFormPayment')

  // CATEGORIES
  Route.post('/category/week', 'CategoryController.addHour').as('category.week.add')
  Route.patch('/category/week', 'CategoryController.updHour').as('category.week.update')
  Route.delete('/category/week/:day/remove/:code/:categoryId', 'CategoryController.removeHour').as('category.week.rm')

  // PRODUCTS
  Route.post('/product/week', 'ProductController.addHour').as('product.week.add')
  Route.patch('/product/week', 'ProductController.updHour').as('product.week.update')
  Route.delete('/product/week/:day/remove/:code/:productId', 'ProductController.removeHour').as('product.week.rm')

  // USER_PLANS
  Route.patch('/userPlans', 'UserPlanController.update')
  Route.delete('/userPlans', 'UserPlanController.delete')
  Route.get('/userPlans', 'UserPlanController.getUserPlans')

  // FLEX_PLANS
  Route.get('/flexPlans', 'FlexPlanController.getFlexPlans').as('flex.plans')

  // CLIENTS
  Route.get('/clients', 'AdmClientController.index').as('clients.index')

  // INVOICES
  Route.get('invoices/list', 'InvoiceController.index').as('invoices.index')
  Route.get('invoices/pending', 'InvoiceController.getLastInvoice').as('invoices.getLastInvoice')
  Route.get('invoices/incorret', 'InvoiceController.incorrect').as('invoices.incorrect')
  Route.get('invoices/systoinvoices', 'InvoiceController.systemRequestsToInvoices')
  Route.get('invoices/updateStatusInvoices', 'InvoiceController.updateStatusInvoices')
  Route.post('invoices/generate/upgrade', 'InvoiceController.generateUpgrade').as('invoice.generate.upgrade')
  Route.post('invoices/addon/emmit', 'InvoiceController.generateAddonInvoice').as('invoice.generate.addon')
  Route.get('invoices/getInvoiceById/:invoiceId', 'InvoiceController.getInvoiceById')

  // USER
  Route.get('user/password', 'UserController.index').as('user.index')
  Route.get('user/getUser', 'UserController.getUser').as('getUser')
  Route.get('user/getUserPlans/:userId', 'UserController.getUserPlans').as('getUserPlans')
  Route.get('user/getUserPaymentInfo', 'UserController.getUserPaymentInfo')
  Route.patch('user/password', 'UserController.updPassword').as('user.update.password')
  Route.patch('user/first-access', 'UserController.setFirstAccess').as('user.set.firstAccess')
  Route.get('user/getTotalUsersBetaNext', 'UserController.getTotalUsersBetaNext').as('user.set.getTotalUsersBetaNext')
  Route.patch('user/updateControls', 'UserController.updateControls').as('user.set.updateControls')

  // CUPONS
  Route.get('/cupons', 'CupomController.index').as('cupom.index')
  Route.post('/cupons', 'CupomController.store').as('cupom.store')
  Route.patch('/cupom/:id', 'CupomController.playPause').as('cupom.playPause')
  Route.put('/cupom/feature', 'CupomController.activeDeactive').as('cupom.activeDeactive')
  Route.delete('/cupom/:id', 'CupomController.delete').as('cupom.delete')

  // FEES
  Route.get('/fees', 'FeeController.getFees').as('fee.getFees')
  Route.post('/fee', 'FeeController.store').as('fee.store')
  Route.post('/fee/delete', 'FeeController.delete').as('fee.delete')
  Route.patch('/fee/update', 'FeeController.update').as('fee.update')

  // BARTENDERS

  Route.get('/bartenders', 'BartenderController.list').as('bartender.list')
  Route.post('/bartender/create', 'BartenderController.create').as('bartender.create').middleware(['financialPassword'])
  Route.patch('/bartender/update', 'BartenderController.update').as('bartender.update').middleware(['financialPassword'])
  Route.delete('/bartender/delete', 'BartenderController.delete').as('bartender.delete').middleware(['financialPassword'])

  // MODALS PARTIALS
  Route.on('/modals/partial/addComplement').render('inner.modals.partials.addcategorycomplement').as('view.addComplement')
  Route.on('/modals/partial/addComplementItem').render('inner.modals.partials.addComplementitem').as('view.addComplementItem')

  // MOTOBOY
  Route.get('/motoboys', 'MotoboyController.index')
  Route.post('/motoboys', 'MotoboyController.store')
  Route.get('/motoboys/:id', 'MotoboyController.show')
  Route.patch('/motoboys/:id', 'MotoboyController.update')
  Route.delete('/motoboys/:id', 'MotoboyController.destroy')
  Route.patch('/cart/singMotoboy', 'CartController.signMotoboy')

  // ASAAS

  Route.post('/asaas/asaasCreateSubAccount', 'GatewayController.asaasCreateSubAccount')
  Route.put('/asaas/asaasUpdateSubAccount', 'GatewayController.asaasUpdateSubAccount')
  Route.get('/asaas/asaasListAccounts', 'GatewayController.asaasListAccounts')
  Route.put('/asaas/updateAdvanceCardPayment', 'GatewayController.updateAdvanceCardPayment')
})
  .prefix('dashboard')
  .middleware(['auth'])

// REPORTS
Route.group(() => {
  Route.any('/daily/:page', 'ReportController.daily').as('report.daily')
  Route.any('/monthly/:page', 'ReportController.monthly').as('report.monthly')
  Route.any('/resume', 'ReportController.resume').as('report.resume')
  Route.any('/finance', 'ReportController.report').as('report.index')
  Route.any('/cashier', 'ReportController.cashiers')
  Route.any('/motoboys/:page', 'MotoboyController.report')
  Route.any('/motoboys/report/resume', 'MotoboyController.resume')
  Route.any('/client/carts/:page', 'ReportController.clientCarts')
  Route.any('/clients/search', 'ReportController.findClients')
  Route.any('/client/top10', 'ReportController.top10')
  Route.any('/client/:page', 'ReportController.clients')
  Route.any('/bestSellers/:page', 'CartController.bestSellers')
})

  .prefix('/dashboard/report')
  .middleware(['auth', 'security_key']) //, 'security_key', 'basic_plan', 'table_plan', 'schedule_plan'

Route.any('/bestSellers/:page', 'CartController.bestSellers').prefix('/dashboard/report').middleware(['auth', 'security_key']) //, 'security_key', 'basic_plan', 'table_plan', 'schedule_plan'

// ADMINISTRATOR
Route.group(() => {
  Route.get('release-block', 'Administrator/AdministratorController.releaseBlock').as('adm.releaseBlock')
  Route.get('seller/list', 'Administrator/SellerController.listSellers').as('adm.seller.listSellers')
  Route.get('report/registers', 'Administrator/ReportController.registerIndex').as('adm.report.registerIndex')
  Route.get('report/financial', 'Administrator/ReportController.financialIndex').as('adm.report.financialIndex')
  Route.get('report/support', 'Administrator/ReportController.getSupportPage').as('adm.report.support')
  Route.get('report/support/unrequests', 'Administrator/ReportController.reportWeekWithOuRequest').as('adm.report.support.unrequests')
  Route.post('release-block', 'Administrator/AdministratorController.postReleaseBlock').as('adm.releaseBlock.post')
  Route.get('user', 'Administrator/AdministratorController.userIndex').as('adm.user.index')
  Route.get('plans', 'Administrator/AdministratorController.getFlexPlans')
  Route.get('users/:page', 'Administrator/AdministratorController.getUsers').as('adm.list.users')
  Route.post('user', 'Administrator/AdministratorController.getUser').as('adm.getUser.post')
  Route.post('user', 'Administrator/AdministratorController.getUserSupport').as('adm.getUserSupport.post')
  Route.post('user/support/add', 'Administrator/AdministratorController.setUserSupport').as('adm.user.add.support')
  Route.patch('user', 'Administrator/AdministratorController.updateUser').as('adm.updateUser.post')
  Route.get('support/users', 'Administrator/AdministratorController.pageSupportUsers').as('adm.support.users')
  Route.patch('profile', 'Administrator/AdministratorController.updateProfile').as('adm.updateProfile.post')
  Route.post('asaas', 'Administrator/AdministratorController.unlinkAsaas')
  Route.get('report/users/card', 'Administrator/AdministratorController.pageClientsCard').as('adm.clients.card')
  Route.post('/stripe/plans', 'Administrator/AdministratorController.planProductCreate')
  Route.patch('/stripe/plans', 'Administrator/AdministratorController.planProductUpdate')
  Route.delete('/stripe/plans/:id', 'Administrator/AdministratorController.planProductDelete')
  Route.post('/system/products', 'Administrator/AdministratorController.productCreate')
  Route.patch('/system/products', 'Administrator/AdministratorController.productUpdate')
  Route.patch('/system/products/:id', 'Administrator/AdministratorController.productToggleStatus')
  Route.patch('/system/products/:id/:priceId', 'Administrator/AdministratorController.productTogglePriceStatus')
  Route.get('/registers/:year/:month', 'Administrator/AdministratorController.getListRegisters')
  Route.patch('/registers/:year/:month/update/:id', 'Administrator/AdministratorController.updateLead')
  Route.post('/deleteAddresses', 'Administrator/AdministratorController.deleteAddresses')
  // Route.po
})
  .prefix('adm')
  .middleware(['auth', 'adm', 'basic_plan'])

Route.group(() => {
  Route.get('financial/report', 'Administrator/ReportController.financial').as('administrator.api.report.financial')
  Route.get('financialpaginate/report/:month', 'Administrator/ReportController.financialPaginate').as('administrator.api.report.financialpaginate')
  Route.get('financial/seller/:id', 'Administrator/ReportController.sellerDaily').as('administrator.api.report.seller')
  Route.get('financial/seller-monthly', 'Administrator/ReportController.sellerMonthly').as('administrator.api.report.sellerByMonth')
  Route.get('report/support', 'Administrator/ReportController.getSupport').as('adm.api.report.support')
  Route.get('report/support/users/:page', 'Administrator/AdministratorController.getUsersBySupport').as('adm.api.report.support.users')
  Route.get('users/card', 'Administrator/AdministratorController.getClientsCard').as('adm.api.users.card')
  Route.put('payment/paghiper/manualy-paid', 'PaymentController.paidManual').as('adm.api.paghiper.paid.manual')
  Route.post('user/deleteUserAlreadyMigrated', 'UserController.deleteUserAlreadyMigrated')
}).prefix('administrator-api') // .middleware(['auth:jwt'])

Route.resource('api/v2/calc/distance', 'ApiController').apiOnly()

Route.group(() => {
  Route.post('business/:slug/profile/joinqueue/bartender', 'ApiController.joinQueue')
  Route.delete('business/:slug/:tableId/profile/leavequeue/bartender', 'ApiController.leaveQueue')
  Route.get('business/:slug/profile', 'ApiController.getClient')
  Route.get('business/:slug/profile/:type', 'ApiController.getClient')
  Route.get('business/:slug/cupom', 'ApiController.getCupom')
  Route.get('business/:slug/request', 'ApiController.getRequest')
  Route.post('business/request', 'RequestController.store').as('api.request.store')
  Route.post('business/command', 'CommandController.create').as('api.commnad.store')
  // Route.get('business/commands/:tableId', 'CommandController.getCommands')
  Route.get('business/command/:commandId', 'CommandController.getCommand')
  Route.get('business/commandRequests/:commandId', 'CommandController.getCommandRequests')
  Route.get('business/getTables/:profileId', 'TableController.getTables').middleware(['tableApi'])
  Route.get('business/getBartenders/:profileId', 'BartenderController.list')
  Route.post('business/auth/bartender', 'BartenderController.auth')
  Route.patch('business/request/update', 'RequestController.updateApi')
  Route.get('business/:slug/getADMDate', 'ApiController.getADMDate')
  Route.post('business/checkProductDisponibility', 'ApiController.checkProductDisponibility')
  Route.get('fusos', 'ApiController.getFusos').as('api.fusos')

  Route.get('/request/print/:id', 'RequestController.print').as('request.print') // .middleware(['auth:api'])
  Route.post('/auth/app/print', 'AuthController.authApp').as('api.v2.auth.app') // .middleware(['auth'])
  Route.post('/app/user', 'UserController.setUserIdOneSignal').as('api.v2.user.app') // .middleware(['auth:twrp'])
  Route.get('/auth/user/next/:id', 'UserController.getUserInfo')
  Route.get('/auth/app/print', 'AuthController.getUserToken').as('api.v2.auth..token')

  // TABLES
  Route.get('business/getTable/:tableId', 'TableController.getTable')
  Route.patch('/business/table/status/:id/status', 'TableController.changeStatus')
  Route.patch('/business/:slug/closeTable/:openedId', 'TableController.closeTable')

  // COMMANDS
  Route.patch('/business/command/changeTable', 'CommandController.changeTable')
  Route.patch('/business/:slug/closeCommand/:commandId', 'CommandController.closeCommand')
  Route.patch('/business/closeCommand/:commandId', 'CommandController.updateFormPayment')

  // CLIENTS
  Route.post('/business/:slug/client', 'ClientController.create').middleware(['profileCheckExists', 'clientCheck'])
  Route.patch('/business/:slug/client/:clientId/update', 'ClientController.update').middleware(['profileCheckExists'])
  Route.get('/business/:slug/clients', 'ClientController.list').middleware(['profileCheckExists'])
  Route.get('/business/:slug/client/:clientId', 'ClientController.findOne').middleware(['profileCheckExists'])
  Route.post('/business/client/savePushSubscription', 'ClientController.savePushSubscription')

  // ADDRESSES
  Route.post('/business/:slug/:clientId/address', 'ClientAddressController.create').middleware(['profileCheckExists', 'clientCheck'])
  Route.patch('/business/:slug/:clientId/address/:addressId', 'ClientAddressController.update').middleware([
    'profileCheckExists',
    'clientCheck',
    'addressCheck',
  ])
  Route.delete('/business/:slug/:clientId/address/:addressId', 'ClientAddressController.delete').middleware([
    'profileCheckExists',
    'clientCheck',
    'addressCheck',
  ])

  // CARTS
  Route.post('/business/:slug/cart', 'CartController.store').middleware(['clientCheck'])
  Route.patch('/business/:slug/cart/updateCartFormsPayment', 'CartController.updateCartFormsPayment')
  Route.get('/business/:slug/:clientId/carts', 'CartController.list').middleware(['profileCheckExists', 'clientCheck'])
  Route.get('business/:slug/getCart/:code', 'CartController.getCart').middleware('profileCheckExists')
  Route.patch('/business/:slug/cart/:cartId/remove/:itemId', 'CartItenController.delete').middleware(['profileCheckExists'])
  Route.patch('/business/:slug/cart/:cartId/edit/:itemId', 'CartItenController.edit').middleware(['profileCheckExists'])
  Route.patch('/business/:slug/cart/:cartId/status', 'CartController.status')
  Route.patch('/business/:slug/cart/:cartId/updateCartControls', 'CartController.updateCartControls')

  // CASHIERS
  Route.get('/business/:slug/cashiers/', 'CashierController.list').middleware(['profileCheckExists'])
  Route.post('/business/:slug/cashier/:bartenderId/open', 'CashierController.store').middleware(['profileCheckExists', 'cashierOperatorCheck'])
  Route.patch('/business/:slug/cashier/:bartenderId/close', 'CashierController.close').middleware([
    'profileCheckExists',
    'cashierOperatorCheck',
    'cashierOpenedCheck',
  ])
  Route.patch('/business/:slug/cashier/:bartenderId/addTransaction', 'CashierController.addTransaction').middleware([
    'profileCheckExists',
    'cashierOperatorCheck',
    'cashierOpenedCheck',
  ])

  Route.post('/cashier/closedValues', 'CashierController.closedValuesSystemReport')

  Route.get('/systemProducts', 'SystemProductController.index')
  Route.post('/request/status/send', 'RequestController.sendMessage').as('request.sendMessage')

  Route.get('/checkProfileExistsBySlug/:slug', 'ApiController.checkProfileExistsBySlug')
  Route.get('/number-site', 'ApiController.queueSiteNumber').as('ApiGetNumber')

  Route.post('/bot/whatsapp', 'ProfileController.botConfig')

  Route.get('/identifyLowInventory/:profileId', 'ProductController.identifyLowInventory')
}).prefix('api/v2')

Route.group(() => {
  Route.get('generate', 'PaymentController.generateRequest').as('payment.paghiper.generate')
  Route.post('generate-for-users', 'PaymentController.generateRequestForUsers').as('payment.paghiper.generateRequestForUsers')
  Route.get('upddue', 'PaymentController.updateDue').as('payment.paghiper.updateDue')
  Route.post('/', 'PaymentController.returnPaghiper').as('payment.paghiper.returnPaghiper')
  Route.get('/', 'PaymentController.returnPaghiper').as('payment.paghiper.returnPaghiper')
  Route.get('list/errors', 'PaymentController.getErrors').as('invoices.errors')
  Route.get('profiles', 'ProfileController.deleteProfiles').as('profiles.deletes')
  Route.get('invoices-errors', 'InvoiceController.getErrosBlockeds').as('getErrosBlockeds')
  Route.get('todayp', 'PaymentController.todayPayments').as('todayPayments')
  Route.get('fixdatepayment', 'PaymentController.fixDatePayment').as('payment.fixDatePayment')
  Route.get('cancellist', 'PaymentController.cancelInvlicesFromList').as('paghiper.payment.cancelInvlicesFromList')
}).prefix('paghiper')

Route.group(() => {
  Route.post('/events', 'GatewayController.stripeEvents')
  Route.post('/createCheckout', 'GatewayController.stripeCreateCheckout')
  Route.post('/cardToken', 'GatewayController.stripeCreateCardToken')
  Route.post('/createCard', 'GatewayController.stripeCreateCard')
  Route.post('/createSubscription', 'GatewayController.stripeCreateSubscriptions')
  Route.patch('/changeSubscriptionCard', 'GatewayController.stripeUpdateSubscriptionCard')
  Route.delete('/cards/:cardId', 'GatewayController.stripeDeleteCard')

  // Route.post('payment/lastInvoiceFailed', 'PaymentController.stripeLastInvoicePaymentFailed');
}).prefix('stripe')

Route.group(() => {
  Route.post('/events', 'GatewayController.pagarmeEvents')
  Route.post('/createCustomer', 'GatewayController.pagarmeCreateCustomer')
  Route.post('/createCard', 'GatewayController.pagarmeCreateCard')
  Route.post('/createCheckoutOrPurcharseCard', 'GatewayController.pagarmeCreateCheckoutOrPurchaseCard')
  Route.post('/subscriptions/items', 'GatewayController.pagarmeAddSubscriptionItem')
  Route.post('/subscriptions', 'GatewayController.pagarmeCreateSubscriptions')
  Route.patch('/changeChargeCard', 'GatewayController.pagarmeUpdateChargeCard')
  Route.patch('/changeSubscriptionCard', 'GatewayController.pagarmeUpdateSubscriptionCard')
  Route.delete('/cards/:cardId', 'GatewayController.pagarmeDeleteCard')
}).prefix('pagarme')

Route.group(() => {
  Route.post('/events', 'GatewayController.asaasEvents')
}).prefix('asaas')

Route.group(() => {
  Route.patch('/pix/update', 'ProfileController.setPixOnline')
  Route.patch('/pix/formPayment', 'ProfileController.setFormPayment')
}).prefix('dashboard/profile')

Route.group(() => {
  Route.patch('/card/update', 'ProfileController.setCardOnline')
  Route.patch('/card/formPayment', 'ProfileController.setFormPayment')
}).prefix('dashboard/profile')

Route.group(() => {
  Route.post('/login', 'GatewayController.grovepayLogin')
  Route.post('/recipient/', 'GatewayController.grovepayCreateRecipient').middleware(['auth', 'financialPassword'])
  Route.get('/order/:orderId', 'CartController.retrieveOrder')
  Route.post('/verifyPix/pdv', 'GatewayController.asaasVerifyPixPaymentPDV')
  Route.post('/deletePix/pdv', 'GatewayController.asaasDeletePixPaymentPDV')
  Route.post('/order/pix/:slug/', 'GatewayController.asaasCreatePixOrder')
  Route.post('/order/card/:slug/', 'GatewayController.asaasCreateCardOrder')
  Route.post('/card/token/:clientId/', 'GatewayController.asaasCreateToken')
  Route.delete('/card/token/:slug/', 'GatewayController.asaasDeleteClientCardToken')
  Route.post('/customer/:slug', 'GatewayController.asaasCreateCustomer')
}).prefix('api/v2/business/asaas')

Route.group(() => {
  Route.get('/request/queue/print', 'RequestController.printQueue').as('request.printQueue')
  Route.get('firstdelete', 'CronController.deleteByNotPaidFirst').as('cron.deleteByNotPaidFirst')

  Route.get('blockprofile', 'CronController.blockProfile').as('cron.blockProfile')
  Route.get('updateAllDisponibilityCategrories', 'CronController.updateAllDisponibilityCategrories')
  Route.get('updateOptionsProfile', 'CronController.updateOptionsProfile')
  Route.get('fixemail', 'UserController.fixEmail').as('user.fixemail')
  Route.get('addflexplan', 'UserController.setUserFlexPlan').as('user.setUserFlexPlan')
  Route.get('updateAllFlavors', 'PizzaController.updateAllFlavors').as('pizza.flavors')
  Route.get('fifoSupport', 'QueueController.fifoSupport').as('cron.fifoSupport')
  Route.post('migrate/basic', 'CronController.dataSystemMigrate')
  Route.post('migrate/users', 'CronController.migrateDataUser')
  Route.get('/users/insecuries', 'AuthController.getInsecurityPassword')
  Route.patch('/users/defaultPasswords', 'CronController.defaultPasswords')
  Route.post('/updateOptionsPdv', 'CronController.updateOptionsPdv')
  // Route.post('/', 'PaymentController.returnPaghiper').as('payment.paghiper.returnPaghiper')
  Route.get('/deletePendingOnlinePendingRequest', 'CronController.deletePendingOnlinePendingRequest')
  Route.get('/cancelPendingRequests', 'CronController.cancelPendingRequests')
  Route.get('/checkcartspayments', 'CronController.checkCartPayment')
}).prefix('cron')

Route.group(() => {
  Route.get('/myprofile', 'ProfileController.myProfile2').as('myProfile')
})
  .prefix('teste')
  .middleware(['auth:jwt'])

Route.post('/getToken', 'AuthController.getTokenToV3')
Route.post('/validateSecurityKey', 'AuthController.validateSecurityKey')
