import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trackpoint } from '../utils/tcx-parser';

interface Props {
  trackpoints: Trackpoint[];
  cursorIndex: number | null;
}

export default function ActivityMap({ trackpoints, cursorIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const cursorMarkerRef = useRef<L.CircleMarker | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const endMarkerRef = useRef<L.CircleMarker | null>(null);

  const gpsPoints = trackpoints.filter(
    (tp): tp is Trackpoint & { lat: number; lng: number } =>
      tp.lat !== undefined && tp.lng !== undefined
  );

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw track when gpsPoints change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || gpsPoints.length === 0) return;

    polylineRef.current?.remove();
    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();

    const latlngs = gpsPoints.map((tp) => [tp.lat, tp.lng] as [number, number]);

    polylineRef.current = L.polyline(latlngs, {
      color: '#e84393',
      weight: 3,
      opacity: 0.85,
    }).addTo(map);

    startMarkerRef.current = L.circleMarker(latlngs[0], {
      radius: 8,
      color: '#fff',
      fillColor: '#4caf50',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    endMarkerRef.current = L.circleMarker(latlngs[latlngs.length - 1], {
      radius: 8,
      color: '#fff',
      fillColor: '#f44336',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] });
  }, [gpsPoints.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update cursor marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    cursorMarkerRef.current?.remove();

    if (cursorIndex !== null) {
      const tp = trackpoints[cursorIndex];
      if (tp.lat !== undefined && tp.lng !== undefined) {
        cursorMarkerRef.current = L.circleMarker([tp.lat, tp.lng], {
          radius: 7,
          color: '#fff',
          fillColor: '#fff',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map);
      }
    }
  }, [cursorIndex, trackpoints]);

  return <div ref={containerRef} style={{ height: 380, width: '100%' }} />;
}
