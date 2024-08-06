export type SystemProductOperationsType = {
  type?: 'yearly' | 'monthly'
  prices: Array<{
    id: string
    gateways: any
    currencies: {
      [k in 'brl' | 'eur' | 'usd']: {
        unit_amount: number
      }
    }
    default_currency: string
  }>
}
