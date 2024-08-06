import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import sinon from 'sinon'

const generalSettingsPayload = {
  options: {
    bot: {
      whatsapp: {
        welcomeMessage: {
          status: true,
          alwaysSend: false,
        },
      },
    },
    pdv: {
      clientConfig: {
        required: false,
        birthDate: true,
      },
      sendWhatsMessage: true,
      cashierManagement: true,
    },
    order: 'none',
    pizza: {
      higherValue: true,
      multipleBorders: true,
      multipleComplements: true,
    },
    print: {
      app: false,
      web: '',
      width: '302px',
      active: true,
      copies: 1,
      fontSize: 6,
      textOnly: false,
      groupItems: false,
    },
    store: {
      catalogMode: {
        table: false,
        delivery: false,
      },
      productModal: {
        infoPosition: 'last',
      },
    },
    table: {
      callBartender: true,
      persistBartender: true,
    },
    queues: {
      bartender: [],
    },
    favicon:
      'https://s3.us-west-2.amazonaws.com/whatsmenu/production/dboamexico/dboamexicohQOJq1zuaxxzMpKjpeg',
    package: {
      week: {
        friday: [
          {
            code: 'ZsvCOU',
            open: '10:15',
            close: '19:20',
            active: true,
            weekDay: 5,
          },
        ],
        monday: [
          {
            code: '9k6vcl',
            open: '10:15',
            close: '19:20',
            active: true,
            weekDay: 1,
          },
        ],
        sunday: [],
        tuesday: [
          {
            code: '4cgIOY',
            open: '18:15',
            close: '19:20',
            active: true,
            weekDay: 2,
          },
        ],
        saturday: [
          {
            code: 'jEqQs2',
            open: '10:15',
            close: '19:20',
            active: true,
            weekDay: 6,
          },
        ],
        thursday: [
          {
            code: 'fBpp1X',
            open: '10:15',
            close: '19:20',
            active: true,
            weekDay: 4,
          },
        ],
        wednesday: [
          {
            code: 'oZjIIP',
            open: '10:15',
            close: '19:20',
            active: true,
            weekDay: 3,
          },
        ],
      },
      active: true,
      label2: true,
      minValue: 5,
      hoursBlock: [],
      maxPackage: 1000,
      cashierDate: 'deliveryDate',
      distanceDays: {
        end: 90,
        start: 0,
      },
      intervalTime: 5,
      minValueLocal: 5,
      shippingLocal: {
        active: true,
      },
      specialsDates: [],
      maxPackageHour: 1,
      shippingDelivery: {
        active: false,
      },
    },
    twoSend: false,
    voucher: [
      {
        status: true,
        created_at: '2024-06-05T11:56:54.273-03:00',
        percentage: 10,
        expirationDays: 20,
      },
    ],
    delivery: {
      enableKm: true,
      disableDelivery: false,
    },
    minValue: 5,
    tracking: {
      pixel: '1',
      google: '',
    },
    legacyPix: false,
    onlinePix: true,
    forceClose: null,
    hoursBlock: [],
    onlineCard: true,
    activeCupom: true,
    forceLogout: 1689176078736,
    grovePayKey: {
      created_on: 1692460082,
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoibWFyY2VsbG9nLmNAaG90bWFpbC5jb20iLCJ1c2VybmFtZSI6Im1hcmNlbGxvX3doYXRzbWVudSIsImlhdCI6MTY5MjQ2MDA4MiwiZXhwIjoxNjkyNTQ2NDgyfQ.eOElrZh30omPyj5Q7_OqyohSTREgy2Dx_pN8L1am3VE',
    },
    linkWhatsapp: true,
    placeholders: {
      pizzaObs: 'Deixe aqui qualquer observa��o no produto. ? ',
      clientText: 'Ol� [NOME], Tudo bem? teste � ? ? ? ⏳ ⌚ ⏰ ? ? ? ? �asda',
      productObs: 'Ex.: Sem maionese, sem salada, etc... ?',
      statusSend: 'Obaaa, [NOME] seu pedido j� est� a caminho! ? &',
      statusToRemove:
        'Obaaa, [NOME] seu pedido j� est� pronto para retirada! ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? : ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? &',
      welcomeMessage:
        'Olá [NOME]!\n Seja bem vindo ao Dboa México?\n Veja o nosso cardápio para fazer seu pedido?\n \n https://www.whatsmenu.com.br/dboamexico\n \n ?? *Ofertas exclusivas para pedidos no link* ?? ?\n \n Equipe Dboa México\n',
      sendWhatsMessage:
        '[NOME] pedido efetuado com sucesso, acompanhe o status do seu pedido abaixo!',
      statusProduction: '[NOME] seu pedido j� est� em produ��o! &',
      cupomFirstMessage:
        'Olá *[NOME]!*\nSeja bem vindo ao Dboa México \n\nÉ sua primeira vez aqui, separei um cupom especial para você \n\n\nhttps://www.whatsmenu.com.br/dboamexico?firstOnlyCupom=BOASVINDAS\n\n 👆🏻 Cupom: *BOASVINDAS* 👆🏻 \n\nClique no link para fazer o pedido com o cupom',
    },
    disponibility: {
      showProductsWhenPaused: false,
    },
    minValueLocal: 5,
    whatsappOficial: false,
    hideSecretNumber: false,
    inventoryControl: true,
  },
  deliveryLocal: 0,
}

