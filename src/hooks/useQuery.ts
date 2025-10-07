import useSWR from 'swr';
import axios from 'axios';

export type TvResult = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
};

type TvSearchResponse = {
  page?: number;
  results?: TvResult[];
  total_pages?: number;
  total_results?: number;
};

const fetcher = (url: string) =>
  axios.get(url).then((r) => r.data as TvSearchResponse);

export function useQuery(
  path: string,
  queryParams: Record<string, string>,
  enabled: boolean = true
) {
  // Remove params that are empty strings to avoid accidental requests
  const filtered = Object.fromEntries(
    Object.entries(queryParams).filter(
      ([, v]) => v != null && String(v).trim() !== ''
    )
  );
  const queryString = new URLSearchParams(filtered).toString();
  const key = enabled && queryString ? `${path}?${queryString}` : null;
  const swr = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache for 1 minute
    keepPreviousData: true, // Keep previous data while loading new data
  });

  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error,
  };
}
