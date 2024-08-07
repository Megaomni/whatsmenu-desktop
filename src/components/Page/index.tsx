import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

export const Page = ({ children, className }: SafeAreaViewProps) => {
  return (
    <SafeAreaView className={`relative flex-1 items-center justify-center h-screen bg-zinc-100 dark:bg-zinc-950 ${className ?? ''}`}>
      {children}
    </SafeAreaView>
  );
}