import { AddonType } from './addon-type';
import { ProductType } from './product-type';
import { CartType } from './cart-type';
import { CategoryType } from './category-type';

export interface CartCustomProductsType {
    id: number;
    name: string;
    type: string;
    status: number;
    description: string;
    value: number;
    flavors: number;
    image: string;
    quantity: number;
    addons: AddonType[];
    products: CartType[];
    obs: string;
}
