export interface PixCheckoutType {
        phone: {
          area_code: string,
          number: string,
        },
        name: string,
        document: string,
        amount: number,
        description: string,
        shopkeeperRecipient: string,
        expiresIn: number
}