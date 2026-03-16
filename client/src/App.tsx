import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
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
    console.log('App: Initializing socket connection to', SERVER_URL);
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('App: Socket connected!', newSocket.id);
    });

    newSocket.on('game_update', (state: GameState) => {
      console.log('App: Game update received', state);
      setGameState(state);
    });

    newSocket.on('connect_error', (err) => {
      console.error('App: Socket connection error:', err);
    });

    return () => {
      console.log('App: Cleaning up socket');
      newSocket.close();
    };
  }, []);

  const joinGame = () => {
    if (!name || !roomId) return;
    console.log('App: Joining game', roomId, 'as', name);
    socket?.emit('join_room', { roomId, name });
    setJoined(true);
  };

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
  };

  const startGame = () => {
    socket?.emit('start_game', { roomId });
  };

  const handleAction = (type: string, amount: number = 0) => {
    socket?.emit('action', { roomId, type, amount });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Premium Outer Rim / Frame */}
      <div className="w-full h-full max-w-5xl max-h-[800px] bg-slate-900 rounded-[3rem] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center">
        
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),_transparent_80%)] from-poker-gold/20"></div>

        {!joined ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center px-8 text-center z-10 w-full max-w-md"
          >
            <div className="mb-10 relative">
              <div className="absolute inset-0 blur-3xl bg-poker-gold/10 -z-10 animate-pulse"></div>
              <h1 className="text-7xl font-black text-white mb-2 tracking-tighter">
                POKER<span className="text-poker-gold">WKD</span>
              </h1>
              <div className="h-1 w-20 bg-poker-gold mx-auto rounded-full mb-2"></div>
              <span className="text-poker-gold/60 font-bold tracking-[0.4em] text-[10px] uppercase">Elite Poker Series</span>
            </div>

            <div className="w-full flex flex-col gap-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
                <div className="flex flex-col gap-1.5 align-start text-left">
                  <label className="text-[10px] font-bold text-white/40 uppercase ml-4 tracking-widest">Player Identity</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Phil Ivey" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 w-full outline-none focus:border-poker-gold/50 focus:bg-slate-900 transition-all text-lg font-bold"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 align-start text-left">
                  <label className="text-[10px] font-bold text-white/40 uppercase ml-4 tracking-widest">Table Reference</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ROOM-ID" 
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-950 border-2 border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-poker-gold/50 focus:bg-slate-900 transition-all text-lg font-bold uppercase tracking-widest"
                    />
                    <button 
                      onClick={createRoom}
                      className="bg-poker-gold/10 border-2 border-poker-gold/20 text-poker-gold font-bold px-5 py-4 rounded-2xl hover:bg-poker-gold/20 transition-all text-xs uppercase tracking-tighter"
                    >
                      New
                    </button>
                  </div>
                </div>

                <button 
                  onClick={joinGame}
                  disabled={!name || !roomId}
                  className="w-full bg-poker-gold text-poker-green-dark font-black px-12 py-5 rounded-2xl shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale transition-all text-xl uppercase tracking-[0.2em] mt-4"
                >
                  Enter Arena
                </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {gameState ? (
              <div className="w-full h-full relative flex flex-col overflow-hidden">
                <Table 
                  gameState={gameState} 
                  myId={socket?.id || ''} 
                  onAction={handleAction} 
                />
                
                {/* Fixed Footer Actions */}
                <ActionBar 
                    player={gameState.players.find(p => p.id === socket?.id)}
                    gameState={gameState}
                    onAction={handleAction}
                />

                {gameState.stage === 'WAITING' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-poker-gold blur-2xl opacity-20 animate-pulse"></div>
                        <div className="w-20 h-20 rounded-full border-4 border-poker-gold/20 flex items-center justify-center relative">
                           <div className="w-12 h-12 rounded-full border-4 border-poker-gold border-t-transparent animate-spin"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <h3 className="text-poker-gold font-black uppercase tracking-[0.3em] text-sm mb-1">Waiting Zone</h3>
                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
                            {gameState.players.length} / 10 Players Seated
                        </p>
                      </div>
                      
                      {gameState.players.length >= 2 && (
                          <button 
                              onClick={startGame}
                              className="bg-white text-poker-green-dark font-black px-12 py-4 rounded-2xl shadow-xl text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all mt-2"
                          >
                              Initiate Hand
                          </button>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
               >
                 <div className="w-8 h-8 rounded-full border-2 border-poker-gold border-t-transparent animate-spin"></div>
                 <div className="text-poker-gold font-black text-xs tracking-[0.5em] uppercase">SYNCHRONIZING...</div>
               </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}


interface ActionBarProps {
    player: any;
    gameState: any;
    onAction: (type: string, amount?: number) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ player, gameState, onAction }) => {
    if (!player || !player.isTurn) return null;

    const me = player;
    const maxBet = Math.max(...gameState.players.map((p: any) => p.bet));
    const callAmount = maxBet - me.bet;

    return (
        <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-3 rounded-3xl shadow-2xl flex items-center gap-3 w-[90%] max-w-lg"
        >
            <button 
                onClick={() => onAction('fold')}
                className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-xs uppercase tracking-widest"
            >
                Fold
            </button>
            <button 
                onClick={() => onAction('call')}
                className="flex-[2] bg-white border border-white text-slate-950 font-black py-4 rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-[0.2em]"
            >
                {callAmount > 0 ? `Call $${callAmount}` : 'Check'}
            </button>
            <button 
                onClick={() => onAction('raise', 50)}
                className="flex-1 bg-poker-gold text-poker-green-dark font-black py-4 rounded-2xl shadow-lg hover:brightness-110 transition-all text-xs uppercase tracking-widest"
            >
                Raise
            </button>
        </motion.div>
    );
};

export default App;
