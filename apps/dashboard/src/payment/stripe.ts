import { Session } from 'next-auth'
import Stripe from 'stripe'
import { apiRoute } from '../utils/wm-functions'
import GatewayStrategy, {
  AddSubscriptionItemContracts,
  ChangeChargeOrSubscriptionCardContracts,
  ChargeAutomaticallyContracts,
  CreateCheckoutContracts,
  CreateSubscriptionContracts,
  CreateTokenCardContracts,
} from './strategy/gateway-strategy'

export const stripe = new Stripe(process.env.STRIPE_API_KEY as string, {
  apiVersion: '2022-11-15',
  appInfo: {
    name: 'Whatsmenu',
    version: '0.1.0',
  },
})

export default class StrategyStripe implements GatewayStrategy {
  session: Session | null

  constructor(userSession: Session | null) {
    this.session = userSession
  }

  public async addSubscriptionItem(item: AddSubscriptionItemContracts) {
    return await apiRoute(
      '/stripe/addSubscriptionItem',
      this.session,
      'POST',
      item
    )
  }

  async chargeAutomatically(data: ChargeAutomaticallyContracts) {
    return await apiRoute(
      '/stripe/createCheckoutOrPurchaseData',
      this.session,
      'POST',
      data
    )
  }

  public async changeChargeCard(cardId: string) {
    return await apiRoute('/stripe/changeChargeCard', this.session, 'PATCH', {
      cardId,
    })
  }

  public async changeSubscriptionCard(cardId: string) {
    return await apiRoute(
      '/stripe/changeSubscriptionCard',
      this.session,
      'PATCH',
      { cardId }
    )
  }

  public async createCard(token: string) {
    return await apiRoute('/stripe/createCard', this.session, 'POST', { token })
  }

  public async createCardToken(card: CreateTokenCardContracts) {
    return await apiRoute('/stripe/cardToken', this.session, 'POST', card)
  }

  public async createCheckout(data: CreateCheckoutContracts) {
    return await apiRoute(`/stripe/createCheckout`, this.session, 'POST', {
      line_items: data.line_items.map((item) => {
        return {
          price: item.id,
          quantity: item.quantity,
        }
      }),
      success_url: data.payments[0]?.checkout?.success_url,
      cancel_url: data.payments[0]?.checkout?.cancel_url,
      mode: data.payments[0]?.method,
    })
  }

  public async createCustomer() {
    return await apiRoute('/stripe/createCustomer', this.session, 'POST')
  }

  public async createSubscription(data: CreateSubscriptionContracts) {
    return await apiRoute('/stripe/createSubscription', this.session, 'POST', {
      line_items: data.items.map((item) => {
        return {
          price: item.id,
          quantity: item.quantity,
        }
      }),
      default_card: data.card_id,
    })
  }

  public async deleteCard(card_id: string) {
    return await apiRoute(`/stripe/cards/${card_id}`, this.session, 'DELETE')
  }
}
