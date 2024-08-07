import { BluetoothPrinter } from "../hooks/useThermalPrinter";

export declare global {
  namespace ReactNavigation {
    interface RootParamList {
      auth: undefined;
      printer: {
        printer: BluetoothPrinter
      };
      printers: { user?: any }
    }
  }
}