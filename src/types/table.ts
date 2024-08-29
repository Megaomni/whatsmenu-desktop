import { ProfileFee } from "./profile";
import Request from "./request";
import Command from "./command";
import { DateTime } from "luxon";
import Cart, { CartFormPayment } from "./cart";

export interface TableType {
  id: number;
  profileId: number;
  name: string;
  status: boolean;
  tablesOpened?: TableOpened[];
  opened?: TableOpened;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export default class Table {
  id: number;
  profileId: number;
  name: string;
  status: boolean;
  tablesOpened?: TableOpened[];
  opened?: TableOpened;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;

  constructor(table: TableType) {
    this.id = table.id;
    this.profileId = table.profileId;
    this.name = table.name;
    this.status = table.status;
    this.tablesOpened = table.tablesOpened?.map((t) => new TableOpened(t));
    this.opened = table.opened && new TableOpened(table.opened);
    this.deleted_at = table.deleted_at;
    this.created_at = table.created_at;
    this.updated_at = table.updated_at;
  }

  public activeCommands = () => {

    return this.opened?.commands.filter(
      (command) => command.status
    ) ?? []
  };

  public haveCarts = () => {
    return !!this.activeCommands()?.some((command) => command.haveCarts());
  };
}

export interface TableOpenedType {
  id: number;
  tableId: number;
  table?: Table
  status: boolean;
  fees: ProfileFee[];
  formsPayment: CartFormPayment[];
  commands: Command[];
  perm?: string;
  created_at: string;
  updated_at: string;
  // WS types only
  wsFormsPayment?: CartFormPayment[];
  wsPerm?: any;
  updatedFees?: ProfileFee[];
  totalValue?: number;
  subTotal?: number;
  lack?: number;
  paid?: number;
}

export class TableOpened {
  id: number;
  tableId: number;
  table?: Table
  status: boolean;
  fees: ProfileFee[];
  formsPayment: CartFormPayment[];
  commands: Command[];
  perm?: string;
  created_at: string;
  updated_at: string;
  // WS types only
  wsFormsPayment?: CartFormPayment[];
  wsPerm?: any;
  updatedFees?: ProfileFee[];
  totalValue?: number;
  subTotal?: number;
  lack?: number;
  paid?: number;

  constructor(tableOpened: TableOpenedType) {
    this.id = tableOpened.id;
    this.tableId = tableOpened.tableId;
    this.table = tableOpened.table ? new Table(tableOpened.table) : undefined
    this.status = tableOpened.status;
    this.commands = tableOpened.commands ? tableOpened.commands.map((command) => new Command(command)) : []
    this.fees = tableOpened.fees;
    this.formsPayment = tableOpened.formsPayment;
    this.perm = DateTime.fromSQL(tableOpened.updated_at).diff(DateTime.fromSQL(tableOpened.created_at), ['months', 'days', 'hours', 'minutes']).toFormat(`hh'h'mm`);
    this.created_at = tableOpened.created_at;
    this.updated_at = tableOpened.updated_at;
  } 

  // public allFormsPayment = () => {
  //   return this.formsPayment.concat(
  //     this.commands.flatMap(command => command.formsPayment)
  //   );
  // };

  public allFeesById = (feeId: number) => {
    return this.commands.reduce((fees: ProfileFee[], command) => {
      const haveFee = command.fees.find((fee) => fee.id === feeId);
      if (haveFee) {
        fees.push(haveFee);
      }
      return fees;
    }, []);
  };

  public getUpdatedFees = (filter = false, all = false) => {
    const fees = (filter ? this.commands.filter(c => c.status) : this.commands).reduce((fees: ProfileFee[], command) => {
      if (command.haveCarts()) {
        command.fees.forEach((fee) => { 
          if (all ?? !fee.deleted_at) {
            const haveFee = fees.find((f) => f.code === fee.code);
            if (!haveFee) {
              if (fee.quantity) {
                fee.quantity = fee.automatic ? fee.quantity : 0;
              }
              if (fee.type === 'percent') {
                const tableFee = this.fees.find(f => f.code === fee.code)
                if (tableFee) {
                  fee = tableFee
                }
              }
              fees.push({ ...fee });
            } else {
              if (fee.quantity && fee.type === "fixed") {
                (haveFee.quantity as number) += fee.automatic
                  ? fee.quantity
                  : 0;
              }
            }
          }
        });
      }
      return fees;
    }, []);

    return fees;
  };

  public getTotalValue = (
    only:
      | ""
      | "table"
      | "fee"
      | "tableFee"
      | "formsPayment"
      | "lack"
      | "paid" = "",
    value = 0,
    report = false
  ) => {
    const tableTotal = this.commands.reduce(
      (result, command) => Number(Math.fround(result + command.getTotalValue("command")).toFixed(2)),
      0
    );
    const feeTotal = this.getUpdatedFees(false, true).reduce((feeTotal, fee) => {
      if (fee.status && fee.automatic) {
        if (fee.type === "percent") {
          feeTotal += (fee.value / 100) * tableTotal;
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0;
        }
      }
      return Number(Math.fround(feeTotal).toFixed(2));
    }, 0);
    const formsPaymentTotal = (this.formsPayment).reduce(
      (formsPaymentTotal, formPayment) => Number(Math.fround(formsPaymentTotal + formPayment.value).toFixed(2)),
      0
    );

    const total = tableTotal + feeTotal + formsPaymentTotal;
    switch (only) {
      case "":
        return total;
      case "fee":
        return feeTotal;
      case "tableFee":
        return tableTotal + feeTotal;
      case "formsPayment":
        return formsPaymentTotal;
      case "table":
        return tableTotal;
      case "lack":
        return Number(Math.fround(Math.max(tableTotal + feeTotal - formsPaymentTotal - value, 0)).toFixed(2));
      case "paid":
        return Number(Math.fround(formsPaymentTotal + value).toFixed(2));
    }
  };

  public getCarts = () => {
    return this.commands.reduce((carts: Cart[], command) => {
      command.carts.forEach((cart) => {
        if (cart.status !== "canceled") {
          carts.push(cart);
        }
      });
      return carts;
    }, []);
  };
}
