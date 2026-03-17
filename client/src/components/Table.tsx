import React from 'react';
import { GameState } from '../types/game';
import Player from './Player';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface TableProps {
  gameState: GameState;
  myId: string;
  onAction: (type: string, amount?: number) => void;
}

const Table: React.FC<TableProps> = ({ gameState, myId, onAction }) => {
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
            
            {/* Geometric Branding - Professional & Subtle */}
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 select-none text-center">
               <h2 className="text-7xl font-black tracking-tighter text-white italic">POKER<span className="text-slate-200">WKD</span></h2>
               <p className="text-[10px] uppercase tracking-[1em] font-black text-white mt-2">Elite Series • MMXXIV</p>
            </div>

            {/* Total Pot - Anchored Buffer Zone (Centered Wrapper) */}
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div 
                 animate={{ y: [0, -5, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="glass-ui-gold rounded-full px-10 py-3 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] whitespace-nowrap"
              >
                 <span className="text-[10px] uppercase font-black tracking-[0.4em] text-poker-gold opacity-60">Pot Value</span>
                 <span className="text-3xl font-black text-white">${gameState.pot}</span>
              </motion.div>
            </div>

            {/* Community Card Sockets - Stable Horizontal Grid (Slightly higher to avoid hole card overlap) */}
            <div className="absolute top-[64%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
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

      {/* 2. Responsive Player Layer - Independent Position System */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {gameState.players.map((player: any, idx: number) => (
          <Player 
            key={player.id} 
            player={player} 
            idx={idx} 
            totalPlayers={gameState.players.length}
            isMe={player.id === myId}
            isDealer={idx === gameState.dealerIndex}
          />
        ))}
      </div>
    </div>
  );
}

export default Table;
