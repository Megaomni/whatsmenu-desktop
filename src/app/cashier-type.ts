import { TableOpenedType } from "src/classes/table";
import { CartRequestType } from "./cart-request-type";

export interface CashierType {
  id: number;
  profileId: number;
  bartenderId: number;
  initialValue: number;
  transactions: TransactionType[];
  carts: CartRequestType[];
  openeds: TableOpenedType[];
  closedValues_user: any;
  closedValues_system: any;
  closed_at: null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionType {
  obs:string
  type: 'income' | 'outcome'
  value: number
  finality?: string
  finalityLabel?: string
  created_at: string
  formatedDate?: string
}