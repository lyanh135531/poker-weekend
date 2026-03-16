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
}

export class HandEvaluator {
  private static readonly RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  /**
   * Evaluate the best 5-card hand from 7 cards (2 hole + 5 community)
   */
  static evaluate(cards: string[]): EvaluationResult {
    const parsedCards = cards.map(c => ({
      rank: c.slice(0, -1),
      suit: c.slice(-1),
      value: this.RANK_VALUES[c.slice(0, -1)]
    })).sort((a, b) => b.value - a.value);

    // This is a simplified evaluator for demonstration.
    // In a production app, we'd use a perfect hash or bitmasking for 7-card evaluation.
    
    const isFlush = this.checkFlush(parsedCards);
    const isStraight = this.checkStraight(parsedCards);
    const counts = this.getCounts(parsedCards);
    
    if (isFlush && isStraight) {
      if (isStraight[0].value === 14) return { rank: HandRank.ROYAL_FLUSH, score: 900, name: 'Royal Flush' };
      return { rank: HandRank.STRAIGHT_FLUSH, score: 800 + isStraight[0].value, name: 'Straight Flush' };
    }

    const quads = this.getNOfAKind(counts, 4);
    if (quads.length) return { rank: HandRank.FOUR_OF_A_KIND, score: 700 + quads[0], name: 'Four of a Kind' };

    const trips = this.getNOfAKind(counts, 3);
    const pairs = this.getNOfAKind(counts, 2);
    if (trips.length && pairs.length) return { rank: HandRank.FULL_HOUSE, score: 600 + trips[0], name: 'Full House' };

    if (isFlush) return { rank: HandRank.FLUSH, score: 500 + isFlush[0].value, name: 'Flush' };
    if (isStraight) return { rank: HandRank.STRAIGHT, score: 400 + isStraight[0].value, name: 'Straight' };
    if (trips.length) return { rank: HandRank.THREE_OF_A_KIND, score: 300 + trips[0], name: 'Three of a Kind' };
    if (pairs.length >= 2) return { rank: HandRank.TWO_PAIR, score: 200 + pairs[0] * 10 + pairs[1], name: 'Two Pair' };
    if (pairs.length === 1) return { rank: HandRank.PAIR, score: 100 + pairs[0], name: 'Pair' };

    return { rank: HandRank.HIGH_CARD, score: parsedCards[0].value, name: 'High Card' };
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
    const uniqueValues = Array.from(new Set(cards.map(c => c.value))).sort((a, b) => b - a);
    if (uniqueValues.length < 5) return null;

    // Handle Ace-low straight (A, 2, 3, 4, 5)
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
        if (!uniqueValues.includes(6)) return [{ value: 5 }]; // Ace-5 straight
    }

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
            return [{ value: uniqueValues[i] }];
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

  private static getNOfAKind(counts: Record<number, number>, n: number) {
    return Object.entries(counts)
        .filter(([_, count]) => count === n)
        .map(([val, _]) => parseInt(val))
        .sort((a, b) => b - a);
  }
}
