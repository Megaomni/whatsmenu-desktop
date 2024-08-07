import { ProductType } from './product-type'

export interface CartType extends ProductType {
  productId?: number
  details?: any
  displayValue?: number
  quantity?: number
  obs?: string
  code?: string
  // complements: CartComplementType[];
} //

// export interface CartComplementType {
//     id: number;
//     name: string;
//     min: number;
//     max: number;
//     required: boolean;
//     itens: {
//         code: string,
//         status: boolean,
//         name: string,
//         description: string,
//         value: number,
//         quantity: number
//     }[];
// }
