import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, User, Users, Coins } from 'lucide-react';
import { GameState } from './types/game';
import Table from './components/Table';
import Card from './components/Card';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('game_update', (state: GameState) => {
      setGameState(state);
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

  if (!joined || !gameState) {
    return (
      <div className="layout-container h-screen bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-ui-gold p-12 rounded-[3.5rem] w-full max-w-lg space-y-12"
        >
          <div className="text-center space-y-3">
            <h1 className="text-7xl font-black tracking-tighter text-white">
              POKER<span className="text-poker-gold">WKD</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
               <div className="h-[1px] w-8 bg-poker-gold/40" />
               <p className="text-poker-gold text-[10px] uppercase tracking-[0.5em] font-black">
                 Elite Series
               </p>
               <div className="h-[1px] w-8 bg-poker-gold/40" />
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-2">
                <User className="w-3 h-3 text-poker-gold" />
                Player Identity
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Phil Ivey"
                className="input-premium"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 font-black ml-2">
                <Users className="w-3 h-3 text-poker-gold" />
                Table Reference
              </label>
              <div className="flex gap-3 h-[68px]">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="ROOM-ID"
                  className="input-premium flex-1 font-mono uppercase tracking-widest text-center"
                  required
                />
                <button
                  type="button"
                  onClick={generateRoomId}
                  className="btn-outline aspect-square p-0 flex items-center justify-center"
                  title="Generate ID"
                >
                  <RefreshCw className="w-5 h-5 text-poker-gold" />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!socket?.connected}
              className="btn-gold w-full text-sm font-black pt-6 pb-6 disabled:opacity-50 disabled:grayscale transition-all"
            >
              {joined && !gameState ? 'Syncing...' : 'Enter Arena'}
            </button>
          </form>
          
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
      {/* Absolute Centered Table */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full flex items-center justify-center pointer-events-auto">
          <Table 
            gameState={{ ...gameState, players: seatedPlayers }} 
            myId={socket?.id} 
            onAction={(type: string, amount?: number) => {
              if (type === 'start_game') {
                socket?.emit('start_game', { roomId: gameState.roomId });
              } else {
                socket?.emit('action', { roomId: gameState.roomId, type, amount });
              }
            }} 
          />
        </div>
      </div>

      {/* Floating UI Elements */}
      <div className="absolute top-8 left-8 z-50">
        <div className="glass-ui-gold px-6 py-3 rounded-full flex flex-col items-center justify-center border border-poker-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
           <span className="text-[8px] uppercase tracking-[0.4em] text-poker-gold/60 font-black mb-0.5 ml-1">Table Ref</span>
           <span className="text-sm font-black text-white tracking-widest font-mono uppercase">{gameState.roomId}</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={handleLeave}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase tracking-[0.3em] font-black"
        >
          Leave Table
        </button>
      </div>

      <div className="absolute bottom-10 right-10 z-50">
        <ActionBar 
          player={me} 
          gameState={gameState} 
          onAction={(type: string, amount?: number) => {
            if (type === 'start_game') {
              socket?.emit('start_game', { roomId: gameState.roomId });
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
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-white/30 font-black">Bet</span>
        <span className="text-base font-black text-poker-gold shadow-sm">${value}</span>
      </div>
      
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="gold-slider h-1"
      />

      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Min', val: min },
          { label: '1/2', val: Math.min(max, Math.max(min, Math.floor(pot / 2))) },
          { label: 'Pot', val: Math.min(max, Math.max(min, pot)) },
          { label: 'All', val: max }
        ].map((p, i) => (
          <button 
            key={i}
            onClick={() => onChange(p.val)}
            className="bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-tighter py-1 rounded hover:bg-white/10 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ActionBar: React.FC<any> = ({ player, gameState, onAction }) => {
    // Only show if it's the local player's turn
    if (!player || !player.isTurn) return null;

    const maxBet = Math.max(...gameState.players.map((p: any) => p.bet), 0);
    const callAmount = maxBet - player.bet;
    const minRaise = gameState.minRaise || 20;
    
    // Total amount needed to raise (callAmount + minRaise)
    const minRaiseTotal = callAmount + minRaise;
    const maxPossbileBet = player.chips; // All-in

    const [betAmount, setBetAmount] = React.useState(Math.min(maxPossbileBet, minRaiseTotal));

    // Sync betAmount if it falls out of bounds (e.g. after someone else raises)
    React.useEffect(() => {
      setBetAmount(prev => Math.min(maxPossbileBet, Math.max(prev, minRaiseTotal)));
    }, [minRaiseTotal, maxPossbileBet]);

    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-ui-gold p-3 rounded-2xl flex flex-col gap-3 w-56 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/5"
        >
            {/* Betting Controls */}
            {maxPossbileBet > callAmount && (
              <BetSlider 
                min={minRaiseTotal} 
                max={maxPossbileBet} 
                value={betAmount} 
                onChange={setBetAmount}
                pot={gameState.pot}
              />
            )}

            <div className="h-[1px] bg-white/5 w-full -my-1" />

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                    onClick={() => onAction('fold')}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-black py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all text-[9px] uppercase tracking-wider"
                >
                    Fold
                </button>
                <button 
                    onClick={() => onAction('check')}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-2 rounded-lg hover:bg-white/10 transition-all text-[9px] uppercase tracking-wider disabled:opacity-20"
                    disabled={callAmount > 0}
                >
                    Check
                </button>
              </div>
              
              {callAmount > 0 && (
                <button 
                    onClick={() => onAction('call')}
                    className="w-full bg-white text-slate-950 font-black py-2.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all text-[9px] uppercase tracking-[0.2em] shadow-lg"
                >
                    Call ${callAmount}
                </button>
              )}

              <button 
                  onClick={() => onAction('raise', betAmount - callAmount)}
                  className="w-full btn-gold py-2.5 rounded-lg text-[9px] uppercase tracking-[0.2em] font-black group relative overflow-hidden"
              >
                  <span className="relative z-10">
                    {maxBet === 0 ? `Bet $${betAmount}` : `Raise to $${betAmount}`}
                  </span>
              </button>
            </div>
        </motion.div>
    );
};



export default App;
