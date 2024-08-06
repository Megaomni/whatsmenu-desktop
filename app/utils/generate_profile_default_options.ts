import Profile from '#models/profile'
import { ProfileOptions } from '#types/profile'
import { DateTime } from 'luxon'
import { generateWeekDisponibility } from './generate_disponibility_week.js'

export const generateProfileDefaultOptions = (profile: Profile): ProfileOptions => {
  return {
    queues: {
      bartender: [],
    },
    pdv: {
      cashierManagement: false,
      clientConfig: {
        birthDate: false,
        required: false,
      },
    },
    tracking: { pixel: '', google: '' },
    activeCupom: true,
    pizza: { higherValue: true, multipleBorders: false, multipleComplements: false },
    delivery: { enableKm: false, disableDelivery: false },
    table: {
      persistBartender: true,
      callBartender: true,
    },
    order: 'none',
    print: {
      textOnly: true,
      width: '219px',
      copies: 1,
      active: true,
      groupItems: true,
      app: false,
      web: '',
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
    package: {
      active: false,
      shippingLocal: { active: false },
      shippingDelivery: { active: false },
      week: generateWeekDisponibility(),
      distanceDays: {
        start: 0,
        end: 7,
      },
      intervalTime: 30,
      specialsDates: [],
      maxPackage: 30,
      maxPackageHour: 1,
      minValue: 0.0,
      minValueLocal: 0.0,
      hoursBlock: [],
      label2: false,
    },
    placeholders: {
      pizzaObs: 'Deixe aqui qualquer observação no produto.',
      productObs: 'Ex.: Sem maionese, sem salada, etc...',
      statusSend: 'Obaaa, [NOME] seu pedido já está a caminho!',
      statusToRemove: 'Obaaa, [NOME] seu pedido já está pronto para retirada!',
      statusProduction: '[NOME] seu pedido já está em produção!',
      clientText: 'Olá [NOME], Tudo bem?',
      welcomeMessage: `Olá *[NOME]!*\n\nSeja bem vindo ao ${profile.name}\n\nVeja o nosso cardápio para fazer seu pedido\n\nhttps://www.whatsmenu.com.br/${profile.slug}\n\n*Ofertas exclusivas para pedidos no link* \n\nEquipe ${profile.name}`,
      absenceMessage: `Olá [Nome], estamos fechados no momento.\n\nOs horários de funcionamento e o cardápio completo você pode consultar em https://whatsmenu.com.br/${profile.slug}\n\nAté mais`,
      cupomFirstMessage: `Olá *[NOME]!*\n\nSeja bem vindo ao ${profile.name}\n\nÉ sua primeira vez aqui, separei um cupom especial para você`,
    },
    disponibility: { showProductsWhenPaused: false },
    legacyPix: false,
    forceClose: null,
    favicon: '',
    inventoryControl: false,
    linkWhatsapp: false,
    onlineCard: false,
    onlinePix: false,
    voucher: [
      {
        status: true,
        expirationDays: 20,
        percentage: 10,
        created_at: DateTime.local().setLocale('pt-br').toISO(),
      },
    ],
  }
}
