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
  bet: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  pot: number;
  communityCards: string[];
  stage: GameStage | string;
  dealerIndex: number;
  currentTurnIndex: number;
}
