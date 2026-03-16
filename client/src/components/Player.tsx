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
  // Simple circular positioning logic
  const angle = (position / totalPlayers) * 2 * Math.PI + Math.PI / 2;
  const x = Math.cos(angle) * 45; // percentage
  const y = Math.sin(angle) * 35; // percentage

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
        {/* Player Cards (Hole Cards) */}
        {player.cards.length > 0 && !player.isFolded && (
            <div className={`flex -space-x-4 mb-2 ${isMe ? 'scale-110' : 'scale-75'}`}>
                <AnimatePresence>
                    {player.cards.map((card, idx) => (
                        <Card 
                            key={`${player.id}-card-${idx}`} 
                            code={card} 
                            hidden={!isMe} // Only show my own cards
                        />
                    ))}
                </AnimatePresence>
            </div>
        )}

        {/* Avatar Circle */}
        <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-slate-800 shadow-xl transition-all ${player.isTurn ? 'border-poker-gold scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'border-slate-700'}`}>
            <User className={`w-8 h-8 ${player.isTurn ? 'text-poker-gold' : 'text-slate-500'}`} />
            
            {/* Dealer Marker */}
            {isDealer && (
                <div className="absolute -right-2 -top-2 bg-poker-gold text-poker-green-dark p-1 rounded-full border-2 border-poker-green-dark shadow-lg">
                    <Award className="w-3 h-3" />
                </div>
            )}

            {/* Bet Chip UI */}
            {player.bet > 0 && (
                <div className="absolute -bottom-8 bg-poker-gold text-poker-green-dark text-[10px] font-black px-2 py-0.5 rounded-full border border-poker-green-dark shadow-md whitespace-nowrap">
                    BET ${player.bet}
                </div>
            )}
        </div>

        {/* Name & Chips Bundle */}
        <div className="mt-4 bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-2xl text-center shadow-2xl min-w-[100px]">
            <div className={`text-[10px] font-black uppercase tracking-tighter ${isMe ? 'text-poker-gold' : 'text-white/60'}`}>
                {player.name} {isMe && '(YOU)'}
            </div>
            <div className="text-sm font-black text-white tabular-nums">${player.chips}</div>
        </div>

        {/* Folded Overlay */}
        {player.isFolded && (
            <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center z-20">
                <span className="text-[10px] font-black uppercase text-red-500 tracking-tighter transform -rotate-12 border-2 border-red-500 px-1 rounded bg-slate-900">Folded</span>
            </div>
        )}
    </motion.div>
  );
};

export default Player;
