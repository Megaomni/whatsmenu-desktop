import { Text, TextProps } from 'react-native';

export const TextStyled = ({ children, className }: TextProps) => {
  return (
    <Text className={`text-zinc-800 dark:text-zinc-50 ${className ?? ''}`}>
      {children}
    </Text>
  );
}