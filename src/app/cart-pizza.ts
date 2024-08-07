import { PizzaFlavorType, PizzaImplementationType, PizzaProductType, PizzaSizeType } from './pizza-product-type';
import { ComplementType } from './product-type';

export interface CartPizza extends PizzaProductType {
    pizzaId?: number;
    categoryId?: number;
    name?: string;
    details?: any;
    quantity: number;
    value?: number;
    obs: string;
    size?: string;
}

export interface CartFlavorPizzaType extends CartPizza {
    id: number;
    name?: string;
    status: boolean
    flavorCode: string;
    sizeCode: string;
    sizes: PizzaSizeType[];
    flavors: PizzaFlavorType[];
    complements: ComplementType[];
    implementations: PizzaImplementationType[];
}