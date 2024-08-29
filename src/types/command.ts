import Cart, { CartFormPayment } from "./cart";
import { ProfileFee } from "./profile";
import { TableOpened, TableOpenedType } from "./table";
export interface CommandType {
  id: number;
  tableOpenedId: number;
  opened?: TableOpenedType
  tableId?: number;
  name: string;
  code: number;
  status: boolean;
  fees: ProfileFee[];
  formsPayment: CartFormPayment[];
  carts: Cart[];
  created_at: string;
  updated_at: string;
  // WS types only
  totalValue?: number;
}

export interface CommandWsData {
  commandsWs: CommandType[]
  finish?: 'command' | 'table';
}
export default class Command {
  id: number;
  tableOpenedId: number;
  opened?: TableOpened
  name: string;
  code: number;
  status: boolean;
  fees: ProfileFee[];
  formsPayment: CartFormPayment[];
  carts: Cart[];
  created_at: string;
  updated_at: string;
  // WS types only
  totalValue?: number;
  subTotal?: number;
  lack?: number;
  paid?: number;

  constructor(command: CommandType) {
    this.id = command.id;
    this.tableOpenedId = command.tableOpenedId;
    this.opened = command.opened ? new TableOpened(command.opened) : undefined;
    this.status = command.status;
    this.name = command.name;
    this.code = command.code;
    this.fees = command.fees?.filter((fee) => fee.deleted_at === null);
    this.formsPayment = command.formsPayment;
    this.carts = command.carts?.map(
      (cart) => new Cart(cart)
    ) || []
    this.created_at = command.created_at;
    this.updated_at = command.updated_at;
  }

  public haveCarts = () => {
    return !!this.carts.filter((cart) => cart.status !== "canceled")
      .length;
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
    const commandTotal = this.carts.reduce((commandTotal, cart) => {
      if (cart.status !== "canceled") {
        commandTotal += cart.total;
      }
      return Number(Math.fround(commandTotal).toFixed(2));
    }, 0);

    const feeTotal = this.fees.reduce((feeTotal, fee) => {
      if (fee.status && fee.automatic) {
        if (fee.type === "percent") {
          feeTotal += (fee.value / 100) * commandTotal;
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0;
        }
      }
      return Number(Math.fround(feeTotal).toFixed(2));
    }, 0);

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
        return Number(Math.fround(Math.min((commandTotal + feeTotal) - formsPaymentTotal - value, 0)).toFixed(2));
      case "paid":
        return Number(Math.fround(formsPaymentTotal + value).toFixed(2));
    }
  };

  public fullPaid = (): boolean => {
    return this.getTotalValue("paid") >= this.getTotalValue("commandFee");
  };
}
