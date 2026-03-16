import React from 'react';
import { Player as PlayerType } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Award } from 'lucide-react';
import Card from './Card';

interface PlayerProps {
  player: PlayerType;
  isMe: boolean;
  isDealer: boolean;
  position: number;
  totalPlayers: number;
}

const Player: React.FC<PlayerProps> = ({ player, isMe, isDealer, position, totalPlayers }) => {
  // Elliptical distribution to maximize space in the center
  const angle = (position / totalPlayers) * 2 * Math.PI + Math.PI / 2;
  const x = Math.cos(angle) * 45; 
  const y = Math.sin(angle) * 44; 

  return (
    <motion.div 
        layout
        className="absolute flex flex-col items-center"
        style={{ 
            left: `${50 + x}%`, 
            top: `${50 + y}%`, 
            transform: 'translate(-50%, -50%)',
            zIndex: isMe ? 50 : 10 
        }}
    >
        {/* Hole Cards - Positioned strategically based on table half */}
        {player.cards.length > 0 && !player.isFolded && (
            <div className={`flex -space-x-5 transition-transform ${isMe ? 'scale-90 mb-0' : 'scale-65 -mb-2'}`}>
                <AnimatePresence>
                    {player.cards.map((card, idx) => (
                        <Card 
                            key={`${player.id}-card-${idx}`} 
                            code={card} 
                            hidden={!isMe} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        )}

        {/* Player Core UI */}
        <div className="flex flex-col items-center relative gap-1">
            {/* Avatar Circle */}
            <div className={`relative w-11 h-11 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center bg-slate-800 shadow-2xl transition-all duration-500 ${player.isTurn ? 'border-poker-gold ring-4 ring-poker-gold/20' : 'border-white/10'}`}>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-slate-900 via-transparent to-white/5`}></div>
                <User className={`w-5 h-5 md:w-7 md:h-7 ${player.isTurn ? 'text-poker-gold' : 'text-slate-500'}`} />
                
                {/* Dealer Marker */}
                {isDealer && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-1 bg-poker-gold text-poker-green-dark p-1 rounded-full border border-poker-green-dark shadow-lg z-30"
                    >
                        <Award className="w-3 h-3" strokeWidth={3} />
                    </motion.div>
                )}

                {/* Status Indicator */}
                {player.isTurn && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-poker-gold rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                )}
            </div>

            {/* Name/Bankroll Plate */}
            <div className={`flex flex-col items-center bg-slate-900/40 backdrop-blur-xl border border-white/5 py-1 px-3 rounded-xl shadow-2xl min-w-[90px] ${player.isFolded ? 'opacity-40 grayscale' : ''}`}>
               <span className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-poker-gold' : 'text-white/40'}`}>
                   {player.name}
               </span>
               <span className="text-xs font-black text-white leading-none">${player.chips}</span>
            </div>

            {/* Bet UI - Floats nearby */}
            {player.bet > 0 && (
                <motion.div 
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-6 bg-poker-gold text-poker-green-dark text-[10px] font-black px-2 py-0.5 rounded-full border border-black/10 shadow-lg whitespace-nowrap"
                >
                    ${player.bet}
                </motion.div>
            )}
        </div>

        {/* Folded Badge overlay */}
        {player.isFolded && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <span className="text-[10px] font-black uppercase text-red-500/80 tracking-widest px-2 py-0.5 rounded border border-red-500/40 bg-slate-950/80 backdrop-blur-sm -rotate-12">OUT</span>
            </div>
        )}
    </motion.div>
  );
};

export default Player;
