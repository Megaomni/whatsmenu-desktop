import { useState } from 'react';
import { View, Text, ScrollView, useColorScheme, Switch } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

import colors from 'tailwindcss/colors'

import { BluetoothPrinter } from '../hooks/useThermalPrinter';

import { Page } from '../components/Page';
import { TextStyled } from '../components/TextStyled';
import { Button } from '../components/Button';
import { removePrinter, updatePrinter } from '../storage/printers';
import { Input } from '../components/Input';
import { Separator } from '../components/Separator';

type RouteParams = {
  printer: BluetoothPrinter
}

export const Printer = () => {
  const { goBack, navigate } = useNavigation()
  const { params } = useRoute()
  const colorScheme = useColorScheme()

  const [printer, setPrinter] = useState<BluetoothPrinter>((params as RouteParams).printer)

  const radioContainerStyle = {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
  }

  const labelStyle = {
    color: colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800],
    fontSize: 16,
    marginTop: 4,
    marginBottom: 4
  }

  const handleRemovePrinter = async () => {
    await removePrinter(printer.macAddress)
    goBack()
  }

  const handleSavePrinter = async () => {
    await updatePrinter(printer)
    goBack()
  }

  return (
    <Page className='justify-start'>
      <View className='flex-row items-center justify-between bg-zinc-200 dark:bg-zinc-800 p-4 mb-1 w-screen'>
        <View className='flex-row items-center -ml-2'>
          <MaterialIcons color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800]} size={36} name='chevron-left' onPress={goBack} />
          <TextStyled className='text-2xl font-bold'>Impressora</TextStyled>
        </View>
        <Button
          onPress={handleRemovePrinter}
          className='p-2 bg-red-500 flex-row items-center justify-center'
        >
          <MaterialIcons color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800]} size={16} name='delete' />
          <TextStyled className='font-bold ml-2'>Remover</TextStyled>
        </Button>
      </View>
      <ScrollView className='flex-1 px-4 mb-1 w-screen'>
        <TextStyled className='mx-auto my-4 text-lg font-bold'>BT - ({printer.deviceName})</TextStyled>
        <View>
          <TextStyled className='text-base mb-1'>Apelido da Impressora</TextStyled>
          <Input
            className='py-1'
            value={printer.nickname}
            placeholder='Ex: Impressora Caixa, Impressora Cozinha...'
            onChangeText={(text) => setPrinter(state => ({ ...state, nickname: text }))}
          />
        </View>

        <View>
          <TextStyled className='text-base mb-1'>Quantidade de Cópias</TextStyled>
          <Input
            className='py-1'
            keyboardType='numeric'
            defaultValue={String(printer.copies)}
            onChangeText={(text) => {
              if (!!text.length) {
                return setPrinter(state => ({ ...state, copies: text === '0' ? 1 : Number(text) }))
              }
            }}
          />
        </View>

        <View>
          <View className='flex-row items-center justify-between'>
            <TextStyled className={`text-base mb-1 ${printer.disableLine ? 'opacity-40' : ''}`}>Espaçamento Entrelinhas</TextStyled>
            <Switch
              trackColor={{ false: colors.zinc[300], true: colors.green[300] }}
              thumbColor={printer.bold ? colors.green[500] : colors.zinc[50]}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(disableLine) => {
                setPrinter(state => ({ ...state, disableLine: !disableLine }))
              }}
              value={!printer.disableLine}
            />
          </View>
          <Input
            className={`py-1 ${printer.disableLine ? 'opacity-40' : ''}`}
            keyboardType='numeric'
            editable={!printer.disableLine}
            defaultValue={String(printer.lines)}
            onChangeText={(text) => {
              if (!!text.length) {
                return setPrinter(state => ({ ...state, lines: text === '0' ? 1 : Number(text) }))
              }
            }}
          />
        </View>

        <View className='flex-row items-center justify-between '>
          <TextStyled className='text-base mb-2 font-bold'>Negrito</TextStyled>
          <Switch
            trackColor={{ false: colors.zinc[300], true: colors.green[300] }}
            thumbColor={printer.bold ? colors.green[500] : colors.zinc[50]}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => { setPrinter(state => ({ ...state, bold: !state.bold })) }}
            value={printer.bold}
          />
        </View>
        <Separator label='Fonte' />
        <RadioGroup
          radioButtons={[
            {
              id: 'lg',
              label: 'Grande',
              containerStyle: radioContainerStyle,
              labelStyle,
              value: printer.font,
              color: colors.green[500]
            },
            {
              id: 'sm',
              label: 'Pequena',
              containerStyle: radioContainerStyle,
              labelStyle,
              value: printer.font,
              color: colors.green[500]
            }
          ]}
          containerStyle={{
            marginLeft: -8,
          }}
          selectedId={printer.font}
          onPress={(value) => {
            setPrinter(state => ({ ...state, font: value as 'lg' | 'sm' }))
          }}
        />
        <Separator label='Tamanho do Papel' />
        <RadioGroup
          radioButtons={[
            {
              id: '58',
              label: '58mm',
              containerStyle: radioContainerStyle,
              labelStyle,
              value: '58',
              color: colors.green[500]
            },
            {
              id: '80',
              label: ' 80mm',
              containerStyle: radioContainerStyle,
              labelStyle,
              value: '80',
              color: colors.green[500]
            }
          ]}
          containerStyle={{
            marginLeft: -8,
          }}
          selectedId={String(printer.printerWidthMM)}
          onPress={(value) => {
            setPrinter(state => ({ ...state, printerWidthMM: Number(value) as 58 | 80 }))
          }}
        />
        <View className='pb-20 pt-4'>
          <TextStyled className='text-lg font-bold'>Notas:</TextStyled>
          <TextStyled className='text-base'>
            - Impressoras com tarjas vermelhas, podem estar indisponíveis ou com problemas e atrasam outras impressoras.
          </TextStyled>
          <TextStyled className='text-base'>
            - As configurações aqui presentes, podem não funcionar em todas as impressoras.
          </TextStyled>
        </View>
      </ScrollView>
      <View className='absolute p-4 bottom-0 bg-zinc-100 dark:bg-zinc-950 flex-row w-full justify-center items-center mt-2'>
        <Button
          onPress={goBack}
          className='flex-1 bg-red-500'
        >
          <TextStyled className='font-bold'>Cancelar</TextStyled>
        </Button>
        <Button
          onPress={handleSavePrinter}
          className='flex-1 ml-2'
        >
          <TextStyled className='font-bold'>Pronto</TextStyled>
        </Button>
      </View>
    </Page>
  );
}
