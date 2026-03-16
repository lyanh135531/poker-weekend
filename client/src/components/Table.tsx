import React from 'react';
import { GameState, Player as PlayerType } from '../types/game';
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
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-slate-950">
      {/* The Table Outer Frame */}
      <div className="w-[95%] h-[75%] max-w-6xl aspect-[16/9] bg-poker-felt rounded-[12rem] border-[16px] border-poker-green-dark shadow-[inset_0_0_100px_rgba(0,0,0,0.8),0_30px_60px_rgba(0,0,0,0.6)] relative flex items-center justify-center">
        
        {/* Table Felt Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')] rounded-[11rem]"></div>

        {/* Branding */}
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5 grayscale scale-75 select-none text-center">
            <h2 className="text-4xl font-black text-white tracking-[0.5em] uppercase italic">Poker Weekend</h2>
            <div className="text-xs text-poker-gold/40 mt-1 font-bold tracking-[1em]">PREMIUM SERIES</div>
        </div>

        {/* Pot Display - Central Top */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-black/60 backdrop-blur-xl px-10 py-3 rounded-[2rem] border border-white/5 z-20 shadow-2xl"
        >
            <span className="text-poker-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-1">Total Pot</span>
            <span className="text-white text-4xl font-black tabular-nums tracking-tighter">${gameState.pot}</span>
        </motion.div>

        {/* Community Cards - Center */}
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex gap-3 scale-110">
                <AnimatePresence>
                    {gameState.communityCards.map((card, idx) => (
                        <Card key={`${card}-${idx}`} code={card} />
                    ))}
                </AnimatePresence>
            </div>
        </div>

        {/* Players distributed around the table */}
        {gameState.players.map((player, idx) => (
            <Player 
                key={player.id}
                player={player}
                isMe={player.id === myId}
                isDealer={idx === gameState.dealerIndex}
                position={idx}
                totalPlayers={gameState.players.length}
            />
        ))}
      </div>
    </div>
  );
};

export default Table;
