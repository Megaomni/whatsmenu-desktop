import { CashierType } from "./cashier-type";
import { CategoryType } from "./category-type";

export interface BartenderType {
  id: number;
  profileId: number;
  name: string;
  password: string;
  status: boolean;
  controls: BartenderControlsType;
  categories?: CategoryType[];
  deleted_at: null | string;
  created_at: string;
  updated_at: string;
}

interface BartenderControlsType {
  type: 'default' | 'manager' | 'cashier';
  blockedCategories?: number[];
  activeCashier?: CashierType;
  defaultCashier?: boolean;
}