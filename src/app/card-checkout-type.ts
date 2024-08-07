export interface CardCheckoutType {
    customer: {
        name: string,
        email: string,
        document: number | string,
        phones: {
            mobile_phone: {
              country_code: "55",
              area_code: string,
              number: string
            }
          },
    },
    amount: number,
    description: string,
    statement_descriptor: string,
    card: {
        number: string,
        holder_name: string,
        exp_month: number,
        exp_year: number,
        cvv: string,
        billing_address: {
            line_1: string,
            zip_code: string,
            city: string,
            state: string,
            country: string
        }
    },
    profile?: number;
    saveCard: boolean;
    shopkeeperRecipient: string
}