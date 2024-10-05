import { ClientType } from "./client";

export interface VoucherType {
  id: number;
  profileId: number;
  clientId: number;
  client?: ClientType;
  status: boolean;
  value: number;
  expirationDate: string;
  created_at: string;
  updated_at: string;
}
