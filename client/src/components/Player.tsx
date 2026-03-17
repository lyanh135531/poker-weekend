import React from 'react';
import { Player as PlayerType } from '../types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User } from 'lucide-react';

interface PlayerProps {
  player: PlayerType;
  idx: number;
  totalPlayers: number;
  isMe: boolean;
  isDealer?: boolean;
}

const Player: React.FC<PlayerProps> = ({ player, idx, totalPlayers, isMe, isDealer }) => {
  // Elliptical distribution for seating - tuned for better screen space
  // Safety check for totalPlayers to avoid division by zero
  const safeTotal = totalPlayers || 1;
  const angle = (idx / safeTotal) * 2 * Math.PI + Math.PI / 2;
  const xRadius = 45; // percentage
  const yRadius = 40; // percentage

  const left = 50 + xRadius * Math.cos(angle);
  const top = 50 + yRadius * Math.sin(angle);

  // Card inward offset - significant enough to clear player plates and ensure visibility
  const cardOffset = 18;
  const cardLeft = 50 + (xRadius - cardOffset) * Math.cos(angle);
  const cardTop = 50 + (yRadius - cardOffset) * Math.sin(angle);

  // Bet inward offset - pulled further onto the felt to avoid overlap with player box
  // Pulled in by ~30% for distinct visibility on all screen sizes
  const betOffset = 30;
  const betLeft = 48 + (xRadius - betOffset) * Math.cos(angle);
  const betTop = 48 + (yRadius - betOffset) * Math.sin(angle);

  return (
    <>
      {/* 1. Player Cards Area - Anchored and Balanced */}
      <div
        className="absolute flex items-center justify-center transition-all duration-700 z-10"
        style={{
          left: `${cardLeft}%`,
          top: `${cardTop}%`,
          transform: 'translate(-50%, -50%)',
          width: 'var(--card-width)',
          height: 'calc(var(--card-width) * 1.4)'
        }}
      >
        <div className="flex -space-x-10">
          <AnimatePresence mode="popLayout">
            {player.cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -20, y: 30 }}
                animate={{ scale: 1, rotate: (i === 0 ? -8 : 8), y: 0 }}
                className="shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              >
                <Card code={card} hidden={!isMe} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Active Bet Badge - Independent and Clearly Visible on Felt */}
      {player.bet > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-40"
          style={{ left: `${betLeft}%`, top: `${betTop}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="glass-ui-gold px-6 py-2.5 rounded-full border-poker-gold/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] border">
            <p className="text-[11px] font-black text-poker-gold tabular-nums tracking-tighter shadow-sm">
              ${player.bet}
            </p>
          </div>
        </motion.div>
      )}

      {/* 3. Unified Player Plate - High-fidelity and aligned */}
      <div
        className="absolute flex flex-col items-center gap-3 transition-all duration-700 z-30"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          transform: 'translate(-50%, -50%)',
          width: 'var(--player-plate-width)'
        }}
      >
        <div className={`relative p-1 rounded-full transition-all duration-500 scale-110 ${player.isTurn ? 'animate-turn-glow' : ''}`}>
          {/* Avatar Circle */}
          <div className={`w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-2xl relative bg-slate-900 ${isMe ? 'ring-2 ring-poker-gold ring-offset-4 ring-offset-slate-950' : ''}`}>
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 outline-none">
              <User className="w-7 h-7 text-slate-500/50" />
            </div>
            {/* Dealer Marker */}
            {isDealer && (
              <div className="absolute -top-1 -right-1 bg-poker-gold text-slate-950 p-1 rounded-full shadow-lg z-50">
                <Crown className="w-3 h-3 fill-current" />
              </div>
            )}
          </div>
        </div>

        {/* Info Box - Glassmorphic Container */}
        <div className="glass-ui w-full rounded-[1.2rem] p-3 space-y-1 text-center shadow-2xl relative overflow-hidden border-white/10 group">
          <div className="flex items-center justify-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${player.isTurn ? 'bg-poker-gold animate-pulse' : 'bg-slate-600'}`} />
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] truncate">
              {player.name}
            </p>
          </div>

          <p className="text-lg font-black text-white tabular-nums tracking-tight">
            <span className="text-poker-gold/40 text-sm mr-0.5">$</span>{player.chips}
          </p>

          {/* Progress bar for turn */}
          {player.isTurn && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
              className="h-[3px] bg-poker-gold absolute bottom-0 left-0 shadow-[0_0_10px_var(--poker-gold)]"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Player;
