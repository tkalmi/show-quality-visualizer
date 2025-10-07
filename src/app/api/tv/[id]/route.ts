import { NextRequest } from 'next/server';

const TMDB_TV_DETAILS_URL = (id: string) =>
  `https://api.themoviedb.org/3/tv/${id}`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing TV series id.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server missing TMDB_API_KEY configuration.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const upstreamResponse = await fetch(TMDB_TV_DETAILS_URL(id), {
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
      JSON.stringify({ error: 'Failed to fetch TV show details from TMDB.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
