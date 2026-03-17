import React from 'react';
import { GameState } from '../types/game';
import Player from './Player';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

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

  // 2. Map players to fixed 10-slot "Seating Chart" (Skipping Slot 5 for Pot)
  // Slots: 0 (Bottom), 1, 2, 3, 4 (Right), 5 (TOP - RESERVED), 6, 7, 8, 9 (Left)
  const availableSeats = [0, 1, 2, 3, 4, 6, 7, 8, 9];
  
  // Calculate relative seat index based on reordered index and total players
  // This ensures even distribution across the 9 available slots
  const playersWithSeats = reorderedPlayers.map((player, idx) => {
    // For Hero (idx 0), we always want seat 0
    if (idx === 0) return { ...player, seatIndex: 0 };
    
    // For others, distribute across the remaining 8 seats (1-4, 6-9)
    // We map idx [1...N-1] to availableSeats [1...8]
    // Simple even distribution formula
    const seatMapIdx = Math.floor((idx / (reorderedPlayers.length || 1)) * availableSeats.length);
    return { ...player, seatIndex: availableSeats[seatMapIdx] };
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
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div 
                 initial={{ y: 0 }}
                 animate={{ 
                   y: [-2, 2, -2],
                   scale: [1, 1.01, 1]
                 }}
                 transition={{ 
                   duration: 4, 
                   repeat: Infinity, 
                   ease: "easeInOut" 
                 }}
                 className="flex flex-col items-center gap-1"
              >
                <div className="glass-ui-luxury rounded-3xl px-8 py-3 flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.1)] border border-poker-gold/20 relative group overflow-hidden">
                  {/* Subtle Background Inner Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-poker-gold/10 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-poker-gold/10 p-2 rounded-xl border border-poker-gold/20 shadow-inner">
                      <Coins className="w-5 h-5 text-poker-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                    </div>
                    
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] font-black text-poker-gold/60 uppercase tracking-[0.3em] mb-0.5">
                        Total Pot
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-poker-gold text-lg font-black">$</span>
                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-xl">
                          {gameState.pot.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shimmer Effect */}
                  <motion.div 
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                  />
                </div>
                
                {/* Visual Anchor/Shadow on Felt */}
                <div className="w-24 h-4 bg-black/40 blur-xl rounded-[100%] mt-2 mx-auto" />
              </motion.div>
            </div>

            {/* Community Card Sockets - Dead Center Focus */}
            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
               {[0, 1, 2, 3, 4].map(idx => (
                 <div key={idx} className="card-socket relative flex items-center justify-center">
                    <AnimatePresence mode="popLayout">
                        {gameState.communityCards[idx] && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
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
        </div>
      </div>

      {/* 2. Responsive Player Layer - Fixed Slot System */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {playersWithSeats.map((player) => (
          <Player 
            key={player.id} 
            player={player} 
            seatIndex={player.seatIndex} 
            totalSeats={10}
            isMe={player.id === myId}
            isDealer={player.isDealer}
          />
        ))}
      </div>
    </div>
  );
}

export default Table;
