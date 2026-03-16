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
  const me = gameState.players.find(p => p.id === myId);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* The Oval Table */}
      {/* The Oval Table */}
      <div className="w-[92%] h-[80%] bg-poker-felt rounded-[10rem] border-[16px] border-poker-green-dark shadow-[inset_0_0_80px_rgba(0,0,0,0.6),0_20px_50px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
        
        {/* Table Felt Texture/Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

        {/* Table Center Logo / UI */}
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-5 grayscale scale-110">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">Poker Weekend</h2>
        </div>

        {/* Pot Display */}
        <div className="absolute top-[72%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 z-20 shadow-2xl">
            <span className="text-poker-gold font-bold text-[10px] uppercase tracking-widest">Pot Total</span>
            <span className="text-white text-3xl font-black tabular-nums drop-shadow-md">${gameState.pot}</span>
        </div>

        {/* Community Cards */}
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-10 scale-90 sm:scale-100">
            <AnimatePresence>
                {gameState.communityCards.map((card, idx) => (
                    <Card key={`${card}-${idx}`} code={card} />
                ))}
            </AnimatePresence>
        </div>

        {/* Players grouped around the table */}
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

      {/* Action Controls (Only if it's my turn) */}
      {me?.isTurn && (
        <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4"
        >
            <button 
                onClick={() => onAction('fold')}
                className="flex-1 max-w-[100px] bg-red-600/20 border-2 border-red-500 text-red-500 font-bold py-4 rounded-2xl backdrop-blur-md"
            >
                Fold
            </button>
            <button 
                onClick={() => onAction('call')}
                className="flex-1 max-w-[100px] bg-white/10 border-2 border-white/30 text-white font-bold py-4 rounded-2xl backdrop-blur-md"
            >
                {gameState.players.some(p => p.bet > me.bet) ? 'Call' : 'Check'}
            </button>
            <button 
                onClick={() => onAction('raise', 50)}
                className="flex-1 max-w-[100px] bg-poker-gold text-poker-green-dark font-black py-4 rounded-2xl shadow-lg"
            >
                Raise
            </button>
        </motion.div>
      )}
    </div>
  );
};

export default Table;
