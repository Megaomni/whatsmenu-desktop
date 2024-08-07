import { CartPizza } from "./cart-pizza";
import { CartType } from "./cart-type";

export interface RequestType {

  id: number;
  profileId: number;
  cupomId: number;
  commandId: number;
  bartenderId: number | null;
  code: number;
  status: "preparation" | "transport" | "canceled" | null,
  name: string;
  contact: "-",
  formPayment: "-",
  formPaymentFlag: "-",
  typeDelivery: number;
  type: "T" | "P" | "D";
  taxDelivery: number;
  timeDelivery: number;
  transshipment: number;
  total: number;
  print: number;
  tentatives: number;
  deliveryAddress: {},
  cart: CartType[],
  cartPizza: CartPizza[],
  created_at: string,
  updated_at: string,
  packageDate?: string
}

