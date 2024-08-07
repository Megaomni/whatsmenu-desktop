import { Routes } from './src/routes';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-100 dark:bg-zinc-950">
      <StatusBar />
      <Routes />
    </SafeAreaView>
  );
}