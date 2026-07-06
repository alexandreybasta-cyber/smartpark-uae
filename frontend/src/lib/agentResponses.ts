import { SavedPlace } from '@/types';

export interface MapCardData {
  zoneName: string;
  freeSpots: number;
  totalSpots: number;
  distanceM: number;
  walkingMin: number;
}

export interface AgentResult {
  text: string;
  reasoningSteps: string[];
  mapCard?: MapCardData;
}

export function processQuery(query: string, savedPlaces: SavedPlace[]): AgentResult {
  const q = query.toLowerCase().trim();

  // find_parking: "park" + location keywords
  if (q.includes('park') && (q.includes('work') || q.includes('here') || q.includes('near') || q.includes('dic') || q.includes('close'))) {
    return {
      text: 'I found parking near your work at Dubai Internet City. Zone 314 (Street 2C) has the best availability with 11/24 spots free, just 150m walk. Shall I navigate you there?',
      reasoningSteps: [
        '✓ Resolving \'work\' → Dubai Internet City',
        '✓ Searching zones within 500m...',
        '✓ Zone 312: 6/18 free (200m away)',
        '✓ Zone 314: 11/24 free (150m away)',
        '✓ Zone 315: 5/16 free (320m away)',
        '✓ Ranking → Zone 314 recommended',
      ],
      mapCard: {
        zoneName: 'Street 2C — DIC',
        freeSpots: 11,
        totalSpots: 24,
        distanceM: 150,
        walkingMin: 2,
      },
    };
  }

  // "where can i park" generic
  if (q.includes('where') && q.includes('park')) {
    return {
      text: 'I found parking near your work at Dubai Internet City. Zone 314 (Street 2C) has the best availability with 11/24 spots free, just 150m walk. Shall I navigate you there?',
      reasoningSteps: [
        '✓ Detecting current location...',
        '✓ Searching zones within 500m...',
        '✓ Zone 314: 11/24 free (150m away)',
        '✓ Zone 312: 6/18 free (200m away)',
        '✓ Ranking → Zone 314 recommended',
      ],
      mapCard: {
        zoneName: 'Street 2C — DIC',
        freeSpots: 11,
        totalSpots: 24,
        distanceM: 150,
        walkingMin: 2,
      },
    };
  }

  // peak_info: "peak" or "busy" or "when"
  if (q.includes('peak') || q.includes('busy') || (q.includes('when') && (q.includes('full') || q.includes('hour') || q.includes('crowded')))) {
    return {
      text: 'Based on historical patterns in this area, peak occupancy occurs between 5:00 PM - 8:00 PM reaching 88-92% capacity. The quietest period is 10:00 PM - 6:00 AM at only 8-15%. I recommend arriving before 4:30 PM for the best spot selection.',
      reasoningSteps: [
        '✓ Loading historical occupancy data...',
        '✓ Analyzing weekly patterns for DIC area...',
        '✓ Peak window identified: 17:00-20:00',
        '✓ Off-peak window identified: 22:00-06:00',
      ],
    };
  }

  // compare_zones: "compare" or "which" + "best"/"most"
  if (q.includes('compare') || q.includes('comparison') || (q.includes('which') && (q.includes('most') || q.includes('best')))) {
    return {
      text: `Here's the current comparison:\n• Zone 312 (Street 2A): 6/18 free (33%)\n• Zone 314 (Street 2C): 11/24 free (46%) ← Best\n• Zone 315 (Near Metro): 5/16 free (31%)\n\nZone 314 has the highest availability right now.`,
      reasoningSteps: [
        '✓ Fetching real-time data for nearby zones...',
        '✓ Zone 312: 6/18 free (33%)',
        '✓ Zone 314: 11/24 free (46%)',
        '✓ Zone 315: 5/16 free (31%)',
        '✓ Ranking by availability percentage...',
      ],
    };
  }

  // prediction: "predict" or "will there be" or "next" + "hour"
  if (q.includes('predict') || q.includes('forecast') || q.includes('will there be') || (q.includes('next') && q.includes('hour'))) {
    return {
      text: 'Prediction for the next 2 hours:\n📊 Current: 62% occupied\n📈 In 1 hour: ~71% (+9%)\n📈 In 2 hours: ~78% (+16%)\n\nOccupancy is trending up. I recommend parking within the next 30 minutes for the best selection.',
      reasoningSteps: [
        '✓ Loading ML prediction model...',
        '✓ Current occupancy: 62%',
        '✓ Applying time-series forecast...',
        '✓ Confidence interval: ±4%',
        '✓ Trend: increasing (+9%/hr)',
      ],
    };
  }

  // navigate: "navigate" or "take me"
  if (q.includes('navigate') || q.includes('take me') || q.includes('directions')) {
    return {
      text: 'Navigating you to Zone 314 (Street 2C — DIC). It\'s 150m away, about a 2-minute walk. I\'ve highlighted the route on your map.',
      reasoningSteps: [
        '✓ Setting destination: Zone 314',
        '✓ Calculating route...',
        '✓ Distance: 150m, ETA: 2 min walk',
      ],
      mapCard: {
        zoneName: 'Street 2C — DIC',
        freeSpots: 11,
        totalSpots: 24,
        distanceM: 150,
        walkingMin: 2,
      },
    };
  }

  // enforcement: "enforce" or "fine" or "paid" or "violation" or "inspector"
  if (q.includes('enforce') || q.includes('fine') || q.includes('paid') || q.includes('violation') || q.includes('inspector')) {
    return {
      text: 'SmartPark\'s sensors detect vehicle occupancy in real-time and cross-reference with Parkin\'s payment database. When a spot is occupied without active payment, the system automatically flags it for enforcement — eliminating the need for manual inspectors. This covers 100% of monitored streets 24/7.',
      reasoningSteps: [
        '✓ Sensor detects vehicle in spot B-07...',
        '✓ Querying Parkin payment API for spot B-07...',
        '✓ No active payment session found',
        '✓ Grace period (5 min) elapsed',
        '✓ Flagging vehicle for enforcement',
        '✓ Alert sent to municipal enforcement system',
      ],
    };
  }

  // default: general greeting/help
  return {
    text: `Hi! I'm the SmartPark AI assistant. I can help you find parking, check availability, compare zones, or predict occupancy. Try asking:\n• "Where can I park near work?"\n• "When is peak hour?"\n• "Show zone comparison"\n• "Predict next 2 hours"`,
    reasoningSteps: [
      '✓ Ready to help with parking queries',
    ],
  };
}
