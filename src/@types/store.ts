export type Printer = Electron.PrinterInfo & {
  id: string;
  silent: boolean;
  paperSize: 58 | 80 | number;
  copies: number;
  margins: Electron.Margins;
  scaleFactor: number;
  options: {
    "printer-location": string[];
    "printer-make-and-model": string;
    system_driverinfo: string;
  };
};

export type CacheContact = {
  contact: string,
  messageType: 'welcome' | 'cupomFirst',
  revalidateTime?: number,
  created_at: string
}

export type OldVoucher = {
  id: number,
  value: number,
  client: {
    whatsapp: string
    name: string
    vouchersTotal: number
  }
  afterPurchaseDate: string | null
  rememberDate: string | null
  rememberDays: number
  expirationDate: string | null
}

export type VoucherObj = {
  id: number,
  value: number,
  afterPurchaseDate?: string | null,
  rememberDate?: string | null,
  rememberDays: number,
  expirationDate?: string | null,
}

export type VoucherTwoFactorObj = {
  id: number,
  afterPurchaseDate: boolean,
  rememberDate: boolean,
  expirationDate: boolean,
}

export type VoucherNotification = {
  name: string
  whatsapp: string
  vouchers: VoucherObj[]
  voucherTwoFactor: VoucherTwoFactorObj[]
  vouchersTotal: number
}
