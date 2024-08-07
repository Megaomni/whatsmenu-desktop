import AsyncStorage from "@react-native-async-storage/async-storage";
import { REQUEST } from "./storageConfig";
import { DataPrintType } from "../@types/data-print.type";

export interface SetDataPrintType extends DataPrintType {
    printersIds: number[]
}

export const setRequestNotPrint = async (request: SetDataPrintType) => {
    try {
        let requests = await getRequestsNotPrint()
        let alReadyExists = requests.findIndex(r => r.requestId === request.requestId)

        if (alReadyExists === -1) {
            requests.push(request)
        } else {
            requests[alReadyExists] = request
            if (!requests[alReadyExists].printersIds.length) {
               requests = await removeRequestNotPrint(request)
            }
        }
        
        await AsyncStorage.setItem(REQUEST, JSON.stringify(requests))
        return await getRequestsNotPrint()

    } catch (error) {
        throw error
    }
}

export const getRequestsNotPrint = async () => {
    try {
        const getRequests = await AsyncStorage.getItem(REQUEST)
        const getSaveRequests: SetDataPrintType[] = getRequests ? JSON.parse(getRequests) : [];
        return getSaveRequests
    } catch (error) {
        throw error
    }
}

export const removeRequestNotPrint = async (request: DataPrintType) => {
    try {
        const requests = await getRequestsNotPrint()
        const removeRequestPrints = requests.filter(r => r.requestId !== request.requestId)
        await AsyncStorage.setItem(REQUEST, JSON.stringify(removeRequestPrints))
        return await getRequestsNotPrint()
    } catch (error) {
        throw error
    }
}

export const clearRequestsNotPrint = async () => {
    await AsyncStorage.setItem(REQUEST, JSON.stringify([]))
}