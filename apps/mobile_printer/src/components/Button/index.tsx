import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

export const Button = ({ className, ...rest }: TouchableOpacityProps) => {
  return (
    <TouchableOpacity
      className={`bg-green-500 p-4 rounded-md items-center justify-evenly flex-row ${rest.disabled ? 'opacity-60' : 'opacity-1'} ${className ?? ''}`}
      {...rest}
    />
  );
}

export default Button;