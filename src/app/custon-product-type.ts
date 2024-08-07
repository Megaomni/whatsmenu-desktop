import { AddonType } from './addon-type';
import { ProductType } from './product-type';
import { CategoryType } from './category-type';

export interface CustonProductType {
    id: number;
    name: string;
    status: number;
    description: string;
    flavors: number;
    image: string;
    value: number;
    categories: CategoryType[];
    // addons: AddonType[];
    // products: ProductType[];
}
