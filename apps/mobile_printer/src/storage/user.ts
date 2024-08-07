import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER } from "./storageConfig";

export const setUser = async (user: any) => {
  try {
    await AsyncStorage.setItem(USER, JSON.stringify(user))
  } catch (error) {
    throw error
  }
}

export const getUser = async () => {
  try {
    const storage = await AsyncStorage.getItem(USER)
    const user = storage ? JSON.parse(storage) : null
    return user
  } catch (error) {
    throw error
  }
}

export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(USER)
  } catch (error) {
    throw error
  }
}