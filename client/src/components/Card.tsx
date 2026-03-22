import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  code: string; // e.g. "AH", "10D"
  hidden?: boolean;
}

const Card: React.FC<CardProps> = ({ code, hidden }) => {
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  const isRed = suit === 'H' || suit === 'D';

  const suitIcons: Record<string, string> = {
    'H': '♥',
    'D': '♦',
    'C': '♣',
    'S': '♠'
  };

  return (
    <motion.div 
        initial={{ y: -10, opacity: 0, scale: 0.95, rotateY: 90 }}
        animate={{ y: 0, opacity: 1, scale: 1, rotateY: 0 }}
        className={`relative w-8 h-11 sm:w-10 sm:h-14 md:w-14 md:h-20 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden ${hidden ? 'bg-slate-900' : 'bg-white'}`}
    >
        {!hidden ? (
            <div className="w-full h-full p-0.5 sm:p-1 relative">
                {/* Top Left Index */}
                <div className={`absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col items-center leading-none ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
                    <span className="text-[7px] sm:text-[10px] font-bold tracking-tighter mb-0.5">{rank}</span>
                    <span className="text-[5px] sm:text-[8px]">{suitIcons[suit]}</span>
                </div>
                
                {/* Center Symbol */}
                <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
                    <span className="text-base sm:text-2xl opacity-80">{suitIcons[suit]}</span>
                </div>
                
                {/* Bottom Right Index */}
                <div className={`absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-500' : 'text-slate-800'}`}>
                    <span className="text-[7px] sm:text-[10px] font-bold tracking-tighter mb-0.5">{rank}</span>
                    <span className="text-[5px] sm:text-[8px]">{suitIcons[suit]}</span>
                </div>
            </div>
        ) : (
            <div className="w-full h-full rounded-[4px] border border-poker-gold/30 p-1 flex items-center justify-center relative overflow-hidden bg-slate-950">
                {/* Minimalist Geometric Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(195,163,91,0.2)_25%,rgba(195,163,91,0.2)_50%,transparent_50%,transparent_75%,rgba(195,163,91,0.2)_75%,rgba(195,163,91,0.2)_100%)] bg-[length:4px_4px]"></div>
                
                <div className="z-10 w-full h-full border border-poker-gold/10 rounded-[2px] flex items-center justify-center">
                   <div className="w-2 h-2 md:w-3 md:h-3 rounded-sm bg-poker-gold/20 rotate-45 border border-poker-gold/40 shadow-[0_0_10px_rgba(195,163,91,0.2)]"></div>
                </div>
            </div>
        )}
    </motion.div>
  );
};

export default Card;
