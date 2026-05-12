import { useRef, useCallback, useMemo } from 'react';
import { Trackpoint } from '../utils/tcx-parser';

interface Props {
  label: string;
  color: string;
  trackpoints: Trackpoint[];
  getValue: (tp: Trackpoint) => number | null;
  unit: string;
  cursorIndex: number | null;
  onCursorChange: (index: number | null) => void;
}

const W = 1000;
const H = 80;
const PAD = { top: 6, bottom: 18, left: 38, right: 6 };

export default function MetricChart({
  label,
  color,
  trackpoints,
  getValue,
  unit,
  cursorIndex,
  onCursorChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => {
    return trackpoints
      .map((tp, i) => ({ i, elapsed: tp.elapsed, value: getValue(tp) }))
      .filter((d): d is { i: number; elapsed: number; value: number } => d.value !== null);
  }, [trackpoints, getValue]);

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const { minVal, maxVal, totalElapsed } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 1, totalElapsed: 1 };
    const vals = data.map((d) => d.value);
    return {
      minVal: Math.min(...vals),
      maxVal: Math.max(...vals),
      totalElapsed: data[data.length - 1].elapsed || 1,
    };
  }, [data]);

  const xScale = useCallback(
    (elapsed: number) => (elapsed / totalElapsed) * chartW + PAD.left,
    [chartW, totalElapsed]
  );
  const yScale = useCallback(
    (val: number) => {
      const range = maxVal - minVal || 1;
      return PAD.top + chartH - ((val - minVal) / range) * chartH;
    },
    [chartH, minVal, maxVal]
  );

  const pathD = useMemo(
    () =>
      data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.elapsed).toFixed(1)},${yScale(d.value).toFixed(1)}`)
        .join(' '),
    [data, xScale, yScale]
  );

  const areaD = useMemo(() => {
    if (!pathD) return '';
    const bottom = (PAD.top + chartH).toFixed(1);
    return `${pathD} L${xScale(totalElapsed).toFixed(1)},${bottom} L${PAD.left.toFixed(1)},${bottom} Z`;
  }, [pathD, chartH, xScale, totalElapsed]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const elapsed = ((x - PAD.left) / chartW) * totalElapsed;
      let closest = 0;
      let minDiff = Infinity;
      trackpoints.forEach((tp, i) => {
        const diff = Math.abs(tp.elapsed - elapsed);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      });
      onCursorChange(closest);
    },
    [trackpoints, chartW, totalElapsed, onCursorChange]
  );

  const handleMouseLeave = useCallback(() => onCursorChange(null), [onCursorChange]);

  if (data.length === 0) return null;

  const cursorElapsed = cursorIndex !== null ? trackpoints[cursorIndex].elapsed : null;
  const cursorX = cursorElapsed !== null ? xScale(cursorElapsed) : null;
  const cursorVal =
    cursorIndex !== null ? getValue(trackpoints[cursorIndex]) : null;

  const ticks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div style={{ borderBottom: '1px solid #1e1e2e', background: '#0d0d1a' }}>
      <div style={{ padding: '6px 12px 0', fontSize: 12, color, fontWeight: 600, display: 'flex', gap: 12 }}>
        <span>● {label}</span>
        {cursorVal !== null && (
          <span style={{ color: '#ccc', fontWeight: 400 }}>
            {cursorVal.toFixed(0)} {unit}
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 90, cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis labels */}
        {ticks.map((v) => (
          <text
            key={v}
            x={PAD.left - 4}
            y={yScale(v) + 4}
            textAnchor="end"
            fontSize={8}
            fill="#555"
          >
            {v.toFixed(0)}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity={0.15} stroke="none" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />

        {/* Cursor line */}
        {cursorX !== null && (
          <line
            x1={cursorX}
            y1={PAD.top}
            x2={cursorX}
            y2={PAD.top + chartH}
            stroke="#ffffff"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
        )}
      </svg>
    </div>
  );
}
