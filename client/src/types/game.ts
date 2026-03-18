/**
 * Shared Game Types - Client-side copy
 * Keep in sync with server/src/types/game.ts
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
  isAllIn: boolean;
  isOnline: boolean;
  bet: number;
}

export interface GameConfig {
  buyIn: number;
  smallBlind: number;
  bigBlind: number;
  raiseLimit?: number;
}

export interface GameState {
  roomId: string;
  config: GameConfig;
  players: Player[];
  pot: number;
  communityCards: string[];
  stage: GameStage | string;
  dealerIndex: number;
  currentTurnIndex: number;
  minRaise: number;
  lastRaiserIndex: number | null;
  lastWinner?: {
    name: string;
    amount: number;
    handName: string;
    cards: string[];
  } | null;
  turnExpiresAt?: number; // timestamp in ms
  creatorId: string;
}
