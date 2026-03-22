import React from 'react';
import { GameState } from '../types/game';
import Player from './Player';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Play, RefreshCw, Users } from 'lucide-react';

interface TableProps {
  gameState: GameState;
  myId: string;
  onAction: (type: string, amount?: number) => void;
}

const Table: React.FC<TableProps> = ({ gameState, myId, onAction }) => {
  // 1. Reorder players so "Hero" (isMe) is always at the bottom center
  const heroIndex = gameState.players.findIndex(p => p.id === myId);
  const reorderedPlayers = heroIndex !== -1
    ? [...gameState.players.slice(heroIndex), ...gameState.players.slice(0, heroIndex)]
    : gameState.players;

  // 2. Map players to fixed 8-slot "Seating Chart"
  const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7];

  // Calculate relative seat index based on reordered index and total players
  // This ensures even distribution across the 8 available slots
  const playersWithSeats = reorderedPlayers.map((player, idx) => {
    // For Hero (idx 0), we always want seat 0
    if (idx === 0) return { ...player, seatIndex: 0 };

    // For others, distribute across the remaining seats
    const seatMapIdx = Math.floor((idx / (reorderedPlayers.length || 1)) * availableSeats.length);
    return { ...player, seatIndex: availableSeats[Math.min(seatMapIdx, availableSeats.length - 1)] };
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">

      {/* 1. Geometric Anchor - The Table Base */}
      <div
        className="relative pointer-events-auto"
        style={{ width: 'var(--table-width)', height: 'var(--table-height)' }}
      >

        {/* Table Frame (3D Depth) */}
        <div className="absolute -inset-4 bg-slate-900 rounded-[14rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-b-[8px] border-black/40"></div>

        {/* Leather Rim Buffer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[13.5rem] p-3 shadow-inner flex items-center justify-center border border-white/5">

          {/* Main Felt Play Area (Geometric Center) */}
          <div className="relative w-full h-full bg-[#1a472a] rounded-[12.5rem] inner-shadow-table overflow-hidden border-2 border-black/20">

            {/* Center Felt Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(41,120,60,0.4)_0%,_transparent_70%)] opacity-60" />

            {/* Total Pot - Luxury Floating Badge */}

            {/* Integrated Waiting / Showdown Control Zone */}
            <AnimatePresence>
              {(gameState.stage === 'WAITING' || gameState.stage === 'SHOWDOWN') && (
                <div className={`absolute inset-0 flex items-center justify-center z-50 transition-all duration-700 ${gameState.stage === 'SHOWDOWN' ? '-translate-y-40' : ''}`}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="flex flex-col items-center gap-6 max-w-xs text-center"
                  >
                    {gameState.stage === 'WAITING' ? (
                      <>
                        <div className="relative w-16 h-16">
                          <RefreshCw className="w-full h-full text-poker-gold/10 animate-spin-slow" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Users className="w-6 h-6 text-poker-gold" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-0.5">
                            <h2 className="text-poker-gold text-[8px] uppercase tracking-[0.4em] font-black opacity-50">
                              Awaiting Athletes
                            </h2>
                            <div className="flex items-center justify-center gap-1.5 text-white/30">
                              <span className="text-[7px] uppercase tracking-widest font-black">Room:</span>
                              <span className="text-[9px] font-mono font-black text-poker-gold/60 tracking-widest uppercase">{gameState.roomId}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <p className="text-white text-4xl font-black tracking-tighter opacity-80">
                              {gameState.players.length}
                            </p>
                            <p className="text-poker-gold/30 text-[8px] uppercase tracking-[0.2em] font-black">
                              Seated
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 mt-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          <span className="text-poker-gold/40 text-[7px] uppercase tracking-[0.4em] font-black mb-1">
                            Victory
                          </span>
                          <h2 className="text-white text-3xl md:text-4xl font-black tracking-tighter uppercase italic drop-shadow-2xl">
                            {gameState.lastWinner?.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-px w-4 bg-poker-gold/20" />
                            <span className="text-poker-gold text-[10px] uppercase tracking-[0.2em] font-bold">
                              {gameState.lastWinner?.handName}
                            </span>
                            <div className="h-px w-4 bg-poker-gold/20" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {myId === gameState.creatorId && (
                      <div className="mt-6 flex flex-col items-center">
                        <button
                          onClick={() => onAction(gameState.stage === 'SHOWDOWN' ? 'reset_game' : 'start_game')}
                          disabled={(gameState.players.length < 2 && gameState.stage === 'WAITING')}
                          className="group relative flex items-center justify-center p-0.5 rounded-full overflow-hidden transition-all active:scale-95 disabled:opacity-20"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-poker-gold to-yellow-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="relative bg-slate-950 px-5 py-2 rounded-full flex items-center gap-2 border border-white/5">
                            <Play className="w-3 h-3 text-poker-gold fill-current" />
                            <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em]">
                              {gameState.stage === 'SHOWDOWN' ? 'Next' : 'Start'}
                            </span>
                          </div>
                        </button>
                        {gameState.stage === 'WAITING' && gameState.players.length < 2 && (
                          <p className="text-[7px] text-poker-gold/30 uppercase tracking-[0.2em] font-black animate-pulse">
                            Awaiting Competitor
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>


            {/* Community Cards - Centered & Responsive Gap */}
            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 md:gap-2">
              {[0, 1, 2, 3, 4].map(idx => (
                <div key={idx} className="card-socket relative flex items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    {gameState.communityCards[idx] && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          y: gameState.lastWinner?.cards.includes(gameState.communityCards[idx]) ? -15 : 0
                        }}
                        className="absolute inset-0"
                      >
                        <Card code={gameState.communityCards[idx]} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>

          {/* Total Pot - Luxury Floating Badge (Moved outside overflow-hidden felt) */}
          <AnimatePresence>
            {gameState.stage !== 'WAITING' && (
              <div className="absolute top-[32%] sm:top-[30%] max-sm:top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-1000"
                style={gameState.stage === 'SHOWDOWN' && gameState.lastWinner ? {
                  top: (() => {
                    const winner = playersWithSeats.find(p => p.name === gameState.lastWinner?.name);
                    if (!winner) return '20%';
                    const SEAT_MAP: Record<number, { left: number; top: number }> = {
                      0: { left: 50, top: 100 }, 1: { left: 15, top: 95 }, 2: { left: 0, top: 70 },
                      3: { left: 0, top: 30 }, 4: { left: 15, top: 5 }, 5: { left: 50, top: 0 },
                      6: { left: 85, top: 5 }, 7: { left: 100, top: 30 }, 8: { left: 100, top: 70 }, 9: { left: 85, top: 95 }
                    };
                    return `${SEAT_MAP[winner.seatIndex]?.top || 50}%`;
                  })(),
                  left: (() => {
                    const winner = playersWithSeats.find(p => p.name === gameState.lastWinner?.name);
                    if (!winner) return '50%';
                    const SEAT_MAP: Record<number, { left: number; top: number }> = {
                      0: { left: 50, top: 100 }, 1: { left: 15, top: 95 }, 2: { left: 0, top: 70 },
                      3: { left: 0, top: 30 }, 4: { left: 15, top: 5 }, 5: { left: 50, top: 0 },
                      6: { left: 85, top: 5 }, 7: { left: 100, top: 30 }, 8: { left: 100, top: 70 }, 9: { left: 85, top: 95 }
                    };
                    return `${SEAT_MAP[winner.seatIndex]?.left || 50}%`;
                  })(),
                  scale: 0.6,
                  opacity: 0
                } : {}}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: -20 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    y: [0, -4, 0],
                  }}
                  exit={{ scale: 0.8, opacity: 0, y: -20 }}
                  transition={{ 
                    y: {
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut"
                    },
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 25 
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="glass-ui-luxury rounded-full px-4 py-1.5 sm:px-6 sm:py-2.5 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] border border-poker-gold/30 relative group overflow-hidden transition-all scale-[0.95] sm:scale-100">
                    {/* Pulsing Gold Layer for WOW factor */}
                    <div className="absolute inset-0 bg-poker-gold/5 animate-pulse" />
                    
                    {/* Gold Inner Glow */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-poker-gold/20 to-transparent opacity-40" />

                    <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                      <div className="bg-gradient-to-br from-poker-gold/30 to-poker-gold/10 p-1 sm:p-1.5 rounded-full border border-poker-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-poker-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                      </div>

                      <div className="flex flex-col items-start leading-[1.1]">
                        <span className="text-[5px] sm:text-[7px] font-black text-poker-gold/60 uppercase tracking-[0.4em] mb-0.5">
                          {gameState.stage === 'SHOWDOWN' ? 'WINNER POT' : 'ACTIVE POT'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-poker-gold text-[10px] sm:text-[12px] font-black opacity-80 mt-0.5">$</span>
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={gameState.stage === 'SHOWDOWN' && gameState.lastWinner ? gameState.lastWinner.amount : gameState.pot}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 1.5, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="inline-block text-sm sm:text-lg md:text-xl font-black text-white tabular-nums tracking-tighter drop-shadow-md"
                            >
                              {gameState.stage === 'SHOWDOWN' && gameState.lastWinner ? gameState.lastWinner.amount.toLocaleString() : gameState.pot.toLocaleString()}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sweep Highlight Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  {/* Visual Anchor/Shadow on Felt */}
                  {gameState.stage !== 'SHOWDOWN' && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="w-16 h-2 bg-black/60 blur-xl rounded-[100%] mt-1 mx-auto" 
                    />
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Responsive Player Layer - Fixed Slot System (Now Anchored to Table HTML Edge) */}
        <div className="absolute inset-x-0 inset-y-0 z-30 pointer-events-none">
          {playersWithSeats.map((player) => (
            <Player
              key={player.id}
              player={player}
              seatIndex={player.seatIndex}
              totalSeats={8}
              isMe={player.id === myId}
              isDealer={player.isDealer}
              stage={gameState.stage}
              winningCards={gameState.lastWinner?.cards}
              isFoldVictory={gameState.lastWinner?.handName === 'Fold Victory'}
              turnExpiresAt={gameState.turnExpiresAt}
              bigBlind={gameState.config.bigBlind}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Table;
