import { useState, useCallback } from 'react';
import { parseTCX, ActivityStats, Trackpoint } from '../utils/tcx-parser';
import ActivityMap from '../components/ActivityMap';
import MetricChart from '../components/MetricChart';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles >= 0.05 ? `${miles.toFixed(2)} mi` : `${meters.toFixed(0)} m`;
}

function Stat({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, color: dim ? '#aaa' : '#fff' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export function App() {
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseTCX(ev.target?.result as string);
        setActivity(parsed);
        setCursorIndex(null);
        setError(null);
      } catch (err) {
        setError('Failed to parse TCX file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, []);

  const cursorPoint: Trackpoint | null =
    activity && cursorIndex !== null ? activity.trackpoints[cursorIndex] : null;

  const hasGPS = activity?.trackpoints.some((tp) => tp.lat !== undefined);
  const hasHR = activity?.trackpoints.some((tp) => tp.heartRate !== undefined);
  const hasSpeed = activity?.trackpoints.some((tp) => tp.speed !== undefined);
  const hasAlt = activity?.trackpoints.some((tp) => tp.altitudeMeters !== undefined);
  const totalPoints = activity?.trackpoints.length ?? 0;

  return (
    <div
      style={{
        background: '#0d0d1a',
        minHeight: '100vh',
        color: '#e0e0e0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #1e1e2e',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: '#08080f',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>
          TCX Viewer
        </span>
        <label
          style={{
            cursor: 'pointer',
            background: '#3a7bd5',
            padding: '5px 14px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Load TCX File
          <input type="file" accept=".tcx,.xml" onChange={handleFile} style={{ display: 'none' }} />
        </label>
        {activity && (
          <span style={{ fontSize: 13, color: '#666' }}>
            {activity.sport} · {activity.startTime.toLocaleDateString()} · {totalPoints.toLocaleString()} points
          </span>
        )}
        {error && <span style={{ fontSize: 13, color: '#ff6b6b' }}>{error}</span>}
      </div>

      {/* Empty state */}
      {!activity && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#444',
          }}
        >
          <div style={{ fontSize: 56 }}>🗺️</div>
          <div style={{ fontSize: 15 }}>Load a TCX file to view your activity</div>
          <div style={{ fontSize: 12, color: '#333' }}>Supports GPS track, heart rate, speed, and elevation</div>
        </div>
      )}

      {activity && (
        <>
          {/* Stats bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 28,
              padding: '12px 24px',
              borderBottom: '1px solid #1e1e2e',
              background: '#0a0a14',
              alignItems: 'center',
            }}
          >
            <Stat label="Distance" value={formatDistance(activity.distanceMeters)} />
            <Stat label="Time" value={formatTime(activity.totalTimeSeconds)} />
            {activity.calories > 0 && <Stat label="Calories" value={activity.calories.toLocaleString()} />}
            {activity.avgHR && <Stat label="Avg HR" value={`${activity.avgHR} bpm`} />}
            {activity.maxHR && <Stat label="Max HR" value={`${activity.maxHR} bpm`} />}
            {cursorPoint && (
              <>
                <div style={{ borderLeft: '1px solid #2a2a3e', height: 36, margin: '0 4px' }} />
                <Stat label="Elapsed" value={formatTime(cursorPoint.elapsed)} dim />
                {cursorPoint.heartRate != null && (
                  <Stat label="HR" value={`${cursorPoint.heartRate} bpm`} />
                )}
                {cursorPoint.speed != null && (
                  <Stat label="Speed" value={`${(cursorPoint.speed * 2.237).toFixed(1)} mph`} />
                )}
                {cursorPoint.altitudeMeters != null && (
                  <Stat label="Elevation" value={`${(cursorPoint.altitudeMeters * 3.281).toFixed(0)} ft`} />
                )}
              </>
            )}
          </div>

          {/* Map */}
          {hasGPS && (
            <ActivityMap trackpoints={activity.trackpoints} cursorIndex={cursorIndex} />
          )}

          {/* Time slider */}
          <div style={{ padding: '8px 20px', background: '#0a0a14', borderBottom: '1px solid #1e1e2e' }}>
            <input
              type="range"
              min={0}
              max={totalPoints - 1}
              value={cursorIndex ?? 0}
              onChange={(e) => setCursorIndex(parseInt(e.target.value))}
              onMouseLeave={() => setCursorIndex(null)}
              style={{ width: '100%', accentColor: '#3a7bd5' }}
            />
          </div>

          {/* Charts */}
          <div style={{ flex: 1 }}>
            {hasHR && (
              <MetricChart
                label="Heart Rate"
                color="#e84393"
                trackpoints={activity.trackpoints}
                getValue={(tp) => tp.heartRate ?? null}
                unit="bpm"
                cursorIndex={cursorIndex}
                onCursorChange={setCursorIndex}
              />
            )}
            {hasSpeed && (
              <MetricChart
                label="Speed"
                color="#4fc3f7"
                trackpoints={activity.trackpoints}
                getValue={(tp) => (tp.speed != null ? tp.speed * 2.237 : null)}
                unit="mph"
                cursorIndex={cursorIndex}
                onCursorChange={setCursorIndex}
              />
            )}
            {hasAlt && (
              <MetricChart
                label="Elevation"
                color="#81c784"
                trackpoints={activity.trackpoints}
                getValue={(tp) => (tp.altitudeMeters != null ? tp.altitudeMeters * 3.281 : null)}
                unit="ft"
                cursorIndex={cursorIndex}
                onCursorChange={setCursorIndex}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
