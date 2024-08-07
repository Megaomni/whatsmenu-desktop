import { useColorScheme } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import colors from 'tailwindcss/colors'
import MaterialIcons from '@expo/vector-icons/Ionicons';
import { Home } from '../screens/Home'
import { Printer } from '../screens/Printer'
import { PrintersConfig } from '../screens/PrintersConfig'
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Auth } from '../screens/Auth';

const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

export const AppRoutes = () => {
  const colorScheme = useColorScheme()

  return (
    // <Tab.Navigator screenOptions={({ route }) => ({
    //   headerShown: false,
    //   tabBarActiveTintColor: colors.green[500],
    //   tabBarStyle: {
    //     backgroundColor: colorScheme === 'dark' ? colors.zinc[800] : colors.zinc[50],
    //     paddingVertical: 8
    //   },
    //   title: route.name === 'home' ? 'Painel' : 'Impressoras',
    //   tabBarIcon: ({ color, size }) => <MaterialIcons name={route.name === 'home' ? 'desktop-outline' : 'print'} size={28} color={color} />
    // })}>
    //   <Tab.Screen name="auth" component={Auth} />
    //   <Tab.Screen name="home" component={Home} />
    //   <Tab.Screen name="printers">
    //     {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" component={Auth} />
            <Stack.Screen name='printers' component={PrintersConfig} />
            <Stack.Screen name='printer' component={Printer} />
          </Stack.Navigator>
//         )}
//       </Tab.Screen>
//     </Tab.Navigator>
  )
}