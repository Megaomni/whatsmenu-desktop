import factory from '@adonisjs/lucid/factories'
import Profile from '#models/profile'
import { ProfileOptions } from '#interfaces/profile'

export const ProfileFactory = factory
  .define(Profile, async ({ faker }) => {
    const name = faker.company.name()
    const slug =
      Math.floor(Math.random() * 2000000) +
      1 +
      name.split(' ').join('').toLowerCase() +
      Math.floor(Math.random() * 2000000) +
      1
    return {
      name,
      slug,
      typeStore: null,
      status: faker.datatype.boolean(),
      deliveryLocal: faker.datatype.boolean(),
      showTotal: faker.datatype.boolean(),
      description: faker.lorem.sentence(),
      whatsapp: faker.phone.number().replace(/\W/g, ''),
      typeDelivery: 'km' as Profile['typeDelivery'],
      taxDelivery: [
        {
          code: '3e9112',
          time: 'A consultar',
          value: '1',
          distance: 0,
        },
        {
          code: 'b372af',
          time: 'A consultar',
          value: '10.00',
          distance: 10,
        },
      ],
      address: {
        city: 'Santos',
        state: 'SP',
        number: '9',
        street: 'Rua Major Santos Silva',
        zipcode: '11025-100',
        complement: null,
        neigborhood: 'Embaré',
      },
      formsPayment: [
        {
          flags: [],
          label: 'Dinheiro',
          status: faker.datatype.boolean(),
          payment: 'money',
        },
        {
          flags: [],
          label: 'Crédito',
          status: faker.datatype.boolean(),
          payment: 'credit',
        },
        {
          flags: [],
          label: 'Débito',
          status: faker.datatype.boolean(),
          payment: 'debit',
        },
        {
          flags: [],
          label: 'Vale Refeição',
          status: faker.datatype.boolean(),
          payment: 'snack',
        },
        {
          flags: [],
          label: 'Vale Alimentação',
          status: faker.datatype.boolean(),
          payment: 'food',
        },
        {
          key: {
            type: 'E-mail',
            value: 'teste@teste.com',
          },
          label: 'Pix',
          status: faker.datatype.boolean(),
          payment: 'pix',
        },
        {
          key: {
            type: 'Email',
            value: '11teste@teste.com',
          },
          label: 'PicPay',
          status: faker.datatype.boolean(),
          payment: 'picpay',
        },
      ] as Profile['formsPayment'],
      week: {
        friday: [
          {
            code: '33e443',
            open: '00:00',
            close: '23:59',
          },
        ],
        monday: [
          {
            code: 'f892c3',
            open: '00:00',
            close: '23:59',
          },
        ],
        sunday: [
          {
            code: '18ea4b',
            open: '00:00',
            close: '23:59',
          },
        ],
        tuesday: [
          {
            code: 'a9dadc',
            open: '00:00',
            close: '23:59',
          },
        ],
        saturday: [
          {
            code: '470782',
            open: '00:00',
            close: '23:59',
          },
        ],
        thursday: [
          {
            code: '215135',
            open: '00:00',
            close: '23:59',
          },
        ],
        wednesday: [
          {
            code: '5dc776',
            open: '00:00',
            close: '23:59',
          },
        ],
      } as Profile['week'],
      timeZone: 'America/Sao_Paulo',
      options: {
        forceClose: null,
        inventoryControl: faker.datatype.boolean(),
        legacyPix: faker.datatype.boolean(),
        onlineCard: faker.datatype.boolean(),
        onlinePix: faker.datatype.boolean(),
        queues: {
          bartender: [],
        },
        voucher: [
          {
            status: faker.datatype.boolean(),
            created_at: 'DateTime.fromJSDate(faker.date.recent()).toISO() as any',
            expirationDays: faker.number.int({ min: 1, max: 30 }),
            percentage: faker.number.int({ min: 1, max: 100 }),
          },
        ],
        pdv: {
          clientConfig: {
            required: faker.datatype.boolean(),
            birthDate: faker.datatype.boolean(),
          },
          cashierManagement: faker.datatype.boolean(),
        },
        order: 'none',
        pizza: {
          higherValue: faker.datatype.boolean(),
          multipleBorders: faker.datatype.boolean(),
          multipleComplements: faker.datatype.boolean(),
        },
        print: {
          app: faker.datatype.boolean(),
          web: '',
          width: '219px',
          active: faker.datatype.boolean(),
          copies: faker.number.int({ min: 1, max: 5 }),
          textOnly: faker.datatype.boolean(),
          groupItems: faker.datatype.boolean(),
        },
        table: {
          persistBartender: faker.datatype.boolean(),
          callBartender: faker.datatype.boolean(),
        },
        favicon: '',
        package: {
          week: {
            friday: [
              {
                code: 'n94jHE',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 5,
              },
            ],
            monday: [
              {
                code: 'dk3YSP',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 1,
              },
            ],
            sunday: [
              {
                code: '97Yb1c',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 7,
              },
            ],
            tuesday: [
              {
                code: '4x95Uk',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 2,
              },
            ],
            saturday: [
              {
                code: '33fbcO',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 6,
              },
            ],
            thursday: [
              {
                code: 'dcwwkt',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 4,
              },
            ],
            wednesday: [
              {
                code: 'nwA8sn',
                open: '00:00',
                close: '23:59',
                active: faker.datatype.boolean(),
                weekDay: 3,
              },
            ],
          },
          active: faker.datatype.boolean(),
          label2: faker.datatype.boolean(),
          minValue: 0,
          hoursBlock: [],
          maxPackage: 100,
          distanceDays: {
            end: 21,
            start: 0,
          },
          intervalTime: 1,
          minValueLocal: 0,
          shippingLocal: {
            active: faker.datatype.boolean(),
          },
          specialsDates: [],
          maxPackageHour: 2,
          shippingDelivery: {
            active: faker.datatype.boolean(),
          },
        },
        twoSend: faker.datatype.boolean(),
        delivery: {
          enableKm: faker.datatype.boolean(),
          disableDelivery: faker.datatype.boolean(),
        },
        tracking: {
          pixel: '1',
          google: '',
        },
        hoursBlock: [],
        activeCupom: true,
        forceLogout: 1689176078736,
        grovePayKey: {
          created_on: 1692460082,
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoibWFyY2VsbG9nLmNAaG90bWFpbC5jb20iLCJ1c2VybmFtZSI6Im1hcmNlbGxvX3doYXRzbWVudSIsImlhdCI6MTY5MjQ2MDA4MiwiZXhwIjoxNjkyNTQ2NDgyfQ.eOElrZh30omPyj5Q7_OqyohSTREgy2Dx_pN8L1am3VE',
        },
        linkWhatsapp: faker.datatype.boolean(),
        placeholders: {
          pizzaObs: 'Deixe aqui qualquer observaçõe no produto.',
          clientText: 'Ol� [NOME], Tudo bem? teste',
          productObs: 'Ex.: Sem maionese, sem salada, etc...',
          statusSend: 'Obaaa, [NOME] seu pedido já está a caminho! ',
          statusToRemove: 'Obaaa, [NOME] seu pedido já está pronto para retirada!',
          statusProduction: '[NOME] seu pedido já está em produção!',
          absenceMessage: '',
          cupomFirstMessage: '',
          welcomeMessage: '',
        },
        disponibility: {
          showProductsWhenPaused: faker.datatype.boolean(),
        },
        integrations: {
          ifood: {
            created_at: faker.date.recent().toISOString(),
          },
        },
      } as ProfileOptions,
      minval: null,
      minvalLocal: null,
      request: 0,
      command: 0,
      logo: null,
      background: null,
      color: faker.color.rgb({ format: 'hex', casing: 'upper' }),
    }
  })
  .build()
