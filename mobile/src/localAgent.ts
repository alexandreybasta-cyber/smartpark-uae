// Offline agent fallback — same intents and composite scoring as
// backend/agent.py, computed from the CURRENT simulated state (never
// hardcoded numbers). Used only when the backend is unreachable.
import { AgentResponse, SavedPlace, Spot, Zone, DEMO_LOCATION } from './types';
import { generatePredictions, targetOccupancy, dubaiHourNow } from './seed';

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  const parkWords = t.includes('park') || t.includes('spot') || t.includes('space');
  const locWords = ['near', 'find', 'where', 'available', 'closest', 'work', 'home', 'gym'].some((w) => t.includes(w));
  if (parkWords && locWords) return 'find_parking';
  if (['predict', 'will there be', 'forecast', 'expect', 'busy', 'later'].some((w) => t.includes(w))) return 'predict';
  if ((t.includes('compare') || t.includes('which')) && ['most', 'best', 'cheapest'].some((w) => t.includes(w))) return 'compare';
  if (['navigate', 'take me', 'directions', 'route'].some((w) => t.includes(w))) return 'navigate';
  if (t.includes('pay')) return 'pay';
  return 'general';
}

function zoneCenter(zone: Zone, spots: Spot[]): { lat: number; lng: number } {
  const zs = spots.filter((s) => s.zone_id === zone.id);
  if (zs.length === 0) return { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng };
  return {
    lat: zs.reduce((a, s) => a + s.lat, 0) / zs.length,
    lng: zs.reduce((a, s) => a + s.lng, 0) / zs.length,
  };
}

export function runLocalAgent(
  text: string,
  zones: Zone[],
  spots: Spot[],
  places: SavedPlace[]
): AgentResponse {
  const intent = detectIntent(text);
  const t = text.toLowerCase();

  if (intent === 'find_parking') {
    const reasoning: string[] = [];
    let target = { lat: DEMO_LOCATION.lat, lng: DEMO_LOCATION.lng };
    const place = places.find(
      (p) => t.includes(p.label.toLowerCase()) || (p.custom_name && t.includes(p.custom_name.toLowerCase()))
    );
    if (place) {
      target = { lat: place.lat, lng: place.lng };
      reasoning.push(`Resolved '${place.label}' from saved places → (${place.lat.toFixed(4)}, ${place.lng.toFixed(4)})`);
    } else {
      reasoning.push(`Using current location → (${target.lat.toFixed(4)}, ${target.lng.toFixed(4)})`);
    }

    const scored = zones
      .map((zone) => {
        const zs = spots.filter((s) => s.zone_id === zone.id);
        const free = zs.filter((s) => s.status === 'free').length;
        const center = zoneCenter(zone, spots);
        const distance = haversine(target.lat, target.lng, center.lat, center.lng);
        const availability = zs.length > 0 ? free / zs.length : 0;
        const proximity = 1 - Math.min(distance, 500) / 500;
        const predicted = 1 - targetOccupancy(dubaiHourNow());
        const score = 0.4 * availability + 0.3 * proximity + 0.3 * predicted;
        return { zone, free, total: zs.length, distance, score, center };
      })
      .filter((z) => z.distance <= 500 && z.total > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return {
        text: 'No parking zones found within 500m of your location. Try expanding your search area.',
        reasoning_steps: [...reasoning, 'No zones found within 500m radius'],
      };
    }

    scored.forEach((z) =>
      reasoning.push(`Zone '${z.zone.name}': ${z.free}/${z.total} free, ${z.distance.toFixed(0)}m away, score=${z.score.toFixed(2)}`)
    );
    const best = scored[0];
    reasoning.push(`Selected '${best.zone.name}' with highest composite score ${best.score.toFixed(2)}`);
    const walking = Math.max(1, Math.round(best.distance / 80));

    return {
      text: `I found parking at ${best.zone.name} — ${best.free} spots available out of ${best.total}. It's about ${walking} min walk from your location. Rate: AED ${best.zone.price_per_hour.toFixed(0)}/hr.`,
      reasoning_steps: reasoning,
      map_card: {
        zone_id: best.zone.id,
        zone_name: best.zone.name,
        lat: best.center.lat,
        lng: best.center.lng,
        free_spots: best.free,
        total_spots: best.total,
        price_per_hour: best.zone.price_per_hour,
        walking_minutes: walking,
      },
    };
  }

  if (intent === 'predict') {
    const preds = generatePredictions();
    const next = preds[4]; // ~1 hour out
    const occ = next.predicted_occupancy;
    let advice = 'Good availability expected!';
    if (occ >= 80) advice = 'High demand expected — arrive early if possible.';
    else if (occ >= 60) advice = 'Moderate demand expected — consider arriving early.';
    return {
      text: `Prediction for the DIC area: occupancy expected around ${occ.toFixed(0)}% in the next hour (confidence: ${(next.confidence * 100).toFixed(0)}%). ${advice}`,
      reasoning_steps: [
        'Detected prediction intent',
        'Loaded time-of-day occupancy profile for DIC',
        `Next-hour prediction: ${occ.toFixed(0)}%`,
      ],
    };
  }

  if (intent === 'compare') {
    const rows = zones
      .map((zone) => {
        const zs = spots.filter((s) => s.zone_id === zone.id);
        const free = zs.filter((s) => s.status === 'free').length;
        return { name: zone.name, free, total: zs.length, price: zone.price_per_hour };
      })
      .sort((a, b) => b.free - a.free);
    const lines = rows.map((r) => `• ${r.name}: ${r.free}/${r.total} free, AED ${r.price}/hr`).join('\n');
    return {
      text: `Comparing all zones:\n${lines}\n\nBest availability: ${rows[0].name} with ${rows[0].free} free spots.`,
      reasoning_steps: ['Detected compare intent', ...rows.map((r) => `${r.name}: ${r.free}/${r.total} free`)],
    };
  }

  if (intent === 'navigate') {
    return {
      text: 'Navigation started! Opening directions to the nearest available parking zone.',
      reasoning_steps: ['Detected navigation intent', 'Use the Navigate button on a spot card to open Apple Maps'],
    };
  }

  if (intent === 'pay') {
    return {
      text: 'Payment integration is available. Your session will be auto-charged at AED 4/hr when you leave the zone.',
      reasoning_steps: ['Detected payment intent', 'Demo mode: simulated Parkin payment response'],
    };
  }

  return {
    text: "I'm SpotSense AI — I can help you find parking, predict availability, compare zones, navigate to spots, or handle payments. What would you like to do?",
    reasoning_steps: ['No specific intent detected', 'Returning general help message'],
  };
}
