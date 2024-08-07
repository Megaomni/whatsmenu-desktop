import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { DeviceEventEmitter } from 'react-native';

const TASK_NAME = 'PRINT_WEBSOCKETS'
TaskManager.defineTask(TASK_NAME, async () => {
  DeviceEventEmitter.emit('background-pong', new Date().toISOString())
  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
})

const registerTaskWebSocket = () => {
  return BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 1,
    stopOnTerminate: false,
    startOnBoot: true,
  })
}

export {
  registerTaskWebSocket
}