import React from 'react';
import { Player as PlayerType } from '../types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User } from 'lucide-react';

interface PlayerProps {
  player: PlayerType;
  seatIndex: number;
  totalSeats: number;
  isMe: boolean;
  isDealer?: boolean;
  stage: string;
  winningCards?: string[];
  isFoldVictory?: boolean;
}

const Player: React.FC<PlayerProps> = ({ player, seatIndex, totalSeats, isMe, isDealer, stage, winningCards, isFoldVictory }) => {
  // Fixed HTML Edge mapping ([left%, top%])
  // Traces the exact perimeter of the CSS Table Base
  const SEAT_MAP: Record<number, { left: number; top: number }> = {
    0: { left: 50, top: 100 }, // Hero (Bottom Center)
    1: { left: 85, top: 95 },  // Bottom Right
    2: { left: 100, top: 70 }, // Right Bottom
    3: { left: 100, top: 30 }, // Right Top 
    4: { left: 85, top: 5 },   // Top Right
    5: { left: 50, top: 0 },   // Top Center (Dealer/Reserved)
    6: { left: 15, top: 5 },   // Top Left
    7: { left: 0, top: 30 },   // Left Top
    8: { left: 0, top: 70 },   // Left Bottom
    9: { left: 15, top: 95 },  // Bottom Left
  };

  const pos = SEAT_MAP[seatIndex] || { left: 50, top: 50 };
  const left = pos.left;
  const top = pos.top;

  // Vector pointing toward the table center (50, 50)
  const dx = 50 - left;
  const dy = 50 - top;
  // Calculate distance to center to normalize the vector
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const unitX = dx / distance;
  const unitY = dy / distance;

  // Angle for rotation (if needed anywhere else, though cards just rotate fixed right now)
  const angle = Math.atan2(top - 50, left - 50);

  // Offsets in EXACT pixels, eliminating aspect ratio stretching
  // Main player needs more distance because their cards are larger
  const cardOffsetPx = 90;
  const betOffsetPx = 180;

  return (
    <>
      {/* 1. Player Cards Area - Anchored and Balanced */}
      <div
        className="absolute flex items-center justify-center transition-all duration-700 z-10"
        style={{
          left: `calc(${left}% + ${unitX * cardOffsetPx}px)`,
          top: `calc(${top}% + ${unitY * cardOffsetPx}px)`,
          transform: 'translate(-50%, -50%)',
          width: 'var(--card-width)',
          height: 'calc(var(--card-width) * 1.4)'
        }}
      >
        <div className="flex -space-x-5">
          <AnimatePresence mode="popLayout">
            {!player.isFolded && player.cards.map((card, i) => {
              const isWinningCard = winningCards?.includes(card);
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -20, y: 30 }}
                  animate={{
                    scale: 1,
                    rotate: (i === 0 ? -8 : 8),
                    y: isWinningCard ? -20 : 0
                  }}
                  exit={{ scale: 0, opacity: 0, y: 40, rotate: (i === 0 ? -40 : 40) }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  className={`${isWinningCard ? 'z-50' : 'z-10'} shadow-[0_20px_40px_rgba(0,0,0,0.6)]`}
                >
                  <Card code={card} hidden={!isMe && (stage !== 'SHOWDOWN' || !!isFoldVictory)} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Active Bet Badge - Independent and Clearly Visible on Felt */}
      {player.bet > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-40"
          style={{
            left: `calc(${left}% + ${unitX * betOffsetPx}px)`,
            top: `calc(${top}% + ${unitY * betOffsetPx}px)`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="glass-ui-gold px-4 py-1.5 rounded-full border-poker-gold/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border">
            <p className="text-[9px] font-black text-poker-gold tabular-nums tracking-tighter opacity-90">
              ${player.bet}
            </p>
          </div>
        </motion.div>
      )}

      {/* 3. Unified Player Plate - High-fidelity and aligned */}
      <div
        className={`absolute flex flex-col items-center gap-1.5 transition-all duration-700 z-30 ${(!player.isOnline || player.isFolded) ? 'opacity-40 grayscale-[0.8] scale-95' : 'opacity-100 grayscale-0 scale-100'}`}
        style={{
          left: `${left}%`,
          top: `${top}%`,
          transform: 'translate(-50%, -50%)',
          width: 'var(--player-plate-width)'
        }}
      >
        <div className={`relative p-1 rounded-full transition-all duration-500 scale-110 ${player.isTurn ? 'animate-turn-glow' : ''}`}>
          {/* Status Badges */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 z-[60] items-center">
            {player.isTurn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-poker-gold text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full shadow-[0_0_20px_rgba(195,163,91,0.8)] border border-white/20 whitespace-nowrap animate-pulse"
              >
                THINKING
              </motion.div>
            )}
            {player.isAllIn && (
              <div className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/10 whitespace-nowrap scale-90">
                ALL-IN
              </div>
            )}
            {!player.isOnline && (
              <div className="bg-slate-700 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white/5 whitespace-nowrap scale-90 opacity-80">
                OFFLINE
              </div>
            )}
          </div>

          {/* Avatar Circle */}
          <div className={`w-9 h-9 rounded-full border border-white/5 overflow-hidden shadow-xl relative bg-slate-900 transition-all duration-300 ${isMe ? 'ring-2 ring-poker-gold/50 ring-offset-2 ring-offset-slate-950' : ''} ${player.isTurn ? 'ring-2 ring-poker-gold shadow-[0_0_25px_rgba(195,163,91,0.6)]' : ''}`}>
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 outline-none transition-all duration-300 ${player.isTurn ? 'opacity-100' : 'opacity-60'}`}>
              <User className={`w-5 h-5 transition-colors duration-300 ${player.isTurn ? 'text-poker-gold drop-shadow-[0_0_8px_rgba(195,163,91,0.8)]' : 'text-slate-500/50'}`} />
            </div>
          </div>
          {/* Dealer Marker */}
          {isDealer && (
            <div className="absolute -top-0.5 -right-0.5 bg-poker-gold text-slate-950 p-1 rounded-full shadow-lg z-50 ring-1 ring-slate-950 scale-90">
              <Crown className="w-2.5 h-2.5 fill-current" />
            </div>
          )}
        </div>

        {/* Info Box - Glassmorphic Container (Narrowed & Tighter) */}
        <div className="glass-ui w-full rounded-lg px-2 py-1 space-y-0 text-center shadow-xl relative overflow-hidden border-white/5 group">
          <div className="flex items-center justify-center gap-1 opacity-60">
            <span className={`w-1 h-1 rounded-full ${player.isTurn ? 'bg-poker-gold animate-pulse' : 'bg-slate-700'}`} />
            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.1em] truncate">
              {player.name}
            </p>
          </div>

          <p className="text-sm font-black text-white/90 tabular-nums tracking-tight">
            <span className="text-poker-gold/50 text-[10px] mr-0.5">$</span>{player.chips}
          </p>

          {/* Progress bar for turn */}
          {player.isTurn && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 60, ease: "linear" }}
              className="h-[3px] bg-poker-gold absolute bottom-0 left-0 shadow-[0_0_10px_var(--poker-gold)]"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Player;
