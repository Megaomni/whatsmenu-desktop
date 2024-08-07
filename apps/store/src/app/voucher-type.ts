import { CustomerType } from './customer-type';

export interface VoucherType {
  id: number
  profileId: number
  clientId: number
  client?: CustomerType
  status: boolean
  value: number
  expirationDate: string
  created_at: string
  updated_at: string
}
