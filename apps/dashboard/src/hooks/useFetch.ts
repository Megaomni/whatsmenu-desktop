import axios, { AxiosResponse } from 'axios'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'

export function useFetch<T>(route: string) {
  const { data: session } = useSession()

  const api = axios.create({
    baseURL: process.env.WHATSMENU_API,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.accessToken}`,
    },
  })

  const { data, ...swr } = useSWR<AxiosResponse<T, T>, string>(route, api, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return {
    ...swr,
    status: data?.status,
    data: data?.data,
  }
}
