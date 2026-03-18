import { Card, Deck } from './deck';
import { GameStage, Player, GameState, GameConfig } from '../types/game';
import { HandEvaluator } from './evaluator';

export class PokerEngine {
  private state: GameState;
  private deck: Deck;

  constructor(roomId: string, config?: GameConfig) {
    this.deck = new Deck();
    const defaultConfig: GameConfig = {
      buyIn: 1000,
      smallBlind: 10,
      bigBlind: 20
    };
    this.state = {
      roomId,
      config: config || defaultConfig,
      players: [],
      pot: 0,
      communityCards: [],
      stage: GameStage.WAITING,
      dealerIndex: 0,
      currentTurnIndex: 0,
      minRaise: (config || defaultConfig).bigBlind,
      lastRaiserIndex: null
    };
  }

  private playerStats: Record<string, number> = {}; // name -> chips persistence

  addPlayer(id: string, name: string) {
    if (this.state.players.length >= 10) return false;
    
    // Persist chips by name if they were here before
    const chips = this.playerStats[name] !== undefined ? this.playerStats[name] : this.state.config.buyIn;
    
    this.state.players.push({
      id,
      name,
      chips,
      cards: [],
      isFolded: false,
      isTurn: false,
      bet: 0,
      hasActed: false,
      isDealer: this.state.players.length === 0 // First player is dealer
    });
    
    this.playerStats[name] = chips;
    return true;
  }

  removePlayer(id: string) {
    const playerIndex = this.state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return;

    const player = this.state.players[playerIndex];

    // Mark as folded logically if game is active so they don't block anything
    if (this.state.stage !== GameStage.WAITING && !player.isFolded) {
      player.isFolded = true;
      // If it's their turn, move it immediately
      if (this.state.currentTurnIndex === playerIndex) {
        this.nextTurn();
      }
    }

    // Handle index shifting for turn and dealer before removal
    if (this.state.stage !== GameStage.WAITING) {
      // Fix: If nextTurn() was called, currentTurnIndex might already be ahead
      if (this.state.currentTurnIndex > playerIndex) {
        this.state.currentTurnIndex--;
      }

      // Shift dealer index accurately
      if (this.state.dealerIndex === playerIndex) {
        // Dealer left - if it was the last person, wrap to 0, 
        // otherwise it stays at playerIndex which will be the next person after splice
        if (this.state.dealerIndex === this.state.players.length - 1) {
          this.state.dealerIndex = 0;
        }
      } else if (this.state.dealerIndex > playerIndex) {
        this.state.dealerIndex--;
      }

      // Shift last raiser index
      if (this.state.lastRaiserIndex === playerIndex) {
        this.state.lastRaiserIndex = null;
      } else if (this.state.lastRaiserIndex !== null && this.state.lastRaiserIndex > playerIndex) {
        this.state.lastRaiserIndex--;
      }
    }

    this.state.players.splice(playerIndex, 1);

    // Cancel game if too few players left
    if (this.state.players.length < 2 && this.state.stage !== GameStage.WAITING) {
      this.state.stage = GameStage.WAITING;
      this.state.communityCards = [];
      this.state.pot = 0;
      this.state.players.forEach(p => {
        p.cards = [];
        p.isFolded = false;
        p.bet = 0;
      });
    }

    this.updateTurns();
  }

  startGame() {
    if (this.state.players.length < 2) return false;

    this.deck.reset();
    this.deck.shuffle();
    
    this.state.stage = GameStage.PRE_FLOP;
    this.state.communityCards = [];
    this.state.pot = 0;
    this.state.minRaise = this.state.config.bigBlind;
    this.state.lastRaiserIndex = null;
    this.state.lastWinner = null;

    // Deal hole cards & reset player state
    this.state.players.forEach(p => {
      p.cards = this.deck.draw(2).map(c => `${c.rank}${c.suit}`);
      p.isFolded = false;
      p.bet = 0;
      p.hasActed = false;
    });

    // Blinds logic
    const n = this.state.players.length;
    let sbIndex, bbIndex, utgIndex;

    if (n === 2) {
      // World Rules Heads-up: Dealer is SB, other is BB
      sbIndex = this.state.dealerIndex;
      bbIndex = (this.state.dealerIndex + 1) % n;
      utgIndex = sbIndex; // SB (Dealer) acts first pre-flop
    } else {
      sbIndex = (this.state.dealerIndex + 1) % n;
      bbIndex = (this.state.dealerIndex + 2) % n;
      utgIndex = (this.state.dealerIndex + 3) % n;
    }
    
    this.handleBet(this.state.players[sbIndex].id, this.state.config.smallBlind);
    this.handleBet(this.state.players[bbIndex].id, this.state.config.bigBlind);

    // Pre-flop: the Big Blind is technically the last raiser (forced)
    this.state.lastRaiserIndex = bbIndex;
    this.state.currentTurnIndex = utgIndex;
    
    this.resetTurnTimer();
    this.updateTurns();
    return true;
  }

