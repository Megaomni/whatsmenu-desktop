export interface RequestType {
  id: number;
  profileId: number;
  cupomId: number | null;
  cupom?: any | null;
  commandId: number | null;
  bartenderId: number | null;
  code: number;
  status: "production" | "transport" | "delivered" | "canceled" | null;
  name: string;
  contact: string;
  formPayment: string;
  formPaymentFlag: string;
  typeDelivery: number;
  type: "D" | "P" | "T";
  taxDelivery: number;
  timeDelivery: string | number;
  transshipment: number;
  total: number;
  print: number;
  tentatives: number;
  deliveryAddress: any;
  cart: ProductCartType[];
  cartPizza: PizzaCartType[];
  created_at: string;
  update_at: string;
  slug: string;
  packageDate: string;
}

export type ProductCartType = {
  id: number;
  name: string;
  obs: string;
  complements: Complement[];
  value: number;
  valueTable: number;
  promoteValue: number;
  promoteValueTable: number;
  promoteStatus: number;
  promoteStatusTable: Number;
  quantity: number;
  typeDelivery?: number
}

export type PizzaCartType = {
  [key: string]: any;
  size: string;
  value: number;
  status: boolean;
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  implementations: PizzaImplementation[];
  quantity: number;
  obs: string;
  typeDelivery?: number;
}

type ItemComplement = {
  code: string;
  name: string;
  value: number;
  status: boolean;
  description: string;
  quantity?: number;
}

type Complement = {
  id?: number;
  name: string;
  type: "default" | "pizza";
  order: number;
  min: number;
  max: number;
  required: boolean;
  itens: ItemComplement[];
  vinculate?: {
    link: boolean;
    code: string;
  }
  pivot?: {
    complementId: number;
    productId: number;
  }
  created_at?: string;
  updated_at?: string;
}

type PizzaSize = {
  code: string;
  name: string;
  status: boolean;
  flavors: number[];
  covers: string[];
}

type PizzaImplementation = {
  code: string;
  name: string;
  value: number;
  status: boolean;
}

type PizzaFlavor = {
  code: string;
  name: string;
  description: string;
  image: string;
  status: boolean;
  values: {
    [key: string]: number | string;
  };
  valuesTable: {
    [key: string]: number | string;
  };
  // category?: Category;
}