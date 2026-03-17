import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, User, Users } from 'lucide-react';
import { GameState } from './types/game';
import Table from './components/Table';

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
            onAction={(type: string, amount?: number) => socket?.emit('action', { roomId: gameState.roomId, type, amount })} 
          />
        </div>
      </div>

      {/* Floating UI Elements */}
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
          onAction={(type: string, amount?: number) => socket?.emit('action', { roomId: gameState.roomId, type, amount })} 
        />
      </div>

      <AnimatePresence>
        {gameState.stage === 'WAITING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl"
          >
            <div className="glass-ui-gold p-16 rounded-[4rem] text-center space-y-10 max-w-sm w-full mx-4 shadow-[0_0_120px_rgba(0,0,0,0.8)] border-poker-gold/10">
               <div className="relative w-24 h-24 mx-auto">
                 <RefreshCw className="w-full h-full text-poker-gold animate-spin-slow opacity-10" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-poker-gold rounded-full animate-pulse shadow-[0_0_20px_var(--poker-gold)]" />
                 </div>
               </div>
              <div className="space-y-4">
                <h2 className="text-poker-gold text-xs uppercase tracking-[0.6em] font-black opacity-60">
                  Waiting Zone
                </h2>
                <div className="flex flex-col items-center">
                   <p className="text-white text-4xl font-black tracking-tighter">
                    {gameState.players.length}
                  </p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                    Players Seated
                  </p>
                </div>
              </div>
              
              {gameState.players.length >= 2 && (
                <button 
                  onClick={() => socket?.emit('start_game', { roomId: gameState.roomId })}
                  className="btn-gold w-full text-sm font-black py-6 flex items-center justify-center gap-3"
                >
                  <Play className="fill-current w-4 h-4" />
                  Initiate Hand
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ActionBar: React.FC<any> = ({ player, gameState, onAction }) => {
    // Only show if it's the local player's turn
    if (!player || !player.isTurn) return null;

    const maxBet = Math.max(...gameState.players.map((p: any) => p.bet), 0);
    const callAmount = maxBet - player.bet;

    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-ui-gold p-4 rounded-3xl flex flex-col gap-4 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
        >
            <div className="flex items-center justify-between px-2 pt-1">
               <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Call Amount</span>
               <span className="text-lg font-black text-poker-gold">${callAmount}</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                    onClick={() => onAction('fold')}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-black py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase tracking-widest"
                >
                    Fold
                </button>
                <button 
                    onClick={() => onAction('check')}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-3 rounded-xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                    disabled={callAmount > 0}
                    style={{ opacity: callAmount > 0 ? 0.3 : 1 }}
                >
                    Check
                </button>
              </div>
              
              <button 
                  onClick={() => onAction('call')}
                  className="w-full bg-white text-slate-950 font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] uppercase tracking-[0.4em] shadow-xl"
                  style={{ display: callAmount > 0 ? 'block' : 'none' }}
              >
                  Call ${callAmount}
              </button>

              <button 
                  onClick={() => onAction('raise', 50)}
                  className="w-full btn-gold py-4 rounded-xl text-[10px] uppercase tracking-[0.3em] font-black"
              >
                  Raise
              </button>
            </div>
        </motion.div>
    );
};

export default App;
