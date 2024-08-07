import { useState } from "react";

export default function useLocalStorage<T>(key: string, initialValue: T, storage: "localStorage" | "sessionStorage" = "localStorage") {
  const [storagedValue, setStoragedValue] = useState<T>(() => {
    try {
      const item = window[storage].getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storagedValue) : value
      setStoragedValue(valueToStore)
      window[storage].setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // console.error(error);
    }

  }
  return [storagedValue, setValue] as const
}
