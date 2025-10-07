'use client';

import useSWR from 'swr';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Params = { params: { id: string } };

type TvDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  genres?: { id: number; name: string }[];
};

const fetcher = (url: string) =>
  axios.get(url).then((r) => r.data as TvDetails);

export default function TvDetailsPage({ params }: Params) {
  const { id } = params;
  const { data, isLoading, error } = useSWR(`/api/tv/${id}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex gap-6">
          <Skeleton className="w-32 h-44 rounded" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-red-700">Failed to load TV show details.</div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <div className="text-gray-600">
          {data.first_air_date ? `First aired: ${data.first_air_date}` : null}
          {typeof data.vote_average === 'number' ? (
            <span className="ml-3">Rating: {data.vote_average.toFixed(1)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex gap-6">
        {data.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${data.poster_path}`}
            alt={data.name}
            className="w-40 h-56 object-cover rounded"
          />
        ) : (
          <div className="w-40 h-56 bg-gray-100 rounded" />
        )}

        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader className="font-semibold">Overview</CardHeader>
            <CardContent>
              <p className="text-gray-800">
                {data.overview || 'No overview available.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Details</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Seasons: </span>
                  <span>{data.number_of_seasons ?? '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Episodes: </span>
                  <span>{data.number_of_episodes ?? '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Genres: </span>
                  <span>
                    {data.genres && data.genres.length > 0
                      ? data.genres.map((g) => g.name).join(', ')
                      : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
