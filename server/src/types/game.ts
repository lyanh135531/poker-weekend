/**
 * Shared Types for Poker Weekend
 * Following Senior DRY principle: Share types between client and server
 */

export enum GameStage {
  WAITING = 'WAITING',
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN'
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  cards: string[];
  isFolded: boolean;
  isTurn: boolean;
  bet: number;
  hasActed: boolean;
  isDealer: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  pot: number;
  communityCards: string[];
  stage: GameStage;
  dealerIndex: number;
  currentTurnIndex: number;
  minRaise: number;
  lastRaiserIndex: number | null;
}
