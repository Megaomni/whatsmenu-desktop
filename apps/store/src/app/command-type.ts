import { CartPizza } from './cart-pizza';
import { CartType } from './cart-type';
import { FeeType } from './fee-type';
export interface CommandType {
    id: number;
    code: number;
    name: string;
    tableOpenedId: number;
    tableId?: number;
    status: number;
    requests: any[];
    carts: any[];
    fees: FeeType[]
    cart?: CartType[];
    cartPizza?: CartPizza[];
    total?: number;
    tableEmpty?: boolean;
    created_at: string;
    updated_at: string;
}
