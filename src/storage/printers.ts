import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRINTERS } from "./storageConfig";
import { BluetoothPrinter } from "../hooks/useThermalPrinter";
import { DeviceEventEmitter } from "react-native";

export const setLocalPrinters = async (printers: BluetoothPrinter[]) => {
  try {
    await AsyncStorage.setItem(PRINTERS, JSON.stringify(printers))
    DeviceEventEmitter.emit('printers:updated', printers)
  } catch (error) {
    throw error
  }
}

export const getLocalPrinters = async (): Promise<BluetoothPrinter[]> => {
  try {
    const storage = await AsyncStorage.getItem(PRINTERS)
    const printers: BluetoothPrinter[] = storage ? JSON.parse(storage) : []
    return printers
  } catch (error) {
    throw error
  }
}

export const updatePrinter = async (printer: BluetoothPrinter) => {
  try {
    const printers = await getLocalPrinters()
    const printerToUpdateIndex = printers.findIndex(p => p.macAddress === printer.macAddress)
    if (printerToUpdateIndex > -1) {
      printers[printerToUpdateIndex] = printer
      await setLocalPrinters(printers)
    }
  } catch (error) {
    throw error
  }
}

export const removePrinter = async (macAddress: string) => {
  try {
    const printers = await getLocalPrinters()
    const printersAfterDelete = printers.filter(printer => printer.macAddress !== macAddress)
    await setLocalPrinters(printersAfterDelete)
  } catch (error) {
    throw error
  }
}