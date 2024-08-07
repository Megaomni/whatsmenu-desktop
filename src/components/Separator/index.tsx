import { View } from 'react-native';
import { TextStyled } from '../TextStyled';
import { ViewProps } from 'react-native';

type SeparatorProps = ViewProps & {
  label?: string
}

export const Separator = ({ label, ...rest }: SeparatorProps) => {
  return (
    <View className='relative border border-zinc-500 my-4' {...rest}>
      {label && <TextStyled className='absolute bg-green-500 rounded p-1 px-2 -top-4 -left-1'>{label}</TextStyled>}
    </View>
  )
}