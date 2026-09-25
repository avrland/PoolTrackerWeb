import { useQuery } from '@tanstack/react-query'
import { fetchCurrentData } from '../services/api.js'

export default function useCurrentData({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
    enabled,
  })
  const hasCurrentData = Boolean(query.data?.lastdate)
  const status = hasCurrentData
    ? (query.isError ? 'stale' : 'live')
    : (query.isPending || query.isLoading ? 'loading' : 'unavailable')

  return { ...query, hasCurrentData, status }
}
