import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Permission, PermissionsAndroid, View, NativeModules, TouchableOpacity, Alert, AppRegistry, TaskProvider } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/Ionicons';
import colors from 'tailwindcss/colors'

import notifee, { AndroidImportance } from "@notifee/react-native";

import { useKeepAwake } from 'expo-keep-awake';

import { BluetoothPrinter, useThermalPrinter } from '../hooks/useThermalPrinter';
import { getUser } from '../storage/user';

import { parse, useURL } from 'expo-linking';
import { WebView } from 'react-native-webview';
import { registerTaskWebSocket } from '../services/background.service';
import { getLocalPrinters, setLocalPrinters } from '../storage/printers';
import { useWebSocket } from '../hooks/useWebSocket';
import BackgroundTimer from 'react-native-background-timer';
import { TextStyled } from '../components/TextStyled';
import Button from '../components/Button';

type RouteParams = {
  updatePrinters?: boolean
}

export const Home = () => {
  const { navigate, dispatch } = useNavigation()
  const { params } = useRoute()
  const { devices, print } = useThermalPrinter()
  useKeepAwake()

  const [profile, setProfile] = useState<any>()
  const [printers, setPrinters] = useState<BluetoothPrinter[]>([])
  const [offsetY, setOffsetY] = useState(0)
  const [canUpdate, setCanUpdate] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  let redirectURL = useURL()
  const [deeplink, setDeeplink] = useState<typeof redirectURL>(null)

  const webViewRef = useRef<WebView>(null)
  const { socket, connect } = useWebSocket(profile)

  // const handleLogOff = async () => {
  //   await removeUser()
  //   navigate('auth')
  // }

  const requestBatteryOp = async () => {
    const result = PermissionsAndroid.request("android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" as Permission)
  }

  const printForAllPrinters = async (text: string, printerToPrint?: BluetoothPrinter[]) => {
    printerToPrint = await getLocalPrinters()
    for await (const printer of printerToPrint ?? printers) {
      try {
        print(text, printer)
        printer.error = false
      } catch (error) {
        printer.error = true
        console.error(error);
      } finally {
        // await setLocalPrinters(printers)
        setPrinters(() => [...printers])
      }
    }
  }

  const displayNotification = async () => {
    await notifee.requestPermission()

    const channelId = await notifee.createChannel({
      id: 'test',
      name: 'requests',
      vibration: true,
      importance: AndroidImportance.HIGH
    })

    await notifee.displayNotification({
      id: '7',
      title: 'Olha o pedido, WhatsMenu!',
      body: 'Chegou pedido pra impressão.',
      android: { channelId }
    })
  }

  useEffect(() => {
    if (printers?.length) {
      setLocalPrinters(printers)
    }
  }, [printers])

  useEffect(() => {
    if ((params as RouteParams)?.updatePrinters) {
      getLocalPrinters()
        .then(localPrinters => {
          if (localPrinters) {
            setPrinters(localPrinters)
          }
        })
    }
  }, [params])

  useEffect(() => {
    if (redirectURL) {
      DeviceEventEmitter.emit('request:deeplink', decodeURI(parse(redirectURL).path!))
    }
  }, [redirectURL])

  useEffect(() => {
    if (!socket) {
      connect()
    }
    let text: any = null
    DeviceEventEmitter.addListener('request:print', (request) => {
      printForAllPrinters(request.code)
      text = request.code
    })
   

    const intervalId = BackgroundTimer.setInterval(() => {
      if (text) {
        printForAllPrinters(text)
          .then(() => {
            displayNotification()
          })
        text = null
      }
    }, 1000)
  }, [])

  // useEffect(() => {
  //   if (profile) {
  //     DeviceEventEmitter.removeAllListeners('request')
  //     DeviceEventEmitter.addListener('request', async (request) => {
  //       await printRequest(request)
  //     })
  //   }
  // }, [profile, printers])

  useEffect(() => {
    getUser()
      .then(user => {
        if (user && !profile) {
          setProfile(user.profile)
          dispatch(state => {
            const routes = state.routes.filter(r => r.name !== 'auth');

            return CommonActions.reset({
              ...state,
              routes,
              index: routes?.length - 1,
            });
          })
        }
      })

    getLocalPrinters()
      .then(localPrinters => {
        if (localPrinters) {
          setPrinters(localPrinters)
        }
      })
    requestBatteryOp()
  }, [])

  let wsConnectionStyle = ''

  switch (socket?.readyState) {
    case 0:
      wsConnectionStyle = 'bg-yellow-500'
      break;
    case 1:
      wsConnectionStyle = 'bg-green-500'
      break;
    case 2:
      wsConnectionStyle = 'bg-orange-500'
      break;
    case 3:
      wsConnectionStyle = 'bg-red-500'
      break;
  }

  return (
    <View className='flex-1'>
      <View className={`py-6 items-center ${wsConnectionStyle}`}>
        <TextStyled className={`text-zinc-50 text-xl font-bold`}>{socket?.readyState}</TextStyled>
        <Button className='bg-orange-500' onPress={displayNotification}>
          <TextStyled>Notificar</TextStyled>
        </Button>
      </View>
      {/* //   <View className='flex-row justify-evenly items-center w-screen p-4 bg-zinc-200 dark:bg-zinc-800'>
    //     <TouchableOpacity>
    //       <MaterialIcons name='arrow-back' color={colors.green[500]} size={28} onPress={handleGoBack} />
    //     </TouchableOpacity>
    //     <TouchableOpacity>
    //       <MaterialIcons name='arrow-forward' color={colors.green[500]} size={28} onPress={handleGoForward} />
    //     </TouchableOpacity>
    //     <TouchableOpacity>
    //       <MaterialIcons name={isReloading ? 'close' : 'reload'} color={colors.green[500]} size={28} onPress={() => isReloading ? handleStopLoadPage() : handleReloadPage()} />
    //     </TouchableOpacity>
    //   </View> */}
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://whatsmenu-adm-front-git-appprinter-grove-company.vercel.app/' }}
        javaScriptCanOpenWindowsAutomatically={true}
        mediaPlaybackRequiresUserAction={false}
        className='flex-1'
        onScroll={(e) => {
          setOffsetY(e.nativeEvent.contentOffset.y)
        }}
        onTouchMove={() => {
          setCanUpdate(true)
          if (offsetY <= 0) {
            setOffsetY(state => state - 1)
          }
        }}
        onTouchEnd={() => {
          if (offsetY <= -5 && canUpdate) {
            webViewRef.current?.reload()
            setOffsetY(0)
          }
        }}
      />
    </View>
  );
}