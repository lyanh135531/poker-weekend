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
        initial={{ y: -50, opacity: 0, rotateY: 90 }}
        animate={{ y: 0, opacity: 1, rotateY: 0 }}
        className={`w-10 h-14 md:w-16 md:h-24 bg-white rounded-lg shadow-xl flex flex-col justify-between p-1.5 md:p-2 border border-slate-200 card-shine overflow-hidden ${hidden ? 'bg-poker-gold p-0.5 md:p-1' : ''}`}
    >
        {!hidden ? (
            <>
                <div className={`text-xs md:text-lg font-black leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {rank}
                </div>
                <div className={`text-lg md:text-3xl self-center ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {suitIcons[suit]}
                </div>
                <div className={`text-xs md:text-lg font-black leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {rank}
                </div>
            </>
        ) : (
            <div className="w-full h-full bg-poker-green-dark/40 rounded border border-white/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:4px_4px]"></div>
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-poker-gold/20 animate-pulse"></div>
                </div>
            </div>
        )}
    </motion.div>
  );
};

export default Card;
