import GatewayStrategy, {
  AddSubscriptionDiscountContracts,
  AddSubscriptionIncrementContracts,
  AddSubscriptionItemContracts,
  ChangeChargeCardContracts,
  ChangeChargeOrSubscriptionCardContracts,
  ChargeAutomaticallyContracts,
  CreateCheckoutContracts,
  CreateSubscriptionContracts,
  CreateTokenCardContracts,
  RecipientInformation,
} from './gateway-strategy'

export default class Gateway {
  gateway: GatewayStrategy

  constructor(gatewayProps: GatewayStrategy) {
    this.gateway = gatewayProps
  }

  async addRecipient(recipient: RecipientInformation) {
    if (this.gateway.addRecipient) {
      return await this.gateway.addRecipient(recipient)
    }

    throw {
      message: 'This gateway does not have the function to add recipient',
    }
  }

  async addSubscriptionDiscount(discount: AddSubscriptionDiscountContracts) {
    if (this.gateway.addSubscriptionDiscount) {
      return await this.gateway.addSubscriptionDiscount(discount)
    }

    throw {
      message:
        'This gateway does not have the function to add subscription discount',
    }
  }

  async addSubscriptionItem(item: AddSubscriptionItemContracts) {
    if (this.gateway.addSubscriptionItem) {
      return await this.gateway.addSubscriptionItem(item)
    }
    throw {
      message:
        'This gateway does not have the function to add subscription item',
    }
  }

  async addSubscriptionIncrements(
    increment: AddSubscriptionIncrementContracts
  ) {
    if (this.gateway.addSubscriptionIncrement) {
      return await this.gateway.addSubscriptionIncrement(increment)
    }

    throw {
      message:
        'This gateway does not have the function to add subscription increment',
    }
  }

  async chargeAutomatically(data: ChargeAutomaticallyContracts) {
    if (this.gateway.chargeAutomatically) {
      return await this.gateway.chargeAutomatically(data)
    }
    throw {
      message:
        'This gateway does not have the function to charge automatically',
    }
  }

  async changeChargeCard(cardId: string, data: ChangeChargeCardContracts) {
    if (this.gateway.changeChargeCard) {
      return await this.gateway.changeChargeCard(cardId, data)
    }
    throw {
      message: 'This gateway does not have the function to change charge card',
    }
  }

  async changeSubscriptionCard(cardId: string) {
    if (this.gateway.changeSubscriptionCard) {
      return await this.gateway.changeSubscriptionCard(cardId)
    }
    throw {
      message:
        'This gateway does not have the function to change subscription card',
    }
  }

  async createCard(token: string) {
    if (this.gateway.createCard) {
      return await this.gateway.createCard(token)
    }
    throw {
      message:
        'This gateway does not have the function to change subscription card',
    }
  }

  async createCardToken(data: CreateTokenCardContracts) {
    if (this.gateway.createCardToken) {
      return await this.gateway.createCardToken(data)
    }
    throw {
      message: 'This gateway does not have the function to create card token',
    }
  }

  async createCustomer() {
    if (this.gateway.createCustomer) {
      return await this.gateway.createCustomer()
    }
    throw {
      message: 'This gateway does not have the function to create customer',
    }
  }

  async createCheckout(data: CreateCheckoutContracts) {
    if (this.gateway.createCheckout) {
      return await this.gateway.createCheckout(data)
    }
    throw {
      message: 'This gateway does not have the function to create checkout',
    }
  }

  async createSubscription(data: CreateSubscriptionContracts) {
    if (this.gateway.createSubscription) {
      return await this.gateway.createSubscription(data)
    }
    throw {
      message: 'This gateway does not have the function to create subscription',
    }
  }

  async deleteCard(card_id: string) {
    if (this.gateway.deleteCard) {
      return await this.gateway.deleteCard(card_id)
    }
    throw {
      message: 'This gateway does not have the function to delete card',
    }
  }
}
