import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, DeviceEventEmitter, ScrollView, TouchableOpacity, View, useColorScheme } from 'react-native';

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import colors from 'tailwindcss/colors';

import { BluetoothPrinter, useThermalPrinter } from '../hooks/useThermalPrinter';
import { useWebSocket } from '../hooks/useWebSocket';
import { removeUser } from '../storage/user';

import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import BackgroundTimer from 'react-native-background-timer';
import { BatteryOptEnabled, RequestDisableOptimization } from "react-native-battery-optimization-check";
import { BleManager } from 'react-native-ble-plx';
import { Button } from '../components/Button';
import { DevicesModal } from '../components/DevicesModal';
import { Loading } from '../components/Loading';
import { Page } from '../components/Page';
import { TextStyled } from '../components/TextStyled';
import { getLocalPrinters, setLocalPrinters } from '../storage/printers';
import { SetDataPrintType, getRequestsNotPrint, setRequestNotPrint } from '../storage/request';


export const PrintersConfig = () => {
  const { navigate, dispatch } = useNavigation()
  const { params } = useRoute()
  const { user } = params as { user: any }
  const { devices, print, getDevices } = useThermalPrinter()
  const colorScheme = useColorScheme()
  const bleManager = useMemo(() => new BleManager(), []);

  const [profile, setProfile] = useState<any>()
  const [printers, setPrinters] = useState<BluetoothPrinter[]>([])
  const [showDevices, setShowDevices] = useState(false)
  const [sound, setSound] = useState<Audio.Sound>()
  const [wsStatus, setWsStatus] = useState<{
    statusText: 'Conectando...' | 'Conectado' | 'Desconectando...' | 'Desconectado',
    color: string,
  }>({ statusText: 'Conectando...', color: colors.yellow[500] })
  const [loading, setLoading] = useState<{ show: boolean, text?: string }>({ show: false })
  const [lostRequests, setLostRequests] = useState<SetDataPrintType[]>([])
  const [backgroundInti, setBackgroundInit] = useState(false)

  const playSound = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false
    });

    const { sound } = await Audio.Sound.createAsync(require('../../audio/pedido.mp3'))
    setSound(sound)
    await sound.playAsync()
  }

  const displayNotification = async (type: 'request' | 'ws:disconnected' | 'ws:connected' = 'request') => {
    await notifee.requestPermission()

    const channelId = await notifee.createChannel({
      id: 'app',
      name: 'requests',
      vibration: true,
      importance: AndroidImportance.HIGH
    })

    switch (type) {
      case 'request': {
        await notifee.cancelAllNotifications(['connected'])
        await notifee.displayNotification({
          id: 'request',
          title: 'Olha o pedido, WhatsMenu!',
          body: 'Chegou pedido pra impressão.',
          android: { channelId }
        })
        break;
      }
      case 'ws:disconnected': {
        await notifee.cancelAllNotifications(['connected'])
        await notifee.displayNotification({
          id: 'disconnected',
          title: 'Desconectado!',
          body: 'Sua conexão com o servidor de impressões foi perdida.',
          android: { channelId }
        })
        break;
      }
      case 'ws:connected': {
        await notifee.cancelAllNotifications(['disconnected'])
        await notifee.displayNotification({
          id: 'connected',
          title: 'Conectado!',
          body: 'Conectado com sucesso com o servidor de impressões.',
          android: { channelId }
        })
        break;
      }
    }
  }
  const { socket, connect } = useWebSocket({ ...profile, next: user.next }, { onClose: async () => { await displayNotification('ws:disconnected') }, onConnected: async () => { await displayNotification('ws:connected') } })

  const printerConfig = (printer: BluetoothPrinter) => {
    navigate('printer', { printer })
  }

  const printForAllPrinters = useCallback(async (data: any, test = false) => {
    data = { ...data, printersIds: [] }
    setLoading({ text: 'Imprimindo...', show: true })
    try {
      const printers = await getLocalPrinters()
      if (printers.length) {
        for (const printer of printers) {
          try {
            await print(data, printer)
            printer.error = false
            successesFullPrint(data.requestId)
          } catch (error) {
            data.printersIds.push(printer.id)
            printer.error = true
            console.error(error);
          } finally {
            await setLocalPrinters(printers)
          }
        }
        if (printers.some(printer => printer.error) && !test) {
          const updatedLostRequests = await setRequestNotPrint(data)
          setLostRequests(updatedLostRequests)
        }
      } else {
        await setRequestNotPrint(data)
        setLoading({ text: undefined, show: false })
        throw new Error('Nenhuma impressora disponível')
      }
    } catch (error) {
      throw error
    } finally {
      setLoading({ text: undefined, show: false })
    }
  }, [socket])

  const showBluetoothAlert = () => {
    Alert.alert(
      'Bluetooth Desativado',
      'As impressões automáticas não funcionaram',
      [
        {
          text: 'Deixar desativado',
          style: 'cancel',
        },
        {
          text: 'Ativar',
          onPress: async () => {
            await bleManager.enable()
            await getDevices()
          },
          style: 'default',
        },
      ],
      {
        cancelable: true,
      },
    );
  }

  // AUTH
  const handleLogOff = async () => {
    try {
      setLoading(state => ({ text: 'Saindo...', show: true }))
      Alert.alert(
        'Tem certeza que deseja sair?',
        '',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Sair',
            onPress: async () => {
              await removeUser()
              socket?.close(1000, 'logoff')
              setProfile(null)
              navigate('auth')
            },
          },
        ]
      )
    } catch (error) {
      Alert.alert('Ops!', 'Não foi possível deslogar')
      console.error(error);
    } finally {
      setLoading(state => ({ text: undefined, show: false }))
    }
  }

  const successesFullPrint = useCallback((requestId: number) => {
    socket?.send(JSON.stringify({
      t: 7,
      d: {
        event: 'sucessesFullPrinting',
        data: {
          requestId
        },
        topic: `print:${profile?.slug}`
      }
    }))
  }, [socket])

  useEffect(() => {
    if (user && !profile) {
      setProfile(user.profile)
      connect()
      dispatch(state => {
        const routes = state.routes.filter(r => r.name !== 'auth');

        return CommonActions.reset({
          ...state,
          routes,
          index: routes?.length - 1,
        });
      })
    }
  }, [user])

  useEffect(() => {
    // BATTERY
    BatteryOptEnabled().then((isEnabled: boolean) => {
      if (isEnabled) {
        RequestDisableOptimization();
      }
    });

    // BLUETOOTH
    bleManager.state()
      .then(state => {
        if (state === 'PoweredOff') {
          showBluetoothAlert()
        }
      })
      .catch(console.error)
    bleManager.onStateChange((state) => {
      if (state === 'PoweredOff') {
        showBluetoothAlert()
      }
    })
    getLocalPrinters()
      .then(localPrinters => {
        if (localPrinters) {
          setPrinters(localPrinters)
        }
      })
  }, [])

  useEffect(() => {
    if (!backgroundInti) {
      DeviceEventEmitter.removeAllListeners('request:print')
      DeviceEventEmitter.removeAllListeners('request:directPrint')
      let request: { 58: string, 80: string, requestId: number } | null = null
      DeviceEventEmitter.addListener('request:print', async (requestData) => {
        displayNotification()
        if (requestData[58] || requestData[80]) {
          await playSound()
          request = requestData
        }
      })
      DeviceEventEmitter.addListener('request:directPrint', (requestData) => {
        request = requestData
      })

      DeviceEventEmitter.addListener('printers:updated', (localPrinters: BluetoothPrinter[]) => {
        setPrinters([...localPrinters])
      })

      BackgroundTimer.setInterval(() => {
        if (request) {
          printForAllPrinters(request)
          request = null
        }
      }, 500)

    }
  }, [socket])

  useEffect(() => {
    if (socket) {
      switch (socket.readyState) {
        case 0:
          setWsStatus({ statusText: 'Conectando...', color: colors.yellow[500] })
          break;
        case 1:
          setWsStatus({ statusText: 'Conectado', color: colors.green[500] })
          break;
        case 2:
          setWsStatus({ statusText: 'Desconectando...', color: colors.orange[500] })
          break;
        case 3:
          setWsStatus({ statusText: 'Desconectado', color: colors.red[500] })
          break;
      }
      setBackgroundInit(true)
    }
  }, [socket?.readyState])

  // NOTIFICATIONS
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          if (detail.notification?.id === 'disconnected') {
            // connect()
          }
          break;
        case EventType.DISMISSED:
          break;
      }
    })
  }, [])

  useEffect(() => {
    return notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        if (detail.notification?.id === 'disconnected') {
          // connect()
        }
      }
    })
  }, [])

  // SOUND
  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync()
      }
      : undefined
  }, [sound])

  useEffect(() => {
    getRequestsNotPrint().then(requests => {
      setLostRequests(requests)
    })
  }, [])

  return (
    <Page className='justify-start relative'>
      <View className='bg-zinc-200 dark:bg-zinc-800 p-4 mb-1 w-screen'>
        <TextStyled className='text-2xl font-bold'>Configurações</TextStyled>
      </View>
      <View className='bg-zinc-200 dark:bg-zinc-800 p-4 w-screen flex-row gap-x-2 mt-2 items-center justify-center'>
        <Button
          onPress={async () => {
            if (printers.length) {
              await printForAllPrinters({ 58: '[C]WHATSMENU IMPRESSORA\n\n', 80: '[C]WHATSMENU IMPRESSORA\n\n', test: true })
            } else {
              Alert.alert('Ops!', 'Nenhuma impressora selecionada')
            }
          }}
        >
          <TextStyled>Testar Impressão</TextStyled>
        </Button>
        <Button
          onPress={async () => {
            await getDevices()
            setShowDevices(true)
          }}
        >
          <TextStyled>Selecionar Impressoras</TextStyled>
        </Button>
      </View>
      <View className='w-screen p-4 flex-1 items-start justify-start'>
        <View className='w-full flex-row items-center mb-1 justify-between'>
          <TextStyled className='font-bold'>Servidor de Impressões:</TextStyled>
          <View className='flex-row items-center gap-x-2'>
            <View className={`flex-row items-center gap-x-4 py-1 px-2 rounded-lg`} style={{ backgroundColor: `${wsStatus.color}66` }}>
              <TextStyled>
                {wsStatus.statusText}
              </TextStyled>
              <View className={`p-2 rounded-full`} style={{ backgroundColor: wsStatus.color }} />
            </View>
            {wsStatus.statusText === 'Desconectado' && (
              <TouchableOpacity className='px-2' onPress={() => { connect() }}>
                <MaterialCommunityIcons name='reload' size={20} color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[950]} onPress={connect} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TextStyled className='font-bold text-2xl mb-4'>Impressoras:</TextStyled>
        {!printers.length ? (
          <View className='flex-1 w-full items-center justify-center'>
            <MaterialCommunityIcons name='printer-off-outline' size={72} color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[950]} />
            <TextStyled className='font-bold text-2xl text-center mt-2'>Nenhuma impressora selecionada</TextStyled>
          </View>) : (
          <ScrollView className='w-full'>
            {
              printers.map(printer => (
                <View className={`flex-row items-center justify-between p-2 ${printer.error ? 'bg-red-500/30 border border-red-500' : ''}`} key={printer.deviceName}>
                  <View className='flex-row items-center justify-between'>
                    {printer.error && (
                      <View className='mr-4'>
                        <MaterialIcons name='error' size={22} color={colors.red[500]} />
                      </View>
                    )}
                    <TextStyled className='text-lg basis-3/5'>{printer.deviceName} {printer.nickname && `- (${printer.nickname})`}</TextStyled>
                  </View>
                  <View className='flex-row flex-1 gap-1 justify-end'>
                    {lostRequests.flatMap(r => r.printersIds).some(id => id === printer.id) &&
                      <Button
                        className='bg-yellow-500'
                        onPress={() => {
                          Alert.alert(
                            'Impressões pendentes!',
                            `Não foi possivel enviar uma ou mais impressões para ${printer.nickname || printer.deviceName}, verifique se a impressora está desligada ou fora de alcance, e tente novamente.`,
                            [
                              {
                                text: 'Cancelar',
                                style: 'cancel'
                              },
                              {
                                text: 'Não imprimir',
                                onPress: async () => {
                                  for (const data of lostRequests) {
                                    try {
                                      const updatedLostRequests = await setRequestNotPrint({ ...data, printersIds: data.printersIds.filter(id => id !== printer.id) })
                                      setLostRequests(updatedLostRequests)
                                      successesFullPrint(data.requestId)
                                    } catch (error) {
                                      throw error
                                    }
                                  }
                                },
                              },
                              {
                                text: 'Imprimir todas',
                                onPress: async () => {
                                  for (const data of lostRequests) {
                                    if (data.printersIds.includes(printer.id)) {
                                      setLoading({ show: true, text: "Reimprimindo" })
                                      try {
                                        await print(data, printer)
                                        successesFullPrint(data.requestId)
                                        const updatedLostRequests = await setRequestNotPrint({ ...data, printersIds: data.printersIds.filter(id => id !== printer.id) })
                                        setLostRequests(updatedLostRequests)
                                        const printerToUpdateIndex = printers.findIndex(p => p.id === printer.id)
                                        if (printerToUpdateIndex !== -1) {
                                          printers[printerToUpdateIndex].error = false
                                          setLocalPrinters(printers)
                                        }
                                      } catch (error) {
                                        throw error
                                      }
                                    }
                                  }
                                  setLoading({ show: false, text: undefined })
                                },
                                style: 'default'
                              }
                            ]
                          )
                        }}>
                        <MaterialCommunityIcons className="basis-2/5" name="printer-alert" size={16} color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800]} ></MaterialCommunityIcons>
                        <TextStyled className='absolute -top-1.5 right-0 w-5 h-5 items-center text-center rounded-full justify-center bg-red-500'>
                          {lostRequests.flatMap(r => r.printersIds).some(id => id === printer.id) ? lostRequests.filter(r => r.printersIds.includes(printer.id)).length : ''}
                        </TextStyled>
                      </Button>
                    }
                    <Button
                      onPress={() => printerConfig(printer)}
                    >
                      <MaterialIcons className="basis-2/5" name="settings" size={16} color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800]} ></MaterialIcons>
                    </Button>
                  </View>
                </View>
              ))}
          </ScrollView>
        )}
      </View>
      <Button
        className='w-screen absolute bottom-0'
        onPress={handleLogOff}
      >
        <TextStyled>Deslogar</TextStyled>
      </Button>

      <DevicesModal
        show={showDevices}
        devices={devices}
        printers={printers}
        cancel={() => setShowDevices(false)}
        confirm={() => setShowDevices(false)}
        onConfirm={async (selectedPrinters) => {
          setLoading({ text: 'Atualizando', show: true })
          try {
            await setLocalPrinters(selectedPrinters)
          } catch (error) {
            Alert.alert('Ops!', 'Não foi possível atualizar as impressoras')
          } finally {
            setLoading({ text: undefined, show: false })
          }
        }}
      />
      <Loading show={loading.show} text={loading.text} size='large' />
    </Page>
  );
}