import { useEffect, useState } from 'react'

interface InfiniteScrollProps {
  callback: (params?: any) => Promise<void>
}

type useInfiniteScrollData = { isFetching: boolean }

export const useInfiniteScroll = ({
  callback,
}: InfiniteScrollProps): useInfiniteScrollData => {
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (
        document.documentElement.scrollHeight -
          window.innerHeight -
          document.documentElement.scrollTop <
          5 &&
        !isFetching
      ) {
        setIsFetching(true)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isFetching])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await callback()
      } finally {
        setIsFetching(false)
      }
    }
    if (isFetching) {
      fetchData()
    }
  }, [isFetching, callback])

  return { isFetching }
}
