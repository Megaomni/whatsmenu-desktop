// import { CartType } from './cart-type';
import { ProductType } from './product-type';
// import { AddonType } from './addon-type';
// import { CustonProductType } from './custon-product-type';
import { PizzaProductType } from './pizza-product-type';
import { CartFlavorPizzaType } from './cart-pizza';

export interface CategoryType {
    id: number;
    name: string;
    slug: string;
    type: 'default' | 'pizza';
    disclosure: string;
    disponibility: {
        store: {
            table: boolean;
            package: boolean;
            delivery: boolean;
        };
    };
    primary: boolean;
    products: ProductType[];
    pizzas?: CartFlavorPizzaType[];
    product: PizzaProductType;
    nextDate?: any;
    blocked?: boolean;
    disponibilityOff?: boolean;
}
