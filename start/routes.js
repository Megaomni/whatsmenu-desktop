'use strict'

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

const siteInfo = {
    title: 'WhatsMenu',
    name: 'WhatsMenu',
    description: '',
    logo: 'logo.png',
    styleName: 'style.css',
    whatsmenu: '5513996260670',
    showNetwork: true,
    showVideo: true,
}

// Route.on('/').render('fullindex', {
//   title: 'WhatsMenu',
//   description: '',
//   whatsmenu: '5513996260670'
// })
Route.on("/wmd").render("wmd")
Route.any('/webhook', 'PageController.webhook').as('webhook')
Route.get('/portal', 'PageController.portalHome').as('portalHome')
Route.get('/portal/:city', 'PageController.portal').as('portal')
Route.get('/portal/:estate/cities', 'PageController.getListCities').as('getListCities')
Route.get('/portal/:city/listagem/', 'PageController.listagem').as('listagem')
Route.get('/portal/:city/listagem/:page', 'PageController.listagem').as('portal.listagem.paginate')
Route.get('/portal/:city/cupom', 'PageController.cupom').as('cupom')
Route.post('/printLayout', 'PageController.printLayout')
Route.post('/printLayoutPDF', 'PageController.printLayoutPDF')
Route.post('/lead', 'PageController.teste')
Route.post('/decryptTableCookie', 'ApiController.decryptTableCookie')
Route.get('/', 'PageController.index').as('index') // .middleware(['connection'])
Route.post('/contact', 'PageController.numberRouter').as('numbers.router')
Route.get('/pix', 'PageController.pix').as('pix')
Route.post('/pix', 'PageController.pixTansaction').as('pix.transaction')
Route.post('/pix/status', 'PageController.pixStatus').as('pix.status')
Route.post('/double_opt-in', 'PageController.numberRouter').as('double_opt-in')
Route.get('/registers/:year/:month', 'PageController.getRegisters').as('getRegisters')
Route.get('/list/:year/:month', 'PageController.getListRegisters').as('getListRegisters')
Route.get('/agilize-seu-whatsapp', 'PageController.index').as('index2')
Route.get('/solucao-completa', 'PageController.index').as('index3')
Route.get('/impressoras', 'PageController.impressoras').as('impressoras')
Route.get('/encomenda', 'PageController.encomenda').as('encomenda')
Route.get('/hoteis-pousadas', 'PageController.hotel').as('hotel')
Route.get('/encomenda-frame', 'PageController.encomendaframe').as('encomendaframe')
Route.get('/live', 'PageController.live').as('live')
Route.get('/live2', 'PageController.live2').as('live2')
Route.get('/land2', 'PageController.land2').as('land2')
Route.get('/landif1', 'PageController.landif1').as('landif1')
Route.get('/landif2', 'PageController.landif2').as('landif2')
Route.get('/mesa', 'PageController.mesa').as('mesa')
Route.get('/novaindex', 'PageController.novaindex').as('novaindex')
Route.get('/mesa-frame', 'PageController.mesaframe').as('mesaframe')
Route.get('/ebook', 'PageController.ebook').as('ebook')
Route.get('/mesa/:id/:slug', 'PageController.table').as('client.table').middleware(['connection'])
Route.post('/decryptTableCookie', 'ApiController.decryptTableCookie')
Route.get('/clientes', 'PageController.index')
Route.get('/reuniao/:year/:month/:day/:hour/:minute', 'PageController.reuniao')
Route.on('/termo').render('termo', siteInfo)
    // Route.on('/double_opt-in').render('obrigado', siteInfo)
Route.get('/.well-know/assetlinks.json', ({ response }) => {
    response.json(
        [{
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": "br.com.whatsmenu.printer",
                "sha256_cert_fingerprints": ["72:E0:8E:D5:6B:1C:F9:CB:C1:D5:39:E2:7D:60:DC:19:75:E9:AB:6E:03:F8:19:74:5C:8C:9E:37:A2:87:E8:8E"]
            }
        }]
    )
});

Route.group(() => {
    Route.get('/', 'PageController.indexAulas').as('videoaulas.index')
    Route.get('/:type/aula/:id', 'PageController.aula').as('videoaulas.aula')
}).prefix('videoaulas')

Route.group(() => {
    Route.get('profiles', 'ApiController.profilesActived').as('api.profiles')
}).prefix('api')

Route.on('teste').render('teste', {
    title: 'WhatsMenu',
    name: 'WhatsMenu',
    description: '',
    logo: 'logo.png',
    styleName: 'style.css',
    // whatsmenu: '5513996260670',
    whatsmenu: '5511919196875',
    // whatsmenu: '5511937036875',
    showNetwork: true,
    showVideo: true,
}).as('test')
Route.get('/:slug', 'PageController.client').as('client.profile').middleware(['connection'])
Route.get('/:slug/mesas', 'PageController.client').as('client.profileTable').middleware(['connection'])
Route.get('/:slug/pdv', 'PageController.client').as('client.profilePdv').middleware(['connection'])
Route.get('/:slug/status/:cartCode', 'PageController.client').as('client.statusLink').middleware(['connection'])
Route.get('/:slug/:planOffer/:categoryId', 'PageController.client').as('client.categoryLink').middleware(['connection'])
Route.get('/:slug/:planOffer/:categoryId/:productId', 'PageController.client').as('client.productLink').middleware(['connection'])
