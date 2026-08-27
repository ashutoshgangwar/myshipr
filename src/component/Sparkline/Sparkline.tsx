import React from 'react';
import Svg, {Circle, Polyline} from 'react-native-svg';

/**
 * Tiny inline line chart for the dashboard stat cards.
 * `data` is a plain array of numbers (any scale) — it is normalized to fit.
 * A faint dotted grid sits behind the line, with a dot on each data point,
 * matching the Home dashboard design.
 */
export interface SparklineProps {
  /** Fewer than two points renders nothing. */
  data?: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  gridColor?: string;
  showGrid?: boolean;
  showDots?: boolean;
}

const Sparkline = ({
  data,
  color,
  width = 110,
  height = 44,
  strokeWidth = 2,
  gridColor = 'rgba(148,163,184,0.35)',
  showGrid = true,
  showDots = true,
}: SparklineProps) => {
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  const pad = strokeWidth + 2;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const stepX = usableW / (data.length - 1);

  const coords = data.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (d - min) / span) * usableH,
  }));

  const points = coords.map(c => `${c.x},${c.y}`).join(' ');

  // Light dotted grid: a few evenly spaced rows/cols of small dots.
  const gridCols = Math.min(data.length, 8);
  const gridRows = 4;
  const gridDots = [];
  if (showGrid) {
    for (let r = 0; r < gridRows; r += 1) {
      for (let c = 0; c < gridCols; c += 1) {
        gridDots.push({
          x: pad + (usableW * c) / (gridCols - 1),
          y: pad + (usableH * r) / (gridRows - 1),
          key: `g-${r}-${c}`,
        });
      }
    }
  }

  return (
    <Svg width={width} height={height}>
      {gridDots.map(g => (
        <Circle key={g.key} cx={g.x} cy={g.y} r={0.9} fill={gridColor} />
      ))}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        coords.map((c, i) => (
          <Circle key={`d-${i}`} cx={c.x} cy={c.y} r={strokeWidth} fill={color} />
        ))}
    </Svg>
  );
};

export default Sparkline;
