import { Card, Deck } from './deck';
import { GameStage, Player, GameState, GameConfig } from '../types/game';
import { HandEvaluator } from './evaluator';

export class PokerEngine {
  private state: GameState;
  private deck: Deck;

  constructor(roomId: string, creatorId: string, config?: GameConfig) {
    this.deck = new Deck();
    const defaultConfig: GameConfig = {
      buyIn: 1000,
      smallBlind: 10,
      bigBlind: 20
    };
    this.state = {
      roomId,
      creatorId,
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
    // Check if player already exists (re-joining)
    const existingPlayer = this.state.players.find(p => p.name === name);
    if (existingPlayer) {
      const wasCreator = existingPlayer.id === this.state.creatorId;
      existingPlayer.id = id;
      existingPlayer.isOnline = true;
      if (wasCreator) {
        this.state.creatorId = id; // Update to new socket ID
      }
      this.updateCreator();
      return true;
    }

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
      isAllIn: false,
      bet: 0,
      hasActed: false,
      isDealer: this.state.players.length === 0, // First player is dealer
      isOnline: true
    });
    
    this.playerStats[name] = chips;
    this.updateCreator();
    return true;
  }

  handleBet(playerId: string, amount: number): number {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.isAllIn) return 0;

    const actualAmount = Math.min(amount, player.chips);
    player.chips -= actualAmount;
    player.bet += actualAmount;
    this.state.pot += actualAmount;
    
    if (player.chips === 0 && actualAmount > 0) {
      player.isAllIn = true;
    }

    // Sync persistence
    this.playerStats[player.name] = player.chips;
    return actualAmount;
  }

  removePlayer(id: string, isExplicit: boolean = false) {
    const playerIndex = this.state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return;

    const player = this.state.players[playerIndex];
    player.isOnline = false;

    const isWaitingOrShowdown = this.state.stage === GameStage.WAITING || this.state.stage === GameStage.SHOWDOWN;

    // If it's an explicit leave (button click), OR we are between hands, remove physically
    if (isExplicit || isWaitingOrShowdown) {
      if (!player.isFolded) {
        player.isFolded = true;
        if (this.state.currentTurnIndex === playerIndex) {
          this.nextTurn();
        }
      }

      this.state.players.splice(playerIndex, 1);

      // Shift indexes correctly
      if (this.state.dealerIndex === playerIndex) {
        this.state.dealerIndex = this.state.players.length > 0 ? this.state.dealerIndex % this.state.players.length : 0;
      } else if (this.state.dealerIndex > playerIndex) {
        this.state.dealerIndex--;
      }
      
      if (this.state.currentTurnIndex > playerIndex) {
        this.state.currentTurnIndex--;
      }

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
    } else {
        // Just disconnection mid-game: mark offline and auto-fold if it's their turn
        if (!player.isFolded && this.state.currentTurnIndex === playerIndex) {
            player.isFolded = true;
            this.nextTurn();
        }
    }

    this.updateCreator();
    this.updateTurns();
  }

  private updateCreator() {
    const oldCreatorId = this.state.creatorId;
    const currentCreator = this.state.players.find(p => p.id === this.state.creatorId && p.isOnline);
    if (currentCreator) return;

    const firstOnline = this.state.players.find(p => p.isOnline);
    if (firstOnline) {
      this.state.creatorId = firstOnline.id;
      if (oldCreatorId !== this.state.creatorId) {
        console.log(`[Room ${this.state.roomId}] Host migrated to ${firstOnline.name}`);
      }
    }
  }

  private cleanupOfflinePlayers() {
     for (let i = this.state.players.length - 1; i >= 0; i--) {
        if (!this.state.players[i].isOnline) {
            this.removePlayer(this.state.players[i].id, true);
        }
    }
  }

  startGame(playerId: string) {
    this.cleanupOfflinePlayers();

    // Only creator can start
    if (playerId !== this.state.creatorId) return false;
    
    // Only allow players with chips to play
    const eligiblePlayers = this.state.players.filter(p => p.chips > 0 || p.isAllIn);
    if (eligiblePlayers.length < 2) return false;

    // Auto-fold/Spectator players with 0 chips
    this.state.players.forEach(p => {
      if (p.chips === 0) p.isFolded = true;
    });

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
      if (p.chips > 0) {
        p.cards = this.deck.draw(2).map(c => `${c.rank}${c.suit}`);
        p.isFolded = false;
        p.isAllIn = false;
        p.bet = 0;
        p.hasActed = false;
      } else {
        p.cards = [];
        p.isFolded = true;
        p.isAllIn = false;
      }
    });

    // Blinds logic
    const n = this.state.players.length;
    let sbIndex = (this.state.dealerIndex + 1) % n;
    let bbIndex = (this.state.dealerIndex + 2) % n;
    let utgIndex = (this.state.dealerIndex + 3) % n;

    if (n === 2) {
      sbIndex = this.state.dealerIndex;
      bbIndex = (this.state.dealerIndex + 1) % n;
      utgIndex = sbIndex;
    }
    
    this.handleBet(this.state.players[sbIndex].id, this.state.config.smallBlind);
    this.handleBet(this.state.players[bbIndex].id, this.state.config.bigBlind);

    this.state.lastRaiserIndex = bbIndex;
    this.state.currentTurnIndex = utgIndex;
    
    // Ensure we don't start turn on a folded/all-in player
    if (this.state.players[this.state.currentTurnIndex].isFolded || this.state.players[this.state.currentTurnIndex].isAllIn) {
      this.nextTurn();
    } else {
      this.resetTurnTimer();
      this.updateTurns();
    }
    return true;
  }

  action(playerId: string, type: 'fold' | 'call' | 'check' | 'raise', amount: number = 0) {
    const player = this.state.players[this.state.currentTurnIndex];
    if (player.id !== playerId || player.isAllIn) return false;

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
        const raiseAmount = Math.max(amount, this.state.minRaise);
        
        if (this.state.config.raiseLimit && this.state.config.raiseLimit > 0) {
          if (raiseAmount > this.state.config.raiseLimit) {
            return false;
          }
        }

        const totalRaiseTo = currentMaxBet + raiseAmount;
        const addedChips = totalRaiseTo - player.bet;
        
        // If raising more than chips, it's just an all-in call/raise
        const actualAdded = this.handleBet(playerId, addedChips);
        
        if (actualAdded > 0) {
            // Only update minRaise if the raise was "full" (not just a partial all-in)
            if (actualAdded === addedChips) {
                this.state.minRaise = Math.max(amount, this.state.minRaise);
                this.state.lastRaiserIndex = this.state.currentTurnIndex;
            }
            // World Rule: Reset everyone else's hasActed on full raise
            this.state.players.forEach((p, i) => {
                if (i !== this.state.currentTurnIndex && !p.isFolded && !p.isAllIn) {
                    p.hasActed = false;
                }
            });
        }
        break;
      case 'check':
        if (player.bet < currentMaxBet) return false;
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
    const playersStillIn = this.state.players.filter(p => !p.isFolded);
    const playersWhoCanAct = playersStillIn.filter(p => !p.isAllIn);
    
    // Check if hand is over early
    if (playersStillIn.length <= 1) {
        this.resolveWinner();
        return;
    }

    const currentMaxBet = Math.max(...this.state.players.map(p => p.bet));
    const everyoneActed = playersStillIn.every(p => p.hasActed || p.isAllIn);
    const betsEqualized = playersStillIn.every(p => p.bet === currentMaxBet || p.isAllIn);

    if (everyoneActed && betsEqualized) {
        this.nextStage();
    } else if (playersWhoCanAct.length === 0) {
        // Everyone is all-in but one person might be left? 
        // Actually if bets are equalized we transition. 
        // If one person is NOT all-in but everyone else is, that person must still act/match if needed.
        this.nextStage();
    } else {
        this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const p = this.state.players[this.state.currentTurnIndex];
        if (p.isFolded || p.isAllIn) {
            this.nextTurn();
            return;
        }
    }
    this.resetTurnTimer();
    this.updateTurns();
  }

  private nextStage() {
    this.state.players.forEach(p => {
        p.bet = 0;
        if (!p.isAllIn) p.hasActed = false;
    });
    this.state.minRaise = this.state.config.bigBlind;
    this.state.lastRaiserIndex = null;

    // If everyone or all but one is all-in, skip to showdown
    const activePlayers = this.state.players.filter(p => !p.isFolded);
    const canAct = activePlayers.filter(p => !p.isAllIn);

    if (canAct.length <= 1 && this.state.stage !== GameStage.SHOWDOWN && activePlayers.length >= 2) {
      // Just deal the rest and showdown
      while (this.state.stage !== GameStage.SHOWDOWN) {
        const prevStage = this.state.stage;
        this.dealNextCards();
        if (this.state.stage === prevStage) break; // Infinite loop safety
      }
      this.resolveWinner();
      return;
    }

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
        return;
    }

    // Post-flop turn start logic
    const n = this.state.players.length;
    let nextIndex = (this.state.dealerIndex + 1) % n;
    
    while (this.state.players[nextIndex].isFolded || this.state.players[nextIndex].isAllIn) {
        nextIndex = (nextIndex + 1) % n;
        if (nextIndex === (this.state.dealerIndex + 1) % n) break; // Circular safety
    }
    this.state.currentTurnIndex = nextIndex;
    this.resetTurnTimer();
    this.updateTurns();
  }

  private dealNextCards() {
    switch (this.state.stage) {
      case GameStage.PRE_FLOP:
        this.state.communityCards = this.deck.draw(3).map(c => `${c.rank}${c.suit}`);
        this.state.stage = GameStage.FLOP;
        break;
      case GameStage.FLOP:
      case GameStage.TURN:
        this.state.communityCards.push(...this.deck.draw(1).map(c => `${c.rank}${c.suit}`));
        this.state.stage = this.state.stage === GameStage.FLOP ? GameStage.TURN : GameStage.RIVER;
        break;
      case GameStage.RIVER:
        this.state.stage = GameStage.SHOWDOWN;
        break;
    }
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
        winningCards = evaluations[0].eval.cards;
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

    this.cleanupOfflinePlayers();

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
    this.updateTurns();
  }

  private updateTurns() {
    this.state.players.forEach((p, i) => {
      p.isTurn = i === this.state.currentTurnIndex;
      p.isDealer = i === this.state.dealerIndex;
    });
  }

  topUp(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;

    // Only allow if they have 0 chips and aren't blocking an active turn
    if (player.chips === 0) {
      player.chips = this.state.config.buyIn;
      player.isAllIn = false;
      this.playerStats[player.name] = player.chips;
      this.updateTurns();
      return true;
    }
    return false;
  }

  inflate(state: GameState) {
    this.state = state;
    // Restore player stats for consistent chips
    state.players.forEach(p => {
      this.playerStats[p.name] = p.chips;
    });
    this.updateTurns();
  }

  getState(): GameState {
    // Return a deep copy to ensure immutability outside
    return JSON.parse(JSON.stringify(this.state));
  }
}
