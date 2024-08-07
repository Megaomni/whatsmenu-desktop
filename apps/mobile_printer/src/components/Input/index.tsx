import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View, useColorScheme } from 'react-native';
import colors from 'tailwindcss/colors'

export interface InputProps extends TextInputProps {
  type?: 'password' | 'normal'
}

export const Input = ({ className, type = 'normal', secureTextEntry, ...rest }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const colorScheme = useColorScheme()
  return (
    <View className='relative flex-row items-center mb-4'>
      <TextInput secureTextEntry={type === 'password' && !showPassword} placeholderTextColor={colorScheme === 'dark' ? colors.zinc[400] : colors.zinc[400]} className={`flex-1 p-4 border border-zinc-500 rounded focus:border-green-500 text-zinc-600 bg-zinc-200 dark:text-zinc-50 dark:bg-zinc-800 ${className ?? ''}`}  {...rest} />
      {type === 'password' &&
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: 'absolute', right: 0 }} className='p-4' >
          <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colorScheme === 'dark' ? colors.zinc[50] : colors.zinc[800]} />
        </TouchableOpacity>}
    </View>
  );
}