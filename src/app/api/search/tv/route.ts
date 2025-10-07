import { NextRequest } from 'next/server';

const TMDB_SEARCH_TV_URL = 'https://api.themoviedb.org/3/search/tv';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Missing required query parameter `q`.' }),
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

  const upstreamUrl = new URL(TMDB_SEARCH_TV_URL);
  upstreamUrl.searchParams.set('query', query);

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Ensure fresh data during dev; TMDB also supports caching headers
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
      JSON.stringify({ error: 'Failed to fetch from TMDB.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
