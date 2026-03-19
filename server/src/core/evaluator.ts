import { Card } from './deck';

export enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

export interface EvaluationResult {
  rank: HandRank;
  score: number; // For tie-breaking
  name: string;
  cards: string[]; // The best 5 cards
}

export class HandEvaluator {
  private static readonly RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  static evaluate(cards: string[]): EvaluationResult {
    const normalizedCards = cards.map(c => {
        const suit = c.slice(-1);
        const rank = c.slice(0, -1);
        return { raw: c, rank, suit, value: this.RANK_VALUES[rank] };
    }).sort((a, b) => b.value - a.value);

    const isFlush = this.checkFlush(normalizedCards);
    const isStraight = this.checkStraight(normalizedCards);
    const trips = this.getNOfAKind(normalizedCards, 3);
    const availablePairs = this.getNOfAKind(normalizedCards, 2).filter(p => !trips.length || p !== trips[0]);
    
    if (isFlush && isStraight) {
      if (isStraight[0].value === 14) {
          return { rank: HandRank.ROYAL_FLUSH, score: 9000000, name: 'Royal Flush', cards: isFlush.map(c => c.raw) };
      }
      return { rank: HandRank.STRAIGHT_FLUSH, score: 8000000 + isStraight[0].value, name: 'Straight Flush', cards: isFlush.map(c => c.raw) };
    }

    const quads = this.getNOfAKind(normalizedCards, 4);
    if (quads.length) {
        const quadCards = normalizedCards.filter(c => c.value === quads[0]);
        const kicker = normalizedCards.find(c => c.value !== quads[0]);
        return { rank: HandRank.FOUR_OF_A_KIND, score: 7000000 + quads[0] * 100 + (kicker?.value || 0), name: 'Four of a Kind', cards: [...quadCards, kicker!].map(c => c.raw) };
    }

    // Full House: Highest trips, then highest pair (different ranks)
    if (trips.length && (availablePairs.length || trips.length > 1)) {
        const mainTrip = trips[0];
        const mainPair = availablePairs.length ? availablePairs[0] : trips[1];

        const tripCards = normalizedCards.filter(c => c.value === mainTrip).slice(0, 3);
        const pairCards = normalizedCards.filter(c => c.value === mainPair).slice(0, 2);
        
        return { 
          rank: HandRank.FULL_HOUSE, 
          score: 6000000 + mainTrip * 100 + mainPair, 
          name: 'Full House', 
          cards: [...tripCards, ...pairCards].map(c => c.raw) 
        };
    }

    if (isFlush) {
        const flushScore = isFlush.slice(0, 5).reduce((acc, c, i) => acc + c.value * Math.pow(15, 4 - i), 5000000);
        return { rank: HandRank.FLUSH, score: flushScore, name: 'Flush', cards: isFlush.map(c => c.raw) };
    }
    
    if (isStraight) {
        return { rank: HandRank.STRAIGHT, score: 4000000 + isStraight[0].value, name: 'Straight', cards: isStraight.map(c => c.raw) };
    }
    
    if (trips.length) {
        const tripValue = trips[0];
        const tripCards = normalizedCards.filter(c => c.value === tripValue).slice(0, 3);
        const kickers = normalizedCards.filter(c => c.value !== tripValue).slice(0, 2);
        const kickerScore = kickers.reduce((acc, c, i) => acc + c.value * Math.pow(15, 1 - i), 0);
        
        return { rank: HandRank.THREE_OF_A_KIND, score: 3000000 + tripValue * 1000 + kickerScore, name: 'Three of a Kind', cards: [...tripCards, ...kickers].map(c => c.raw) };
    }

    if (availablePairs.length >= 2) {
        const p1 = availablePairs[0];
        const p2 = availablePairs[1];
        const p1Cards = normalizedCards.filter(c => c.value === p1).slice(0, 2);
        const p2Cards = normalizedCards.filter(c => c.value === p2).slice(0, 2);
        const kicker = normalizedCards.find(c => c.value !== p1 && c.value !== p2);
        
        return { rank: HandRank.TWO_PAIR, score: 2000000 + p1 * 1000 + p2 * 15 + (kicker?.value || 0), name: 'Two Pair', cards: [...p1Cards, ...p2Cards, kicker!].map(c => c.raw) };
    }

    const allPairs = this.getNOfAKind(normalizedCards, 2);
    if (allPairs.length === 1) {
        const pairValue = allPairs[0];
        const pairCards = normalizedCards.filter(c => c.value === pairValue).slice(0, 2);
        const kickers = normalizedCards.filter(c => c.value !== pairValue).slice(0, 3);
        const kickerScore = kickers.reduce((acc, c, i) => acc + c.value * Math.pow(15, 2 - i), 0);
        
        return { rank: HandRank.PAIR, score: 1000000 + pairValue * 10000 + kickerScore, name: 'Pair', cards: [...pairCards, ...kickers].map(c => c.raw) };
    }

    const highCardScore = normalizedCards.slice(0, 5).reduce((acc, c, i) => acc + c.value * Math.pow(15, 4 - i), 0);
    return { rank: HandRank.HIGH_CARD, score: highCardScore, name: 'High Card', cards: normalizedCards.slice(0, 5).map(c => c.raw) };
  }

  private static checkFlush(cards: any[]) {
    const suits = ['H', 'D', 'C', 'S'];
    for (const suit of suits) {
        const suitCards = cards.filter(c => c.suit === suit);
        if (suitCards.length >= 5) return suitCards.slice(0, 5);
    }
    return null;
  }

  private static checkStraight(cards: any[]) {
    const uniqueCards: any[] = [];
    const seen = new Set();
    for (const c of cards) {
      if (!seen.has(c.value)) {
        uniqueCards.push(c);
        seen.add(c.value);
      }
    }

    if (uniqueCards.length < 5) return null;

    const values = uniqueCards.map(c => c.value);
    if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
        const lowStraight = [
            uniqueCards.find(c => c.value === 5),
            uniqueCards.find(c => c.value === 4),
            uniqueCards.find(c => c.value === 3),
            uniqueCards.find(c => c.value === 2),
            uniqueCards.find(c => c.value === 14)
        ];
        return lowStraight;
    }

    for (let i = 0; i <= uniqueCards.length - 5; i++) {
        if (uniqueCards[i].value - uniqueCards[i + 4].value === 4) {
            return uniqueCards.slice(i, i + 5);
        }
    }
    return null;
  }

  private static getCounts(cards: any[]) {
    const counts: Record<number, number> = {};
    cards.forEach(c => {
        counts[c.value] = (counts[c.value] || 0) + 1;
    });
    return counts;
  }

  private static getNOfAKind(cards: any[], n: number) {
    const counts = this.getCounts(cards);
    return Object.entries(counts)
        .filter(([_, count]) => (count as number) >= n)
        .map(([val, _]) => parseInt(val))
        .sort((a, b) => b - a);
  }
}
