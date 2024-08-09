// export type Customer = {
//     id: string
//   name: string
//   phone: {
//       number: string,
//       localizer: string,
//       localizerExpiration: datetime
//   }
//   ordersCountOnMerchant: number
//   segmentation: string

//   merchant_customers:{
//       id: number
//       id_merchant: string
//       id_customer: string
//   }
// }

export interface CustomerPhone {
  number: string
  localizer: string
  localizerExpiration: string
}

export interface MerchantCustomers {
  id: number
  id_merchant: string
  id_customer: string
}
