import axios, { AxiosInstance, AxiosResponse } from 'axios'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { api, apiV2 } from 'src/lib/axios'

export function useFetch<T>(route: string, { api3 = false }: { api3?: boolean; condition?: boolean } = {}) {
  const { data: session } = useSession()
  let apiCallback: AxiosInstance
  if (api3) {
    api.defaults.headers.common.Authorization = `Bearer ${session?.user?.v3Token}`
    apiCallback = api
  } else {
    apiV2.defaults.headers.common.Authorization = `Bearer ${session?.accessToken}`
    apiCallback = apiV2
  }

  const { data, ...swr } = useSWR<AxiosResponse<T, T>, string>(route, apiCallback, { revalidateOnFocus: false, shouldRetryOnError: false })
  return {
    ...swr,
    status: data?.status,
    data: data?.data,
  }
}
