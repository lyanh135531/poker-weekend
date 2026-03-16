import { Card, Deck } from './deck';
import { GameStage, Player, GameState } from '../types/game';
import { HandEvaluator } from './evaluator';

export class PokerEngine {
  private state: GameState;
  private deck: Deck;

  constructor(roomId: string) {
    this.deck = new Deck();
    this.state = {
      roomId,
      players: [],
      pot: 0,
      communityCards: [],
      stage: GameStage.WAITING,
      dealerIndex: 0,
      currentTurnIndex: 0
    };
  }

  addPlayer(id: string, name: string) {
    if (this.state.players.length >= 6) return false;
    this.state.players.push({
      id,
      name,
      chips: 1000,
      cards: [],
      isFolded: false,
      isTurn: false,
      bet: 0
    });
    return true;
  }

  removePlayer(id: string) {
    this.state.players = this.state.players.filter(p => p.id !== id);
  }

  startGame() {
    if (this.state.players.length < 2) return false;
    this.deck.reset();
    this.deck.shuffle();
    
    this.state.stage = GameStage.PRE_FLOP;
    this.state.communityCards = [];
    this.state.pot = 0;

    // Deal hole cards
    for (const player of this.state.players) {
      const cards = this.deck.draw(2);
      player.cards = cards.map(c => `${c.rank}${c.suit}`);
      player.isFolded = false;
      player.bet = 0;
    }

    // Small Blind / Big Blind
    const sbIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    const bbIndex = (this.state.dealerIndex + 2) % this.state.players.length;
    
    this.handleBet(this.state.players[sbIndex].id, 10);
    this.handleBet(this.state.players[bbIndex].id, 20);

    this.state.currentTurnIndex = (this.state.dealerIndex + 3) % this.state.players.length;
    this.updateTurns();
    return true;
  }

  handleBet(playerId: string, amount: number) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.chips < amount) return false;

    player.chips -= amount;
    player.bet += amount;
    this.state.pot += amount;
    return true;
  }

  action(playerId: string, type: 'fold' | 'call' | 'check' | 'raise', amount: number = 0) {
    const player = this.state.players[this.state.currentTurnIndex];
    if (player.id !== playerId) return false;

    switch (type) {
      case 'fold':
        player.isFolded = true;
        break;
      case 'call':
        const maxBet = Math.max(...this.state.players.map(p => p.bet));
        const callAmount = maxBet - player.bet;
        this.handleBet(playerId, callAmount);
        break;
      case 'raise':
        const currentMax = Math.max(...this.state.players.map(p => p.bet));
        this.handleBet(playerId, (currentMax - player.bet) + amount);
        break;
      case 'check':
        // No action needed
        break;
    }

    this.nextTurn();
    return true;
  }

  private nextTurn() {
    // Check if round is over (everyone called highest bet or folded)
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    const maxBet = Math.max(...this.state.players.map(p => p.bet));
    const everyoneCalled = activePlayers.every(p => p.bet === maxBet);

    if (everyoneCalled) {
        this.nextStage();
    } else {
        this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
        if (this.state.players[this.state.currentTurnIndex].isFolded) {
            this.nextTurn();
        }
    }
    this.updateTurns();
  }

  private nextStage() {
    // Reset bets for next stage
    this.state.players.forEach(p => p.bet = 0);

    switch (this.state.stage) {
      case GameStage.PRE_FLOP:
        this.state.communityCards = this.deck.draw(3).map(c => `${c.rank}${c.suit}`);
        this.state.stage = GameStage.FLOP;
        break;
      case GameStage.FLOP:
        this.state.communityCards.push(...this.deck.draw(1).map(c => `${c.rank}${c.suit}`));
        this.state.stage = GameStage.TURN;
        break;
      case GameStage.TURN:
        this.state.communityCards.push(...this.deck.draw(1).map(c => `${c.rank}${c.suit}`));
        this.state.stage = GameStage.RIVER;
        break;
      case GameStage.RIVER:
        this.state.stage = GameStage.SHOWDOWN;
        this.resolveWinner();
        break;
    }
    this.state.currentTurnIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    // Skip folded players
    while (this.state.players[this.state.currentTurnIndex].isFolded) {
        this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
    }
  }

  private resolveWinner() {
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    if (activePlayers.length === 0) return;

    const evaluations = activePlayers.map(p => ({
        player: p,
        eval: HandEvaluator.evaluate([...p.cards, ...this.state.communityCards])
    }));

    evaluations.sort((a, b) => b.eval.score - a.eval.score);

    const winner = evaluations[0].player;
    winner.chips += this.state.pot;
    
    // For a senior app, we'd emit a 'game_over' event with the winner info
    // For now, we reset for the next hand
    this.state.pot = 0;
    this.state.stage = GameStage.WAITING;
    this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
  }

  private updateTurns() {
    this.state.players.forEach((p, i) => {
      p.isTurn = i === this.state.currentTurnIndex;
    });
  }

  getState(): GameState {
    // Return a deep copy to ensure immutability outside
    return JSON.parse(JSON.stringify(this.state));
  }
}
