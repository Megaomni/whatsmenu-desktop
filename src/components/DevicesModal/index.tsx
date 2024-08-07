import { FlatList, Modal, Switch, Text, TouchableOpacity, View } from "react-native";

import colors from 'tailwindcss/colors'

import { TextStyled } from "../TextStyled";
import { BluetoothDevice, BluetoothPrinter } from "../../hooks/useThermalPrinter";
import { useEffect, useState } from "react";
import Button from "../Button";

interface DevicesModalProps {
  show: boolean
  devices: BluetoothDevice[]
  printers: BluetoothPrinter[]
  cancel: () => void
  confirm: () => void
  onCancel?: (selectedPrinters: BluetoothPrinter[]) => void
  onConfirm?: (selectedPrinters: BluetoothPrinter[]) => void
}

export const DevicesModal = ({ devices, printers, onConfirm, show, cancel, confirm }: DevicesModalProps) => {
  const [selectedPrinters, setSelectedPrinters] = useState<BluetoothPrinter[]>(printers)

  const isSelectedPrinter = (macAddress: string) => {
    return selectedPrinters.some(printer => printer.macAddress === macAddress)
  }

  const toggleDevice = (device: BluetoothDevice) => {
    setSelectedPrinters(state => {
      if (state.some(printer => printer.macAddress === device.macAddress)) {
        return state.filter(printer => printer.macAddress !== device.macAddress)
      } else {
        return [...state, { ...device, id: state.length, bold: false, copies: 1, lines: 1, disableLine: false, font: 'sm', printerWidthMM: 58 }]
      }
    })
  }

  useEffect(() => {
    if (show) {
      setSelectedPrinters(printers)
    }
  }, [show])

  return (
    <Modal
      animationType='fade'
      transparent={true}
      onRequestClose={cancel}
      visible={show}
    >
      <View className='flex-1 items-center justify-center bg-zinc-700/50'>
        <View className='bg-zinc-100 dark:bg-zinc-950 min-h-[25vh] max-h-[50vh] min-w-[75vw] max-w-[75vw] rounded-md items-start'>
          <View className='p-4 bg-zinc-300 dark:bg-zinc-700 rounded-t-md w-full'>
            <TextStyled>Dispositivos Pareados</TextStyled>
          </View>

          <FlatList
            className='px-4'
            data={devices}
            renderItem={({ item: device }) => (
              <View
                className={`flex-row items-center ${device.deviceName === devices[devices.length - 1].deviceName ? '' : ''}`}>
                <Switch
                  trackColor={{ false: colors.zinc[300], true: colors.green[300] }}
                  thumbColor={isSelectedPrinter(device.macAddress) ? colors.green[500] : colors.zinc[50]}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={() => toggleDevice(device)}
                  value={isSelectedPrinter(device.macAddress)}
                />
                <TouchableOpacity
                  className='w-full p-3'
                  onPress={() => toggleDevice(device)}
                >
                  <TextStyled>{device.deviceName}</TextStyled>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={item => item.macAddress}
          />
          <View className='p-4 flex-row items-center justify-end rounded-b-md bg-zinc-300 dark:bg-zinc-700 w-full'>
            <Button
              className="p-2 bg-red-500"
              onPress={() => {
                setSelectedPrinters([])
                cancel()
              }}
            >
              <TextStyled>Cancelar</TextStyled>
            </Button>
            <Button
              className="p-2 mx-2"
              onPress={() => {
                confirm()
                onConfirm && onConfirm(selectedPrinters)
              }}
            >
              <TextStyled>Salvar</TextStyled>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}