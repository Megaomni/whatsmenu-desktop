import axios, { AxiosResponse } from "axios";
import { Session } from "next-auth"
import { apiRoute } from "../utils/wm-functions"
import GatewayStrategy, {
    AddSubscriptionDiscountContracts,
    AddSubscriptionIncrementContracts,
    AddSubscriptionItemContracts,
    ChangeChargeCardContracts,
    ChangeChargeOrSubscriptionCardContracts,
    ChargeAutomaticallyContracts,
    CreateCheckoutContracts,
    CreateSubscriptionContracts,
    CreateTokenCardContracts
} from "./strategy/gateway-strategy";

export default class StrategyPagarme implements GatewayStrategy {
    session: Session | null;
    pub_key: string;
    headers: any;

    constructor(userSession: Session | null, public_key: string) {
        this.session = userSession;
        this.pub_key = public_key;
    }

    public async addSubscriptionDiscount(data: AddSubscriptionDiscountContracts) {
        return await apiRoute("/pagarme/subscription/increments", this.session, "POST", {
            value: data.value,
            discount_type: data.discount_type,
            cycles: data.cycles,
            item_id: data.item_id
        });
    }

    public async addSubscriptionItem(item: AddSubscriptionItemContracts) {
        return await apiRoute("/pagarme/subscription/items", this.session, "POST", item);
    };

    public async addSubscriptionIncrement(data: AddSubscriptionIncrementContracts) {
        return await apiRoute("/pagarme/subscription/increments", this.session, "POST", {
            value: data.value,
            increment_type: data.increment_type,
            cycles: data.cycles,
            item_id: data.item_id
        });
    }

    public async chargeAutomatically(data: ChargeAutomaticallyContracts) {
        return await apiRoute("/pagarme/createCheckoutOrPurcharseCard", this.session, "POST", data);
    }

    public async changeChargeCard(cardId: string, data: ChangeChargeCardContracts) {
        return await apiRoute("/pagarme/changeChargeCard", this.session, "PATCH", { cardId, ...data });
    }

    public async changeSubscriptionCard(cardId: string) {
        return await apiRoute("/pagarme/changeSubscriptionCard", this.session, "PATCH", { cardId });
    }

    public async createCard(token: string) {
        return await apiRoute("/pagarme/createCard", this.session, "POST", {
            token
        });
    };

    public async createCardToken(data: CreateTokenCardContracts) {
        return await apiRoute(`${process.env.CANONICAL_URL}/api/pagarme/createTokenCard`, null, 'POST', {
            card: {
                number: data.number,
                holder_name: data.name,
                exp_month: data.exp_month,
                exp_year: data.exp_year,
                cvv: data.cvc
            },
            type: 'card'
        });
    };

    public async createCheckout(data: CreateCheckoutContracts) {
        return await apiRoute("/pagarme/createCheckoutOrPurcharseCard", this.session, "POST", {
            payments: data.payments.map(payment => {
                return {
                    payment_method: payment.method,
                    checkout: payment.checkout
                }
            }),
            items: data.line_items.map(item => {
                return {
                    amount: item.value,
                    description: item.description,
                    quantity: item.quantity,
                    code: item.id
                }
            }),
            invoices: data.invoices
        })
    };

    public async createCustomer() {
        return await apiRoute("/pagarme/createCustomer", this.session, "POST");
    };

    public async createSubscription(data: CreateSubscriptionContracts) {
        return await apiRoute("/pagarme/subscriptions", this.session, "POST", data);
    }

    public async deleteCard(card_id: string) {
        return await apiRoute(`/pagarme/cards/${card_id}`, this.session, "DELETE")
    }
}
