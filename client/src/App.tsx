import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, User, Users, Coins } from 'lucide-react';
import { GameStage, GameState } from './types/game';
import Table from './components/Table';
import Card from './components/Card';

// Always connect via the same origin so Nginx can proxy WebSocket to the backend
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:7777');

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Config State
  const [buyIn, setBuyIn] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [raiseLimit, setRaiseLimit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('game_update', (state: GameState) => {
      setGameState(state);
      setError(null);
    });
    
    newSocket.on('error', (msg: string) => {
      setError(msg);
      setJoined(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) return;
    socket?.emit('join_room', { roomId, name });
    setJoined(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomId) return;
    
    const config = {
      buyIn,
      smallBlind,
      bigBlind,
      raiseLimit: raiseLimit > 0 ? raiseLimit : undefined
    };

    socket?.emit('join_room', { roomId, name, config });
    setJoined(true);
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(7).toUpperCase();
    setRoomId(id);
  };

  const handleLeave = () => {
    if (socket && roomId) {
      socket.emit('leave_room', { roomId });
      setJoined(false);
      setGameState(null);
    }
  };

  const copyRoomId = () => {
    if (gameState?.roomId) {
      navigator.clipboard.writeText(gameState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!joined || !gameState) {
    return (
      <div className="layout-container h-screen bg-slate-950">
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-ui-gold px-8 py-6 sm:p-8 rounded-2xl sm:rounded-[2rem] w-full max-w-[300px] sm:max-w-md space-y-5 sm:space-y-8"
        >
          <div className="text-center space-y-3 pb-2">
            <motion.h1 
              initial={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-4xl sm:text-6xl font-black tracking-tighter"
            >
              <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">POKER</span>
              <span className="bg-gradient-to-br from-yellow-300 via-poker-gold to-yellow-700 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(195,163,91,0.6)] pr-2">WKD</span>
            </motion.h1>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-center justify-center gap-4"
            >
               <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-poker-gold/50" />
               <p className="text-poker-gold text-[9px] uppercase tracking-[0.8em] font-black opacity-80 drop-shadow-md">
                 High Roller
               </p>
               <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-poker-gold/50" />
            </motion.div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl gap-1.5">
            <button 
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-3 rounded-lg text-[9px] uppercase tracking-[0.2em] font-black transition-all ${mode === 'join' ? 'bg-poker-gold text-slate-950 shadow-md' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              Join Table
            </button>
            <button 
              onClick={() => {
                setMode('create');
                generateRoomId();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-[9px] uppercase tracking-[0.2em] font-black transition-all ${mode === 'create' ? 'bg-poker-gold text-slate-950 shadow-md' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              Create Table
            </button>
          </div>

          <motion.form layout onSubmit={mode === 'join' ? handleJoin : handleCreate} className="space-y-5 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-white/30 font-black ml-1">
                  <User className="w-2.5 h-2.5 text-poker-gold/60" />
                  Identity
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Lian"
                  className="input-premium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-white/30 font-black ml-1">
                  <Users className="w-2.5 h-2.5 text-poker-gold/60" />
                  Reference
                </label>
                <div className="flex gap-2 h-[42px] sm:h-[52px]">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="ROOM ID"
                    className="input-premium flex-1 font-mono uppercase tracking-widest text-center"
                    required
                    readOnly={mode === 'create'}
                  />
                  <AnimatePresence>
                    {mode === 'create' && (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        type="button"
                        onClick={generateRoomId}
                        className="btn-outline aspect-square p-0 flex items-center justify-center overflow-hidden"
                        title="Generate ID"
                      >
                        <RefreshCw className="w-5 h-5 text-poker-gold" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-2">
                <div className={mode === 'create' ? "space-y-4" : "space-y-4 opacity-0 pointer-events-none select-none"}>
                  <button 
                    type="button"
                    onClick={() => mode === 'create' && setShowAdvanced(!showAdvanced)}
                    className="text-[10px] uppercase tracking-[0.2em] text-poker-gold/80 font-black flex items-center gap-2 hover:text-poker-gold transition-all py-1"
                  >
                    {showAdvanced && mode === 'create' ? '− Hide Settings' : '+ Advanced Settings'}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && mode === 'create' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4 overflow-hidden pb-2"
                      >
                         <div className="space-y-2 col-span-2">
                            <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Initial Buy-In ($)</label>
                            <input 
                              type="number" 
                              value={buyIn} 
                              onChange={(e) => setBuyIn(parseInt(e.target.value))}
                              className="input-premium-small"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Small Blind ($)</label>
                            <input 
                              type="number" 
                              value={smallBlind} 
                              onChange={(e) => setSmallBlind(parseInt(e.target.value))}
                              className="input-premium-small"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Big Blind ($)</label>
                            <input 
                              type="number" 
                              value={bigBlind} 
                              onChange={(e) => setBigBlind(parseInt(e.target.value))}
                              className="input-premium-small"
                            />
                         </div>
                         <div className="space-y-2 col-span-2">
                            <label className="text-[9px] uppercase tracking-widest text-white/30 font-black ml-1">Max Raise ($) (0 = No Limit)</label>
                            <input 
                              type="number" 
                              value={raiseLimit} 
                              onChange={(e) => setRaiseLimit(parseInt(e.target.value))}
                              className="input-premium-small"
                            />
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-lg text-center font-bold overflow-hidden mt-4"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={!socket?.connected}
              className="btn-gold w-full text-[11px] sm:text-[12px] font-black py-3 sm:py-4 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_15px_30px_rgba(195,163,91,0.2)]"
            >
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40 opacity-50" />
              <span className="relative z-10 tracking-[0.3em] uppercase drop-shadow-md">
                {joined && !gameState ? 'ESTABLISHING LINK...' : mode === 'join' ? 'ENTER ARENA' : 'INITIALIZE TABLE'}
              </span>
            </button>
          </motion.form>
          
          <div className="text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-medium">
              {!socket?.connected ? 'Connecting to Master Tower...' : 'Verified Encrypted Session'}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 1. Identify local player
  const me = gameState.players.find((p: any) => p.id === socket?.id);

  // 2. Seating Logic: Rotate players so "me" is always at the bottom (index 0)
  // This is a "Senior" professional pattern for poker apps.
  let seatedPlayers = [...gameState.players];
  if (me) {
    const meIndex = seatedPlayers.findIndex(p => p.id === me.id);
    if (meIndex !== -1) {
      // Rotate array so meIndex becomes 0
      const head = seatedPlayers.slice(meIndex);
      const tail = seatedPlayers.slice(0, meIndex);
      seatedPlayers = [...head, ...tail];
    }
  }

  return (
    <div className="layout-container h-screen bg-slate-950 select-none overflow-hidden relative">
      {/* Absolute Centered Table - Shifted Up on Mobile */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full flex items-center justify-center pointer-events-auto mobile-hud-shift">
          <Table 
            gameState={{ ...gameState, players: seatedPlayers }} 
            myId={socket?.id || ''} 
            onAction={(type: string, amount?: number) => {
              if (type === 'start_game') {
                socket?.emit('start_game', { roomId: gameState.roomId });
              } else if (type === 'reset_game') {
                socket?.emit('reset_game', { roomId: gameState.roomId });
              } else {
                socket?.emit('action', { roomId: gameState.roomId, type, amount });
              }
            }} 
          />
        </div>
      </div>

      {/* Floating UI Elements - Responsive Positioning */}
      {/* Floating UI Elements - Safe Area Support for iOS */}
      <div className="absolute top-0 left-0 right-0 z-50 p-safe-top px-4 md:px-8 flex items-start justify-between pointer-events-none">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyRoomId}
          className="glass-ui-gold px-3 py-1.5 md:px-4 md:py-2 rounded-full flex flex-col items-center justify-center border border-poker-gold/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-pointer group relative overflow-hidden pointer-events-auto"
        >
          <div className="absolute inset-0 bg-poker-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span 
                key="copied"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-poker-gold font-black py-1 md:py-1.5"
              >
                Copied!
              </motion.span>
            ) : (
              <motion.div 
                key="id"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <span className="text-[6px] md:text-[7px] uppercase tracking-[0.3em] text-poker-gold/50 font-black mb-0 md:mb-0.5 ml-0.5">Reference</span>
                <span className="text-[9px] md:text-[11px] font-black text-white/80 tracking-widest font-mono uppercase">{gameState.roomId}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex gap-2 md:gap-4 pointer-events-auto">
          {me?.chips === 0 && (gameState.stage === GameStage.WAITING || gameState.stage === GameStage.SHOWDOWN) && (
            <button 
              onClick={() => socket?.emit('top_up', { roomId: gameState.roomId })}
              className="flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full bg-poker-gold text-slate-950 hover:brightness-105 transition-all text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black shadow-lg"
            >
              Top Up
            </button>
          )}
          <button 
            onClick={handleLeave}
            className="flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 md:bottom-10 md:right-10 md:left-auto z-50">
        <ActionBar 
          player={me} 
          gameState={gameState} 
          onAction={(type: string, amount?: number) => {
            if (type === 'start_game') {
              socket?.emit('start_game', { roomId: gameState.roomId });
            } else if (type === 'reset_game') {
              socket?.emit('reset_game', { roomId: gameState.roomId });
            } else {
              socket?.emit('action', { roomId: gameState.roomId, type, amount });
            }
          }} 
        />
      </div>

    </div>
  );
}

const BetSlider: React.FC<{ 
  min: number; 
  max: number; 
  value: number; 
  onChange: (val: number) => void;
  pot: number;
}> = ({ min, max, value, onChange, pot }) => {
  return (
    <div className="space-y-2 md:space-y-3 px-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/30 font-black">Bet Amount</span>
        <span className="text-sm md:text-xl font-black text-poker-gold shadow-sm">${value}</span>
      </div>
      
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="gold-slider h-1"
      />

      <div className="grid grid-cols-3 gap-2 md:gap-2">
        {[
          { label: 'Min', val: min },
          { label: '1/3', val: Math.min(max, Math.max(min, Math.floor(pot / 3))) },
          { label: '1/2', val: Math.min(max, Math.max(min, Math.floor(pot / 2))) },
          { label: '3/4', val: Math.min(max, Math.max(min, Math.floor(pot * 0.75))) },
          { label: 'Pot', val: Math.min(max, Math.max(min, pot)) },
          { label: 'All', val: max }
        ].map((p, i) => (
          <button 
            key={i}
            onClick={() => onChange(p.val)}
            className="bg-white/5 border border-white/5 text-[9px] md:text-[9px] font-black uppercase tracking-tighter py-2.5 md:py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const Timer = ({ expiresAt }: { expiresAt: number }) => {
  const [timeLeft, setTimeLeft] = React.useState(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const color = timeLeft < 10 ? 'text-red-500' : 'text-poker-gold';

  return (
    <div className={`flex items-center gap-2 font-black ${color}`}>
      <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} />
      <span className="text-sm tracking-tighter">{timeLeft}s</span>
    </div>
  );
};

const ActionBar = ({ player, gameState, onAction }: { player: any, gameState: any, onAction: (type: string, amount?: number) => void }) => {
    // Only show if it's the local player's turn and they aren't all-in
    if (!player || !player.isTurn || player.isAllIn) return null;

    const maxBet = Math.max(...gameState.players.map((p: any) => p.bet), 0);
    const callAmount = maxBet - player.bet;
    const minRaise = gameState.minRaise || 20;
    
    // Total amount needed to raise (callAmount + minRaise)
    const minRaiseTotal = callAmount + minRaise;
    const maxPossibleBet = player.chips;

    // Respect Raise Limit if configured
    let sliderMax = maxPossibleBet;
    if (gameState.config.raiseLimit && gameState.config.raiseLimit > 0) {
      sliderMax = Math.min(maxPossibleBet, callAmount + gameState.config.raiseLimit);
    }

    // Safety: ensure sliderMax is at least minRaiseTotal
    const sliderMin = Math.min(sliderMax, minRaiseTotal);

    const [betAmount, setBetAmount] = React.useState(Math.min(sliderMax, minRaiseTotal));
    const [isBettingOpen, setIsBettingOpen] = React.useState(false);

    // Sync betAmount if it falls out of bounds
    React.useEffect(() => {
      setBetAmount(prev => Math.min(sliderMax, Math.max(prev, sliderMin)));
    }, [sliderMin, sliderMax]);

    // Reset drawer when turn changes
    React.useEffect(() => {
      if (player.isTurn) setIsBettingOpen(false);
    }, [player.isTurn]);

    const canCheck = callAmount === 0;

    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="action-bar-mobile md:block md:glass-ui-gold md:p-5 md:rounded-2xl flex flex-col gap-2 md:gap-5 md:w-80 md:shadow-[0_20px_50px_rgba(0,0,0,0.6)] md:border md:border-white/5 overflow-hidden"
        >
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">
                {isBettingOpen ? 'Adjust Raise' : 'Action Required'}
              </span>
              {gameState.turnExpiresAt && <Timer expiresAt={gameState.turnExpiresAt} />}
            </div>

            <AnimatePresence mode="wait">
              {isBettingOpen ? (
                <motion.div 
                  key="betting"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  <BetSlider 
                    min={sliderMin} 
                    max={sliderMax} 
                    value={betAmount} 
                    onChange={setBetAmount}
                    pot={gameState.pot}
                  />
                  <div className="grid grid-cols-2 gap-2 pb-1">
                    <button 
                      onClick={() => setIsBettingOpen(false)}
                      className="bg-white/5 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl border border-white/5"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        onAction('raise', betAmount - maxBet);
                        setIsBettingOpen(false);
                      }}
                      className="bg-poker-gold text-slate-950 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                      Confirm ${betAmount}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2 md:gap-4"
                >
                  {/* Desktop Betting Controls */}
                  <div className="hidden md:block">
                    {sliderMax > callAmount && (
                      <BetSlider 
                        min={sliderMin} 
                        max={sliderMax} 
                        value={betAmount} 
                        onChange={setBetAmount}
                        pot={gameState.pot}
                      />
                    )}
                  </div>

                  <div className="h-[1px] bg-white/5 w-full -my-1 hidden md:block" />

                  <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
                      <button 
                          onClick={() => onAction('fold')}
                          className="bg-red-500/10 border border-red-500/20 text-red-500 font-black py-3 md:py-4 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[10px] md:text-xs uppercase tracking-wider"
                      >
                          Fold
                      </button>
                      
                      <button 
                          onClick={() => onAction(canCheck ? 'check' : 'call')}
                          className="bg-white text-slate-950 font-black py-3 md:py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all text-[10px] md:text-xs uppercase tracking-wider shadow-lg disabled:opacity-20"
                          disabled={!canCheck && callAmount > player.chips}
                      >
                          {canCheck ? 'Check' : `Call $${callAmount}`}
                      </button>

                      <button 
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              setIsBettingOpen(true);
                            } else {
                              onAction('raise', betAmount - maxBet);
                            }
                          }}
                          className="btn-gold py-3 md:py-5 rounded-xl text-[10px] md:text-xs uppercase tracking-wider font-black active:scale-[0.98] transition-all"
                      >
                          {window.innerWidth < 768 ? 'Raise' : (maxBet === 0 ? `Bet $${betAmount}` : `Raise to $${betAmount}`)}
                      </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
    );
};



export default App;