  handleBet(playerId: string, amount: number) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.chips < amount) return false;

    player.chips -= amount;
    player.bet += amount;
    this.state.pot += amount;
    
    // Sync persistence
    this.playerStats[player.name] = player.chips;
    return true;
  }

  action(playerId: string, type: 'fold' | 'call' | 'check' | 'raise', amount: number = 0) {
    const player = this.state.players[this.state.currentTurnIndex];
    if (player.id !== playerId) return false;

    const currentMaxBet = Math.max(...this.state.players.map(p => p.bet));

    switch (type) {
      case 'fold':
        player.isFolded = true;
        break;
      case 'call':
        const callAmount = currentMaxBet - player.bet;
        this.handleBet(playerId, callAmount);
        break;
      case 'raise':
        // World rules: Raise must be at least minRaise
        const raiseAmount = Math.max(amount, this.state.minRaise);
        
        // Enforce Raise Limit if configured
        if (this.state.config.raiseLimit && this.state.config.raiseLimit > 0) {
          if (raiseAmount > this.state.config.raiseLimit) {
            return false; // Exceeds limit
          }
        }

        const totalRaiseTo = currentMaxBet + raiseAmount;
        const addedChips = totalRaiseTo - player.bet;
        if (this.handleBet(playerId, addedChips)) {
            this.state.minRaise = Math.max(amount, this.state.minRaise);
            this.state.lastRaiserIndex = this.state.currentTurnIndex;
            // World Rule: Reset everyone else's hasActed on raise
            this.state.players.forEach((p, i) => {
                if (i !== this.state.currentTurnIndex && !p.isFolded) {
                    p.hasActed = false;
                }
            });
        } else {
            return false; // Not enough chips
        }
        break;
      case 'check':
        if (player.bet < currentMaxBet) return false; // Cannot check if there's a bet to call
        break;
    }

    player.hasActed = true;
    this.nextTurn();
    return true;
  }

  private resetTurnTimer() {
    if (this.state.stage !== GameStage.WAITING && this.state.stage !== GameStage.SHOWDOWN) {
      this.state.turnExpiresAt = Date.now() + 60000; // 1 minute from now
    } else {
      this.state.turnExpiresAt = undefined;
    }
  }

  private nextTurn() {
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    
    // Check if hand is over early (everyone folded but one)
    if (activePlayers.length === 1) {
        this.resolveWinner();
        return;
    }

    const currentMaxBet = Math.max(...this.state.players.map(p => p.bet));
    const everyoneActed = activePlayers.every(p => p.hasActed);
    const betsEqualized = activePlayers.every(p => p.bet === currentMaxBet);

    if (everyoneActed && betsEqualized) {
        this.nextStage();
    } else {
        this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
        if (this.state.players[this.state.currentTurnIndex].isFolded) {
            this.nextTurn();
            return; // Important: nextTurn is recursive, we don't want to reset timer twice
        }
    }
    this.resetTurnTimer();
    this.updateTurns();
  }

  private nextStage() {
    // Reset bets and acting flags for next stage
    this.state.players.forEach(p => {
        p.bet = 0;
        p.hasActed = false;
    });
    this.state.minRaise = this.state.config.bigBlind;
    this.state.lastRaiserIndex = null;

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
        return; // resolveWinner handles stage transition if needed
    }

    // Post-flop: Small Blind (first active player after dealer) starts
    const n = this.state.players.length;
    let nextIndex;
    
    if (n === 2) {
        // Standard Heads-up Post-flop: Dealer acts LAST, BB acts FIRST.
        // In our setup, Dealer is dealerIndex, BB is (dealerIndex + 1) % 2.
        nextIndex = (this.state.dealerIndex + 1) % 2;
    } else {
        // Multi-player: Small Blind (Dealer + 1) acts first.
        nextIndex = (this.state.dealerIndex + 1) % n;
    }

    while (this.state.players[nextIndex].isFolded) {
        nextIndex = (nextIndex + 1) % n;
    }
    this.state.currentTurnIndex = nextIndex;
  }

  resolveWinner() {
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    if (activePlayers.length === 0) return;

    let winner: Player;
    let handName = "High Card";
    let winningCards: string[] = [];

    if (activePlayers.length === 1) {
        // Everyone else folded
        winner = activePlayers[0];
        handName = "Fold Victory";
    } else {
        const evaluations = activePlayers.map(p => ({
            player: p,
            eval: HandEvaluator.evaluate([...p.cards, ...this.state.communityCards])
        }));

        evaluations.sort((a, b) => b.eval.score - a.eval.score);
        winner = evaluations[0].player;
        handName = evaluations[0].eval.name;
        // The simplified evaluator doesn't return the best 5-card hand specifically,
        // so we'll just show the player's hole cards for now.
        winningCards = winner.cards;
    }
    
    const potWon = this.state.pot;
    winner.chips += potWon;
    this.playerStats[winner.name] = winner.chips;
    
    // Set temporary lastWinner state for Showdown
    this.state.lastWinner = {
        name: winner.name,
        amount: potWon,
        handName: handName,
        cards: winningCards
    };

    this.state.pot = 0;
    this.state.stage = GameStage.SHOWDOWN;
    this.state.currentTurnIndex = -1; // No one's turn during showdown
    this.state.turnExpiresAt = undefined;

    // Rotate dealer for the NEXT hand right now
    if (this.state.players.length > 0) {
      this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    }

    this.updateTurns();
  }

  resetForNextHand() {
    this.state.stage = GameStage.WAITING;
    this.state.communityCards = [];
    this.state.pot = 0;
    this.state.lastWinner = null;
    this.state.players.forEach(p => {
        p.cards = [];
        p.isFolded = false;
        p.bet = 0;
        p.hasActed = false;
    });
    this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length;
    this.updateTurns();
  }

  private updateTurns() {
    this.state.players.forEach((p, i) => {
      p.isTurn = i === this.state.currentTurnIndex;
      p.isDealer = i === this.state.dealerIndex;
    });
  }

  getState(): GameState {
    // Return a deep copy to ensure immutability outside
    return JSON.parse(JSON.stringify(this.state));
  }
}
