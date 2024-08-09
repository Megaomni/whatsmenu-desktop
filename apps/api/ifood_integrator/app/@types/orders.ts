export interface OrderDelivery {
  mode: string
  deliveredBy: 'IFOOD' | 'MERCHANT'
  deliveryDateTime: string
  observations: string
  deliveryAddress: OrderDeliveryAddress
}

export interface OrderDeliveryAddress {
  streetName: string
  streetNumber: string
  formattedAddress: string
  neighborhood: string
  complement: string
  postalCode: string
  city: string
  state: string
  country: string
  reference: string
  coordinates: {
    latitude: number
    longitude: number
  }
  pickupCode: string
}

export interface OrderTotal {
  additionalFees: number
  subTotal: number
  deliveryFee: number
  benefits: number
  orderAmount: number
}

export interface OrderAdditionalInfo {
  metadata: {
    deliveryProduct: string
    logisticProvider: string
  }
}

export type CancellationReasons = {
  reason: string
  cancellationCode?:
    | '501'
    | '502'
    | '503'
    | '504'
    | '505'
    | '506'
    | '507'
    | '508'
    | '509'
    | '511'
    | '512'
    | '513'
}
