import { useContext } from 'react'
import { AppContext } from '../context/app.ctx'
import { handleCopy } from '../utils/wm-functions'

interface useWebPrintProps {
  data: string
}

export interface IWebPrinter {
  id: number
  name: string
  copies: number
  status: boolean
}

export default function useWebPrint() {
  const webPrinters: IWebPrinter[] = localStorage.getItem(
    '@whatsmenu-web-printers-1.0'
  )
    ? JSON.parse(localStorage.getItem('@whatsmenu-web-printers-1.0') as string)
    : []

  const { handleConfirmModal, handleShowToast } = useContext(AppContext)

  const bold = String.fromCharCode(...[0x1b, 0x45, 0x01])

  const requestBluetooth = async (data?: string) => {
    //@ts-ignore
    navigator.bluetooth
      .requestDevice({
        filters: [
          {
            services: ['000018f0-0000-1000-8000-00805f9b34fb'],
          },
        ],
      })
      //@ts-ignore
      .then((device) => {
        console.log('> Found ' + device.name)
        console.log('Connecting to GATT Server...')
        return device.gatt.connect()
      })
      //@ts-ignore
      .then((server) =>
        server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
      )
      //@ts-ignore
      .then((service) =>
        service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
      )
      //@ts-ignore
      .then((characteristic) => {
        if (data) {
          printBluetooth(data)
        }
      })
      .catch((err: any) => {
        throw err
      })
  }

  const requestUsb = async (data?: string) => {
    try {
      //@ts-ignore
      const usbPrinter = await navigator.usb.requestDevice({ filters: [{}] })
      //@ts-ignore

      const endpointNumber =
        usbPrinter.configuration.interfaces[0].alternate.endpoints.find(
          (e: any) => e.direction === 'out'
        ).endpointNumber
      await usbPrinter.open()
      await usbPrinter.selectConfiguration(1)
      await usbPrinter.claimInterface(0)
      await usbPrinter.transferOut(
        endpointNumber,
        new TextEncoder().encode(
          bold +
            (data ?? '')
              .replaceAll(/\u00A0/g, ' ')
              .replaceAll(/\u2000/g, ' ')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') +
            '\n\n'
        )
      )
    } catch (error) {
      throw error
    }
  }

  const printUsb = async (data: string) => {
    try {
      //@ts-ignore
      const printers = await navigator.usb.getDevices()
      if (!printers.length) {
        handleConfirmModal({
          title: 'Por favor configure uma impressora',
          actionConfirm: async () => {
            await requestUsb(data)
          },
        })
      }
      for (const usbPrinter of printers) {
        const webBluetoothPrinter = webPrinters.find(
          (wp) => wp.id === usbPrinter.serialNumber
        )
        if (webBluetoothPrinter && webBluetoothPrinter.status) {
          for (const copie of new Array(webBluetoothPrinter.copies)) {
            const endpointNumber =
              usbPrinter.configuration.interfaces[0].alternate.endpoints.find(
                (e: any) => e.direction === 'out'
              ).endpointNumber
            await usbPrinter.open()
            await usbPrinter.selectConfiguration(1)
            await usbPrinter.claimInterface(0)
            await usbPrinter.transferOut(
              endpointNumber,
              new TextEncoder().encode(
                bold +
                  data
                    .replaceAll(/\u00A0/g, ' ')
                    .replaceAll(/\u2000/g, ' ')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') +
                  '\n\n\n\n\n\n\n\n\n'
              )
            )
          }
        }
      }
    } catch (error) {
      console.error(error)
      handleConfirmModal({
        title: 'Parear impressora',
        actionConfirm: () => requestUsb(data),
      })
    }
  }

  const printBluetooth = async (data: string) => {
    try {
      //@ts-ignore
      if ('bluetooth' in navigator && 'getDevices' in navigator.bluetooth) {
        //@ts-ignore
        const printers = await navigator.bluetooth.getDevices()
        if (!printers.length) {
          handleConfirmModal({
            title: 'Parear impressora',
            actionConfirm: () => requestBluetooth(data),
          })
        } else {
          for await (const bluetoothPrinter of printers) {
            const webBluetoothPrinter = webPrinters.find(
              (wp) => wp.id === bluetoothPrinter.id
            )
            if (webBluetoothPrinter && webBluetoothPrinter.status) {
              for await (const copie of new Array(webBluetoothPrinter.copies)) {
                //@ts-ignore
                const server = await bluetoothPrinter.gatt.connect()
                const service = await server.getPrimaryService(
                  '000018f0-0000-1000-8000-00805f9b34fb'
                )
                const characteristic = await service.getCharacteristic(
                  '00002af1-0000-1000-8000-00805f9b34fb'
                )
                //@ts-ignore
                const dataSplited = [...data.split('\n'), '\n\n']
                for await (const text of dataSplited) {
                  const textFormated = text
                    .replaceAll(/\u00A0/g, ' ')
                    .replaceAll(/\u2000/g, ' ')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                  await characteristic.writeValueWithResponse(
                    new TextEncoder().encode(`${textFormated}\n`)
                  )
                }
              }
            }
          }
        }
      } else {
        return checkBluetooth()
      }
    } catch (error) {
      console.error(error)
      handleConfirmModal({
        title: 'Parear impressora',
        actionConfirm: () => requestBluetooth(data),
      })
    }
  }

  const getPrinters = async (type: 'bluetooth' | 'usb') => {
    if (checkBluetooth(type)) {
      //@ts-ignore
      return await navigator[type]?.getDevices()
    }
  }

  const checkBluetooth = (type: 'bluetooth' | 'usb' = 'bluetooth') => {
    if (
      //@ts-ignore
      !('bluetooth' in navigator && 'getDevices' in navigator.bluetooth) &&
      type === 'bluetooth'
    ) {
      handleConfirmModal({
        title: 'Bluetooth não suportado',
        message:
          'é necessário habilitar Bluetooth para imprimir com drive bluetooth, clique em copiar para copiar e cole o texto na aba nova',
        confirmButton: 'Copiar url',
        actionConfirm: () => {
          handleCopy(
            'chrome://flags#enable-web-bluetooth-new-permissions-backend',
            handleShowToast,
            () => {
              window.open()
            }
          )
        },
      })
      return false
    } else {
      return true
    }
  }

  const browserIsCompatible = () => {
    return (
      /Chrome|Edge|Opera/i.test(navigator.userAgent) &&
      /(Macintosh|Mac OS X)/i.test(navigator.userAgent)
    )
  }

  return {
    requestBluetooth,
    printBluetooth,
    requestUsb,
    printUsb,
    getPrinters,
    browserIsCompatible,
  }
}
