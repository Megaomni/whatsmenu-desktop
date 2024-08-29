export interface IfoodOrderType {
  id: number
  orderId: string
  orderStatus: string
  statusCode: string
  merchantId: string
  customerId: string
  customer: any
  paymentId: string
  payements: any
  displayId: string
  orderTiming: string
  orderType: 'DELIVERY' | 'INDOOR' | 'TAKEOUT'
  delivery: IfoodOrderDelivery
  total: IfoodOrderTotal
  itens: any[]
  additionalInfo: IfoodOrderAdditionalInfo
  createdAt: string
  updatedAt: string
  payments: any[]
  extraInfo: string
  preparationStartDateTime: string
}

interface IfoodOrderDelivery {
  mode: string
  deliveredBy: string
  deliveryDateTime: string
  observations: string
  deliveryAddress: IfoodOrderDeliveryAddress
}

interface IfoodOrderDeliveryAddress {
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
    latitude: string
    longitude: string
  }
  pickupCode: string
}

interface IfoodOrderTotal {
  additionalFees: number
  subTotal: number
  deliveryFee: number
  benefits: number
  orderAmount: number
}

interface IfoodOrderAdditionalInfo {
  metadata: {
    deliveryProduct: string
    logisticProvider: string
  }
}
