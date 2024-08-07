import { TableOpened } from "./table";

export interface CommandType {
  id: number;
  tableOpenedId: number;
  opened?: TableOpened
  tableId?: number;
  name: string;
  code: number;
  status: boolean;
  fees: any[];
  formsPayment: any[];
  requests: any[];
  carts: any[];
  tableEmpty?: boolean;
  created_at: string;
  updated_at: string;
}

export default class Command {
  id: number;
  tableOpenedId: number;
  opened?: TableOpened
  tableId?: number;
  name: string;
  code: number;
  status: boolean;
  fees: any[];
  formsPayment: any[];
  requests: any[];
  carts: any[];
  created_at: string;
  updated_at: string;
  printMode = false

  constructor(command: CommandType) {
    this.id = command.id;
    this.tableOpenedId = command.tableOpenedId;
    this.opened = command.opened;
    this.status = command.status;
    this.name = command.name;
    this.code = command.code;
    this.fees = command.fees.filter(fee => fee.deleted_at === null);
    this.formsPayment = command.formsPayment.filter(f => {
      if (f.payment === 'pix') {
        return f.paid
      }
      return true
    });
    this.requests = command.requests ?? [];
    this.carts = command.carts ?? [];
    this.created_at = command.created_at;
    this.updated_at = command.updated_at;
  }

  public haveRequests = () => {
    return this.requests.some((request) => request.status !== "canceled")
  };

  public haveCarts = () => {
    return this.carts.some((cart) => cart.status !== "canceled")
  };

  public getTotalValue = (
    only:
      | ""
      | "command"
      | "fee"
      | "commandFee"
      | "formsPayment"
      | "lack"
      | "paid" = "",
    value: number = 0
  ) => {
    const commandTotal = this.carts.reduce((commandTotal, request) => {
      if (request.status !== "canceled") {
        commandTotal += request.total;
      }
      return Number(Math.fround(commandTotal).toFixed(2));
    }, 0);

    const feeTotal = this.haveCarts() ? this.fees.reduce((feeTotal, fee) => {
      if (fee.status && fee.automatic) {
        if (fee.type === "percent") {
          feeTotal += (fee.value / 100) * commandTotal;
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0;
        }
      }
      return Number(Math.fround(feeTotal).toFixed(2));
    }, 0) : 0;

    const formsPaymentTotal = this.formsPayment.reduce(
      (formsPaymentTotal, formPayment) => Number(Math.fround(formsPaymentTotal + formPayment.value).toFixed(2)),
      0
    );

    const total = commandTotal + feeTotal + formsPaymentTotal;
    
    switch (only) {
      case "":
        return total;
      case "fee":
        return feeTotal;
      case "commandFee":
        return commandTotal + feeTotal;
      case "formsPayment":
        return formsPaymentTotal;
      case "command":
        return commandTotal;
      case "lack":
        return Number(Math.fround(Math.max((commandTotal + feeTotal) - formsPaymentTotal - value, 0)).toFixed(2));
      case "paid":
        return Number(Math.fround(formsPaymentTotal + value).toFixed(2));
    }
  };

  public fullPaid = (): boolean => {
    return this.getTotalValue("paid") >= this.getTotalValue("commandFee")
  }

  public sortRequests = () => {
    return this.requests.sort((a, b) => {
      return a.code < b.code ? 1 : -1
    })
  }

  public sortCarts = () => {
    return this.carts.sort((a, b) => {
      return a.code < b.code ? 1 : -1
    })
  }
}
