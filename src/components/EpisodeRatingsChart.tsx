'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useMemo, useRef } from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import {
  useTooltip,
  defaultStyles,
  TooltipWithBounds,
  useTooltipInPortal,
} from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export type SeasonEpisode = {
  season_number: number;
  episode_number: number;
  name: string;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
};

export function EpisodeRatingsChart({
  seriesId,
  totalSeasons,
}: {
  seriesId: string;
  totalSeasons: number;
}) {
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: false,
    detectBounds: true,
  });
  // Fixed tooltip dimensions for reliable in-bounds placement
  const TIP_W = 260;
  const TIP_H = 180;
  const { data: episodes } = useSWR(
    totalSeasons > 0 ? `/api/tv/${seriesId}/chart-seasons` : null,
    async () => {
      const seasonNumbers = Array.from(
        { length: totalSeasons },
        (_, i) => i + 1
      );
      const seasons = await Promise.all(
        seasonNumbers.map((s) =>
          axios.get(`/api/tv/${seriesId}/season/${s}`).then((r) => r.data)
        )
      );
      const eps: SeasonEpisode[] = seasons.flatMap((season: any) =>
        Array.isArray(season.episodes)
          ? season.episodes.map((e: any) => ({
              season_number: season.season_number,
              episode_number: e.episode_number,
              name: e.name,
              still_path: e.still_path,
              vote_average: e.vote_average,
              vote_count: e.vote_count,
            }))
          : []
      );
      eps.sort((a, b) =>
        a.season_number === b.season_number
          ? a.episode_number - b.episode_number
          : a.season_number - b.season_number
      );
      return eps;
    },
    { revalidateOnFocus: false }
  );

  const points = useMemo(() => {
    return (episodes || []).map((e, i) => ({
      index: i,
      rating: typeof e.vote_average === 'number' ? e.vote_average : null,
    }));
  }, [episodes]);

  const averageRating = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;
    const validRatings = episodes
      .map((e) => e.vote_average)
      .filter((rating): rating is number => typeof rating === 'number');
    if (validRatings.length === 0) return null;
    return (
      validRatings.reduce((sum, rating) => sum + rating, 0) /
      validRatings.length
    );
  }, [episodes]);

  const width = 800;
  const height = 280;
  const margin = { top: 16, right: 16, bottom: 36, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(0, points.length - 1)],
        range: [0, innerWidth],
      }),
    [points.length, innerWidth]
  );
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, 10],
        range: [innerHeight, 0],
        nice: false,
      }),
    [innerHeight]
  );

  const seasonStartIndices = useMemo(() => {
    if (!episodes) return [] as { index: number; season: number }[];
    const starts: { index: number; season: number }[] = [];
    let current = -1;
    episodes.forEach((e, idx) => {
      if (e.season_number !== current) {
        current = e.season_number;
        starts.push({ index: idx, season: e.season_number });
      }
    });
    return starts;
  }, [episodes]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  } = useTooltip<{
    index: number;
    episode: SeasonEpisode;
  }>();

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    if (!episodes) return;
    const pt = localPoint(svgRef.current as Element, e);
    if (!pt) return;
    const xVal = pt.x - margin.left;
    const idx = Math.round(xScale.invert(xVal));
    const clamped = Math.max(0, Math.min((episodes.length || 1) - 1, idx));
    const ep = episodes[clamped];

    // Prefer right/above the point with a small offset; use portal's detectBounds to keep on-screen
    const offset = 12;
    const left = pt.x + offset;
    const top = pt.y - offset;

    showTooltip({
      tooltipLeft: left,
      tooltipTop: top,
      tooltipData: { index: clamped, episode: ep },
    });
  }

  return (
    <Card>
      <CardHeader className="font-semibold">Episode Ratings</CardHeader>
      <CardContent ref={containerRef}>
        <svg ref={svgRef} width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              hideTicks
              hideAxisLine
              numTicks={0}
            />
            <AxisLeft scale={yScale} numTicks={5} />
            <text
              x={-20}
              y={innerHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              transform={`rotate(-90, -20, ${innerHeight / 2})`}
            >
              Rating
            </text>

            {seasonStartIndices.map((s) => (
              <g key={`s-${s.season}`}>
                <line
                  x1={xScale(s.index)}
                  x2={xScale(s.index)}
                  y1={0}
                  y2={innerHeight}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                />
                <text
                  x={xScale(s.index)}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  S{s.season}
                </text>
              </g>
            ))}

            {averageRating !== null && (
              <g>
                <line
                  x1={0}
                  x2={innerWidth}
                  y1={yScale(averageRating)}
                  y2={yScale(averageRating)}
                  stroke="red"
                  strokeWidth={1}
                />
                <line
                  x1={0}
                  x2={8}
                  y1={yScale(averageRating)}
                  y2={yScale(averageRating)}
                  stroke="red"
                  strokeWidth={1}
                />
                <text
                  x={12}
                  y={yScale(averageRating) + 16}
                  textAnchor="start"
                  fontSize="10"
                  fill="red"
                >
                  Average episode rating: {averageRating.toFixed(1)}
                </text>
              </g>
            )}

            <LinePath
              data={
                points.filter((p) => p.rating != null) as {
                  index: number;
                  rating: number;
                }[]
              }
              x={(d) => xScale(d.index)}
              y={(d) => yScale(d.rating)}
              stroke="#111827"
              strokeWidth={2}
            />

            <rect
              x={0}
              y={0}
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={hideTooltip}
            />

            {tooltipOpen && tooltipData && (
              <circle
                cx={xScale(tooltipData.index)}
                cy={yScale(tooltipData.episode.vote_average || 0)}
                r={3}
                fill="#111827"
              />
            )}
          </Group>
        </svg>

        {tooltipOpen && tooltipData && (
          <TooltipInPortal
            left={tooltipLeft}
            top={tooltipTop}
            style={{
              ...defaultStyles,
              background: 'white',
              color: 'black',
              width: TIP_W,
              height: TIP_H,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div className="text-sm font-semibold truncate">
              {`S${String(tooltipData.episode.season_number).padStart(
                2,
                '0'
              )}E${String(tooltipData.episode.episode_number).padStart(
                2,
                '0'
              )}`}{' '}
              · {tooltipData.episode.name}
            </div>
            {tooltipData.episode.still_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${tooltipData.episode.still_path}`}
                alt={tooltipData.episode.name}
                className="mt-2 rounded w-full h-28 object-cover"
              />
            ) : null}
            <div className="mt-2 text-sm">
              Rating: {tooltipData.episode.vote_average ?? '—'}
            </div>
          </TooltipInPortal>
        )}
      </CardContent>
    </Card>
  );
}

export default EpisodeRatingsChart;
