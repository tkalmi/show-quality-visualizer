import { NextRequest } from 'next/server';

const TMDB_TV_SEASON_URL = (id: string, seasonNumber: string) =>
  `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;
  if (!id || !seasonNumber) {
    return new Response(
      JSON.stringify({ error: 'Missing tv id or season number.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server missing TMDB_API_KEY configuration.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const upstreamResponse = await fetch(TMDB_TV_SEASON_URL(id, seasonNumber), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const contentType =
      upstreamResponse.headers.get('content-type') || 'application/json';
    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch TV season details from TMDB.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
