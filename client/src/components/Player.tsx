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
  bigBlind?: number;
}

const Player: React.FC<PlayerProps & { turnExpiresAt?: number }> = ({ 
  player, seatIndex, totalSeats, isMe, isDealer, stage, winningCards, isFoldVictory, turnExpiresAt, bigBlind = 20 
}) => {
  // Fixed HTML Edge mapping ([left%, top%])
  // Traces the exact perimeter of the CSS Table Base
  const SEAT_MAP: Record<number, { left: number; top: number }> = {
    0: { left: 50, top: 100 }, // Hero (Bottom Center)
    1: { left: 15, top: 95 },  // Bottom Left
    2: { left: 0, top: 70 },   // Left Bottom
    3: { left: 0, top: 30 },   // Left Top 
    4: { left: 15, top: 5 },   // Top Left
    5: { left: 50, top: 0 },   // Top Center
    6: { left: 85, top: 5 },   // Top Right
    7: { left: 100, top: 30 }, // Right Top
    8: { left: 100, top: 70 }, // Right Bottom
    9: { left: 85, top: 95 },  // Bottom Right
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

  // Timer logic
  const [timeLeft, setTimeLeft] = React.useState(0);
  const totalTime = 60000; // 1 minute from server

  React.useEffect(() => {
    if (!player.isTurn || !turnExpiresAt) return;

    const update = () => {
      const remaining = Math.max(0, turnExpiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining > 0) {
        requestAnimationFrame(update);
      }
    };

    // Initial call
    update();
  }, [player.isTurn, turnExpiresAt]);

  const progress = timeLeft / totalTime;
  const isEmergency = timeLeft < 10000;

  // Privacy Mode (Local state for Hero to hide cards)
  const [isMasked, setIsMasked] = React.useState(false);

  // Auto-reveal on new hand or showdown
  React.useEffect(() => {
    setIsMasked(false);
  }, [player.cards.join(','), stage === 'SHOWDOWN']);

  // Offsets in EXACT pixels, eliminating aspect ratio stretching
  // Main player needs more distance because their cards are larger
  const cardOffsetPx = 90;
  const betOffsetPx = 180;

  const infoOffsetPx = 45; // Pixel distance from Avatar center to Info Box center

  return (
    <>
      {/* 1. Hole Cards - Tappable for Privacy Mode (Hero Only) */}
      <motion.div
        className={`absolute flex items-center justify-center ${isMe ? 'z-50' : 'z-10'} ${isMe && !player.isFolded && player.cards.length > 0 ? 'cursor-pointer group/cards pointer-events-auto' : ''}`}
        onClick={() => isMe && !player.isFolded && player.cards.length > 0 && setIsMasked(!isMasked)}
        style={{
          left: `calc(${left}% + ${unitX * cardOffsetPx}px)`,
          top: `calc(${top}% + ${unitY * cardOffsetPx}px)`,
          transform: 'translate(-50%, -50%)',
          width: 'calc(var(--card-width) * 1.5)',
          height: 'calc(var(--card-width) * 1.6)'
        }}
      >
        <div className="flex -space-x-5 relative">
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
                  <Card code={card} hidden={isMasked || (!isMe && (stage !== 'SHOWDOWN' || !!isFoldVictory))} />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Privacy Toggle Hint (Hero Only) */}
          {isMe && !player.isFolded && player.cards.length > 0 && (
            <div className="absolute inset-x-0 -bottom-6 flex justify-center opacity-0 group-hover/cards:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-poker-gold uppercase tracking-widest border border-poker-gold/20 shadow-xl">
                {isMasked ? 'Tap to Reveal' : 'Tap to Hide'}
              </span>
            </div>
          )}

          {/* Private Overlay - Premium Stamp Appearance */}
          <AnimatePresence>
            {isMasked && !player.isFolded && player.cards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ opacity: 1, scale: 1.2, rotate: -15 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none"
              >
                <div className="glass-ui-gold px-3 py-1 rounded-sm border-poker-gold/40 shadow-2xl backdrop-blur-md">
                  <span className="text-[10px] font-black text-poker-gold uppercase tracking-[0.3em] italic drop-shadow-md">PRIVATE</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 2. Active Bet Badge - Premium "WOW" Vertical Chip Stack */}
      {player.bet > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute z-40 group/bet pointer-events-none"
          style={{
            left: `calc(${left}% + ${unitX * betOffsetPx}px)`,
            top: `calc(${top}% + ${unitY * betOffsetPx}px)`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center"
          >
            {/* 3D Dynamic Vertical Chip Stack */}
            <div className="relative w-5 h-8 mr-2 overflow-visible">
              <AnimatePresence mode="popLayout">
                {[...Array(Math.min(Math.floor(player.bet / (bigBlind || 20)) + 1, 8))].map((_, i) => (
                  <motion.div 
                    key={i}
                    layout
                    initial={{ scale: 0, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: i * -2.5, opacity: 1 }}
                    exit={{ scale: 0, y: 10, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: i * 0.05 }}
                    className="absolute bottom-0 left-0 w-[18px] h-[18px]"
                    style={{ zIndex: i }}
                  >
                    {/* Chip Body - 3D Edge/Side */}
                    <div 
                      className="absolute inset-x-0 h-[18px] rounded-full mt-[2px]"
                      style={{ 
                        background: i % 2 === 0 ? '#8e7131' : '#9ca3af',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
                        transform: `rotate(${i * 15}deg)` // Organic rotation
                      }}
                    />
                    
                    {/* Chip Top Face */}
                    <div 
                      className="absolute inset-x-0 h-[18px] rounded-full border border-white/20 overflow-hidden"
                      style={{ 
                        background: i % 2 === 0 
                          ? 'radial-gradient(circle at center, #c3a35b 0%, #a68948 100%)' 
                          : 'radial-gradient(circle at center, #ffffff 0%, #d1d5db 100%)',
                        transform: `rotate(${i * 15}deg)` // Organic rotation
                      }}
                    >
                      {/* Edge Stripes (Classic Poker Chip Design) */}
                      <div 
                        className="absolute inset-0 opacity-40"
                        style={{ 
                          background: `conic-gradient(
                            transparent 0deg 15deg, 
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 15deg 30deg, 
                            transparent 30deg 45deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 45deg 60deg,
                            transparent 60deg 75deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 75deg 90deg,
                            transparent 90deg 105deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 105deg 120deg,
                            transparent 120deg 135deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 135deg 150deg,
                            transparent 150deg 165deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 165deg 180deg,
                            transparent 180deg 195deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 195deg 210deg,
                            transparent 210deg 225deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 225deg 240deg,
                            transparent 240deg 255deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 255deg 270deg,
                            transparent 270deg 285deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 285deg 300deg,
                            transparent 300deg 315deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 315deg 330deg,
                            transparent 330deg 345deg,
                            ${i % 2 === 0 ? 'white' : '#6b7280'} 345deg 360deg
                          )`
                        }}
                      />
                      
                      {/* Inner Inlay Ring */}
                      <div className="absolute inset-[3px] rounded-full border border-black/10 opacity-30" />
                      
                      {/* Center Highlight */}
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/10 blur-[1px]" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Amount Badge */}
            <div className="glass-ui-gold px-4 py-1.5 rounded-full border-poker-gold/30 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(195,163,91,0.2)] border flex items-baseline gap-1 backdrop-blur-2xl">
              <span className="text-poker-gold/60 text-[7px] font-black uppercase tracking-widest">$</span>
              <span className="text-[11px] font-black text-white tabular-nums tracking-tighter drop-shadow-sm">
                {player.bet.toLocaleString()}
              </span>
              
              {/* Subtle pulsing glow */}
              <div className="absolute inset-0 rounded-full bg-poker-gold/10 animate-pulse" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 3. Player Anchor - Base position purely for opacity/status container */}
      <div
        className={`absolute transition-all duration-700 z-30 ${(!player.isOnline || player.isFolded) ? 'opacity-40 grayscale-[0.8] scale-95' : 'opacity-100 grayscale-0 scale-100'}`}
        style={{
          left: `${left}%`,
          top: `${top}%`,
        }}
      >
        {/* Avatar - Centered directly on edge */}
        <div className="absolute" style={{ transform: 'translate(-50%, -50%)' }}>

          <div className={`relative p-1 rounded-full transition-all duration-500 scale-110 ${player.isTurn ? 'turn-glow-circular' : ''}`}>

            {/* The Unified Circular Timer - Premium SVG Implementation */}
            {player.isTurn && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/10"
                />
                {/* Progress */}
                <motion.circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="289"
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: progress }}
                  strokeLinecap="round"
                  className={isEmergency ? 'text-red-500' : 'text-poker-gold'}
                  style={{
                    stroke: isEmergency ? '#ef4444' : '#c3a35b'
                  }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </svg>
            )}

            {/* Status & Action Badges */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col gap-1 z-[60] items-center">
              <AnimatePresence>
                {!isMe && player.lastAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className={`${player.lastAction.includes('Fold') ? 'bg-red-500/90' : 'bg-poker-gold/90'} text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-sm shadow-xl border border-white/20 whitespace-nowrap uppercase tracking-wider`}
                  >
                    {player.lastAction}
                  </motion.div>
                )}
              </AnimatePresence>

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

            {/* Avatar Circle - Now contains Name and Chips */}
            <div className={`w-16 h-16 rounded-full border border-white/10 overflow-hidden shadow-2xl relative bg-slate-950 transition-all duration-300 ${isMe ? 'ring-2 ring-poker-gold/50 ring-offset-2 ring-offset-slate-950' : ''} ${player.isTurn ? 'ring-2 ring-poker-gold' : ''}`}>
              <div className={`w-full h-full rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black outline-none transition-all duration-300 ${player.isTurn ? 'opacity-100' : 'opacity-80'}`}>
                
                {/* Background User Icon as a subtle watermark */}
                <User className="absolute w-8 h-8 text-white/5 opacity-20 pointer-events-none" />

                {/* Name */}
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.1em] truncate max-w-[50px] mb-0.5 z-10">
                  {player.name}
                </span>

                {/* Chips */}
                <div className="flex items-center justify-center z-10">
                  <span className="text-poker-gold/50 text-[7px] mr-0.5 font-bold">$</span>
                  <span className="text-[11px] font-black text-poker-gold tabular-nums tracking-tighter leading-none">
                    {player.chips.toLocaleString()}
                  </span>
                </div>

              </div>
            </div>
            {/* Dealer Marker */}
            {isDealer && (
              <div className="absolute top-0 right-0 bg-poker-gold text-slate-950 p-1.5 rounded-full shadow-lg z-50 ring-2 ring-slate-950 scale-90">
                <Crown className="w-3 h-3 fill-current" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
