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
        initial={{ y: -20, opacity: 0, scale: 0.8, rotateY: 90 }}
        animate={{ y: 0, opacity: 1, scale: 1, rotateY: 0 }}
        className={`w-12 h-16 md:w-20 md:h-28 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between p-2 md:p-3 border border-slate-200 card-shine overflow-hidden ${hidden ? 'bg-gradient-to-br from-poker-gold to-yellow-700 p-1' : ''}`}
    >
        {!hidden ? (
            <>
                <div className={`text-xs md:text-xl font-black leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {rank}
                </div>
                <div className={`text-xl md:text-4xl self-center drop-shadow-sm ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {suitIcons[suit]}
                </div>
                <div className={`text-xs md:text-xl font-black leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {rank}
                </div>
                
                {/* Subtle card texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/linen-paper.png')]"></div>
            </>
        ) : (
            <div className="w-full h-full bg-slate-900 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden shadow-inner">
                {/* Intricate Back Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--poker-gold)_1px,_transparent_1px)] bg-[length:6px_6px]"></div>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-poker-gold/30 flex items-center justify-center">
                    <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-poker-gold/10 animate-pulse"></div>
                </div>
            </div>
        )}
    </motion.div>
  );
};

export default Card;
