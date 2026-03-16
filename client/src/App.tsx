import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from './types/game';
import Table from './components/Table';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [name, setName] = useState('');
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

  const joinGame = () => {
    if (!name) return;
    socket?.emit('join_room', { roomId: 'weekend-poker', name });
    setJoined(true);
  };

  const startGame = () => {
    socket?.emit('start_game', { roomId: 'weekend-poker' });
  };

  const handleAction = (type: string, amount: number = 0) => {
    socket?.emit('action', { roomId: 'weekend-poker', type, amount });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Premium Outer Rim / Frame */}
      <div className="w-full h-full max-w-5xl max-h-[800px] bg-slate-900 rounded-[3rem] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center">
        
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),_transparent_80%)] from-poker-gold/20"></div>

        {!joined ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center px-8 text-center z-10"
          >
            <div className="mb-8 relative">
              <div className="absolute inset-0 blur-3xl bg-poker-gold/20 -z-10 animate-pulse"></div>
              <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] mb-2 tracking-tighter">
                POKER<span className="text-poker-gold italic">WKD</span>
              </h1>
              <span className="text-poker-gold font-bold tracking-[0.5em] text-xs uppercase opacity-80">Weekend Edition</span>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 w-full outline-none focus:border-poker-gold focus:bg-white/10 transition-all text-xl font-bold text-center"
                />
                <button 
                  onClick={joinGame}
                  className="w-full bg-poker-gold text-poker-green-dark font-black px-12 py-5 rounded-2xl shadow-[0_8px_0_0_#b8860b] active:shadow-none active:translate-y-2 transition-all text-2xl uppercase tracking-widest hover:brightness-110"
                >
                  Join Table
                </button>
            </div>

            <p className="mt-8 text-white/30 text-sm font-medium italic">
                Grab your chips, it's poker time.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {gameState ? (
              <motion.div 
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col"
              >
                <Table 
                  gameState={gameState} 
                  myId={socket?.id || ''} 
                  onAction={handleAction} 
                />
                
                {gameState.stage === 'WAITING' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4">
                    <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm">
                        Waiting for players... ({gameState.players.length}/6)
                    </div>
                    {gameState.players.length >= 2 && (
                        <button 
                            onClick={startGame}
                            className="bg-white text-poker-green-dark font-black px-12 py-4 rounded-2xl shadow-2xl text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                            Start Game
                        </button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-poker-gold font-black text-2xl animate-pulse tracking-widest"
               >
                 CONNECTING...
               </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default App;
