'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Pagination removed since we render up to 20 results

type TvResult = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  // Pagination state removed

  const { data, isLoading, error } = useQuery(
    '/api/search/tv',
    { q: submitted },
    Boolean(submitted)
  );

  const canSearch = useMemo(
    () => query.trim().length > 0 && !isLoading,
    [query, isLoading]
  );

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
    // reset page would happen here if paginating
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">TV Search</h1>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSearch) handleSearch();
          }}
        />
        <Button onClick={handleSearch} disabled={!canSearch}>
          {isLoading ? 'Searching…' : 'Search'}
        </Button>
      </div>
      {error && (
        <div className="text-red-700 mb-3">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Poster</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-36">First Aired</TableHead>
              <TableHead>Overview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              submitted &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-16 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-52" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-96" />
                      <Skeleton className="h-4 w-80" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              (data?.results || []).map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    {item.poster_path ? (
                      <Link href={`/tv/${item.id}`}>
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={item.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                      </Link>
                    ) : (
                      <Link href={`/tv/${item.id}`}>
                        <div className="w-12 h-16 bg-gray-100 rounded" />
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    <Link href={`/tv/${item.id}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {item.first_air_date || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-block max-w-lg">
                      {item.overview || 'No overview available.'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      {/* pagination controls removed */}
    </main>
  );
}