test.group('Profile', (group) => {
  let user: User | null

  test('Deve devolver um erro caso algo inesperado aconteca ao buscar um perfil', async ({
    client,
  }) => {
    const modelStub = sinon.stub(User.prototype, 'load').throws()
    let result
    try {
      user = await UserFactory.with('profile', 1).create()
      result = await client.get(`/dashboard/profile/`).loginAs(user!)
    } catch (error) {
      result?.assertStatus(500)
    } finally {
      modelStub.restore()
    }
  })

  test('Deve ser capaz de buscar um perfil', async ({ client }) => {
    try {
      user = await UserFactory.with('profile', 1).create()
      const result = await client.get(`/dashboard/profile/`).loginAs(user!)
      result.assertStatus(200)
    } catch (error) {
      throw error
    }
  })

  test('Ao buscar um perfil se o usuário não tiver a propriedade security_key deve adicinoar not_security_key a perfil', async ({
    assert,
    client,
  }) => {
    try {
      user = await UserFactory.with('profile', 1).merge({ security_key: null }).create()
      const result = await client.get(`/dashboard/profile/`).loginAs(user!)
      assert.property(result.body(), 'not_security_key')

      result.assertStatus(200)
    } catch (error) {
      throw error
    }
  })

  test('Ao buscar um perfil verificar se existe datas especiais para encomendas que ja passaram e limpar do array', async ({
    assert,
    client,
  }) => {
    const specialsDates = [DateTime.local().toISO(), DateTime.local().plus({ days: 1 }).toISO()]
    try {
      user = await UserFactory.with('profile', 1).create()
      await user.load('profile')
      user.profile.merge({
        options: {
          ...user.profile.options,
          package: {
            ...user.profile.options.package,
            specialsDates,
          },
        },
      })
      await user.profile.save()
      const result = await client.get(`/dashboard/profile/`).loginAs(user!)
      assert.lengthOf(result.body().options.package.specialsDates, 1)

      result.assertStatus(200)
    } catch (error) {
      throw error
    }
  })

  test('Deve devolver um erro caso algo inesperado aconteca ao alterar configurações de um perfil', async ({
    client,
  }) => {
    const modelStub = sinon.stub(User.prototype, 'load').throws()
    let result
    try {
      user = await UserFactory.with('profile', 1).create()
      result = await client
        .patch(`/dashboard/settings/general`)
        .loginAs(user!)
        .json(generalSettingsPayload)
    } catch (error) {
      result?.assertStatus(500)
    } finally {
      modelStub.restore()
    }
  })

  test('Deve ser possível alterar configurações de um perfil ', async ({ client, assert }) => {
    try {
      user = await UserFactory.with('profile', 1).create()
      const result = await client
        .patch(`/dashboard/settings/general`)
        .loginAs(user!)
        .json(generalSettingsPayload)
      result.assertStatus(200)
    } catch (error) {
      throw error
    }
  })
})
