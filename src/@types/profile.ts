import { WeekType } from "./week";

export interface ProfileType {
  address: ProfileAddress;
  background: string;
  color: string;
  command: number;
  created_at: string;
  deliveryLocal: boolean;
  description: string;
  fees: any[];
  formsPayment: any[];
  id: number;
  logo: string;
  minval: number | string;
  minvalLocal: number | string;
  name: string;
  not_security_key?: boolean;
  options: ProfileOptions;
  request: number;
  showTotal: boolean;
  slug: string;
  status: boolean;
  taxDelivery: ProfileTaxDeliveryType[];
  timeZone: string;
  typeDelivery: "km" | "neighborhood";
  typeStore: string;
  updated_at: string;
  userId: number;
  week: WeekType;
  whatsapp: string;
  firstOnlyCupom: any;
}

type KmType = {
  time: string;
  value: number | string;
  distance: number | string;
};
type NeighborhoodType = {
  city: string;
  neighborhoods: Array<{
    code: string;
    name: string;
    time: string;
    value: number;
  }>;
};

type ProfileTaxDeliveryType = {
  code: string;
} & (KmType | NeighborhoodType);

interface ProfileAddress {
  city: string;
  state: string;
  number: string;
  street: string;
  zipcode: string;
  complement: string | null;
  neigborhood: string;
}

interface CashbackVouch {
  status: boolean;
  percentage: number;
  expirationDays: number;
  created_at: string;
}

interface ProfileOptions {
  voucher: CashbackVouch[];
  bot: {
    whatsapp: {
      welcomeMessage: {
        status: boolean;
        alwaysSend: boolean;
      };
    }
  };
  pdv: {
    clientConfig: {
      required: boolean;
      birthDate: boolean;
    };
    cashierManagement: boolean;
  };
  integrations: {
    ifood?: {
      created_at?: string
      merchantId?: string
      autoOrder?: boolean
    }
    grovenfe?: {
      company_id: number
      plan: any
      config: {
        fiscal_notes: {
          day_limiter: null | number
          forms_payments: Array<{ type: string }>
        }
      }
      delivery_ncm_code?: string
      created_at: string
    }
  };
  asaas?: {
    id: string;
    apiKey: string;
    walletId: string;
    loginEmail: string;
    mobilePhone: string;
    negotiations: Array<{
      pix: Array<{
        fee: number;
        expiration_date: string;
      }>;
    }>;
    accountNumber: {
      agency: string;
      account: string;
      accountDigit: string;
    };
  };
  order: string;
  pizza: {
    higherValue: boolean;
    multipleBorders: boolean;
    multipleComplements: boolean;
  };
  print: {
    app: boolean;
    web: string;
    width: string;
    active: boolean;
    copies: number;
    textOnly: boolean;
    groupItems: boolean;
  };
  table: {
    callBartender: boolean;
    persistBartender: boolean;
  };
  queues: {
    bartender: any[];
  };
  favicon: string;
  package: {
    week: WeekType;
    active: boolean;
    label2: boolean;
    minValue: number;
    hoursBlock: any[];
    maxPackage: number;
    distanceDays: {
      end: number;
      start: number;
    };
    intervalTime: number;
    minValueLocal: number;
    shippingLocal: {
      active: boolean;
    };
    specialsDates: Array<string>;
    maxPackageHour: number;
    shippingDelivery: {
      active: boolean;
    };
  };
  delivery: {
    enableKm: boolean;
    disableDelivery: boolean;
    deactivated?: boolean;
  };
  tracking: {
    pixel: string;
    google: string;
  };
  locale: {
    language: string;
    currency: string;
  };
  onlineCard: boolean;
  activeCupom: boolean;
  forceLogout?: string;
  linkWhatsapp: boolean;
  placeholders: {
    pizzaObs: string;
    clientText: string;
    productObs: string;
    statusSend: string;
    statusToRemove: string;
    statusProduction: string;
    welcomeMessage: string;
    absenceMessage: string;
    cupomFirstMessage: string;
  };
  disponibility: {
    showProductsWhenPaused: boolean;
  };
  inventoryControl: boolean;
}

export interface ProfileFormPayment {
  payment: string
  status?: boolean
  flags?: { code: string; image: string; name: string }[]
  newFlag?: string
  label: string
  key?: { type: string; value: string }
  addon: AddonType
}

export interface AddonType {
  status: boolean
  type: 'fee' | 'discount' | string
  valueType: 'fixed' | 'percentage' | string
  value: number
}

export interface ProfileFee {
  id?: number | null
  code: string | null
  profileId?: number | null
  type: 'percent' | 'fixed' | null
  value: number
  quantity?: number
  oldQuantity?: number
  status: boolean | null
  automatic: boolean
  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}