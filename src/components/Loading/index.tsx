import React, { ComponentProps } from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
import { TextStyled } from '../TextStyled';
import colors from 'tailwindcss/colors';
export interface LoadingProps extends ComponentProps<typeof ActivityIndicator> {
  show: boolean
  text?: string
}

export const Loading = ({ text = 'Carregando...', show, ...props }: LoadingProps) => {

  if (!show) {
    return <></>
  }

  return (
    <SafeAreaView className='z-10 absolute inset-0 h-screen w-screen backdrop-opacity-50 items-center justify-items-end bg-zinc-950/40 dark:bg-zinc-100/40'>
      <View className='my-auto items-center'>
        <ActivityIndicator color={colors.green[500]} {...props} />
        <TextStyled className='text-3xl font-bold'>{ text }</TextStyled>
      </View>
    </SafeAreaView>
  );
}