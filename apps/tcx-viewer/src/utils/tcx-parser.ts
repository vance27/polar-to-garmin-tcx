export interface Trackpoint {
  time: Date;
  elapsed: number; // seconds from activity start
  lat?: number;
  lng?: number;
  altitudeMeters?: number;
  distanceMeters?: number;
  heartRate?: number;
  speed?: number; // m/s
}

export interface ActivityStats {
  sport: string;
  startTime: Date;
  totalTimeSeconds: number;
  distanceMeters: number;
  calories: number;
  avgHR?: number;
  maxHR?: number;
  trackpoints: Trackpoint[];
}

function getLocalName(el: Element, name: string): string | null {
  // Works with both namespaced and non-namespaced elements
  const found = Array.from(el.getElementsByTagName('*')).find(
    (e) => e.localName === name
  );
  return found?.textContent ?? null;
}

function parseTrackpoint(tp: Element, startTime: Date): Trackpoint {
  const timeText = tp.querySelector('Time')?.textContent ?? '';
  const time = new Date(timeText);
  const elapsed = (time.getTime() - startTime.getTime()) / 1000;

  const latText = getLocalName(tp, 'LatitudeDegrees');
  const lngText = getLocalName(tp, 'LongitudeDegrees');
  const altText = getLocalName(tp, 'AltitudeMeters');
  const distText = getLocalName(tp, 'DistanceMeters');
  const hrText = getLocalName(tp, 'Value');
  const speedText = getLocalName(tp, 'Speed');

  return {
    time,
    elapsed,
    lat: latText ? parseFloat(latText) : undefined,
    lng: lngText ? parseFloat(lngText) : undefined,
    altitudeMeters: altText ? parseFloat(altText) : undefined,
    distanceMeters: distText ? parseFloat(distText) : undefined,
    heartRate: hrText ? parseInt(hrText) : undefined,
    speed: speedText ? parseFloat(speedText) : undefined,
  };
}

export function parseTCX(xmlText: string): ActivityStats {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid XML: ' + parseError.textContent);

  const activity = doc.querySelector('Activity');
  const sport = activity?.getAttribute('Sport') ?? 'Unknown';

  const idText = doc.querySelector('Id')?.textContent ?? '';
  const startTime = new Date(idText);

  // Aggregate across all laps
  let totalTime = 0;
  let totalDistance = 0;
  let totalCalories = 0;
  let avgHR: number | undefined;
  let maxHR: number | undefined;

  const laps = Array.from(doc.querySelectorAll('Lap'));
  laps.forEach((lap) => {
    totalTime += parseFloat(lap.querySelector('TotalTimeSeconds')?.textContent ?? '0');
    totalDistance += parseFloat(lap.querySelector('DistanceMeters')?.textContent ?? '0');
    totalCalories += parseInt(lap.querySelector('Calories')?.textContent ?? '0');
  });

  const avgHRText = doc.querySelector('AverageHeartRateBpm Value')?.textContent;
  const maxHRText = doc.querySelector('MaximumHeartRateBpm Value')?.textContent;
  if (avgHRText) avgHR = parseInt(avgHRText);
  if (maxHRText) maxHR = parseInt(maxHRText);

  const tpEls = Array.from(doc.querySelectorAll('Trackpoint'));
  const trackpoints = tpEls
    .filter((tp) => tp.querySelector('Time')?.textContent)
    .map((tp) => parseTrackpoint(tp, startTime));

  return {
    sport,
    startTime,
    totalTimeSeconds: totalTime,
    distanceMeters: totalDistance,
    calories: totalCalories,
    avgHR,
    maxHR,
    trackpoints,
  };
}
