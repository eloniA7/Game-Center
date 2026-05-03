import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const BOARD_SIZE = 10;
const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;

// Classic Snake & Ladder Mapping
const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

const LADDERS: Record<number, number> = {
  1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
};

interface Player {
  id: string;
  name: string;
  position: number;
  color: string;
  isBot: boolean;
}

// Function to get high-quality board square colors based on classic patterns
const getSquareColor = (idx: number) => {
  const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa']; // Red, Yellow, Green, Blue
  // Physical boards often have a repeating pattern but shifted by row
  const row = Math.floor((idx - 1) / 10);
  const col = (idx - 1) % 10;
  return colors[(row + col) % 4];
};

const Dice = ({ value, isSpinning }: { value: number; isSpinning: boolean }) => {
  const dots = [
    [], // 0
    [4], // 1: center
    [0, 8], // 2: top-left, bottom-right
    [0, 4, 8], // 3: top-left, center, bottom-right
    [0, 2, 6, 8], // 4: 4 corners
    [0, 2, 4, 6, 8], // 5: 4 corners + center
    [0, 2, 3, 5, 6, 8], // 6: 3 left, 3 right
  ];

  return (
    <motion.div 
      animate={isSpinning ? { 
        rotateX: [0, 90, 180, 270, 360],
        rotateY: [0, 180, 360, 540, 720],
        scale: [1, 1.1, 1],
        y: [0, -10, 0]
      } : { rotateX: 0, rotateY: 0, scale: 1, y: 0 }}
      transition={isSpinning ? { repeat: Infinity, duration: 0.5, ease: "linear" } : { type: 'spring', damping: 10 }}
      style={{ transformStyle: 'preserve-3d' }}
      className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] border-b-[6px] md:border-b-[10px] border-neutral-200 grid grid-cols-3 p-3 md:p-5 gap-1 md:gap-2 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/30 pointer-events-none" />
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots[value]?.includes(i) && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 md:w-4 md:h-4 bg-neutral-900 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]" 
            />
          )}
        </div>
      ))}
    </motion.div>
  );
};

export const SnakeLadderGame: React.FC<{ onBack: () => void, mode: any, players?: any[] }> = ({ onBack, mode, players: propPlayers }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [jumpMessage, setJumpMessage] = useState<string | null>(null);

  // COORDINATE LOGIC: Square 1 is Bottom-Right (100% Identical to physical board)
  const getCoords = (pos: number) => {
    const row = Math.floor((pos - 1) / BOARD_SIZE);
    let col = (pos - 1) % BOARD_SIZE;
    
    // Zig-Zag logic: Even rows go Right-to-Left (pos 1..10), Odd rows go Left-to-Right (pos 11..20)
    if (row % 2 === 0) {
      col = 10 - 1 - col;
    }
    
    return {
      x: (col + 0.5) * 10,
      y: (10 - 1 - row + 0.5) * 10
    };
  };

  useEffect(() => {
    if (mode?.mode === 'bot') {
      const totalPlayers = mode.players || 2;
      const initialPlayers: Player[] = [
        { id: '1', name: 'Player', position: 1, color: '#f87171', isBot: false }
      ];
      const botColors = ['#60a5fa', '#34d399', '#facc15'];
      for (let i = 1; i < totalPlayers; i++) {
        initialPlayers.push({
          id: String(i + 1),
          name: `Bot ${i}`,
          position: 1,
          color: botColors[i - 1] || '#ffffff',
          isBot: true
        });
      }
      setPlayers(initialPlayers);
    } else if (propPlayers && propPlayers.length > 0) {
      setPlayers(propPlayers.map((p, i) => ({
        id: p.uid || String(i),
        name: p.name,
        position: 1,
        color: i === 0 ? '#f87171' : i === 1 ? '#60a5fa' : i === 2 ? '#34d399' : '#facc15',
        isBot: false
      })));
    }
  }, [mode, propPlayers]);

  const movePlayer = async (steps: number) => {
    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIdx];
    let currentPos = player.position;

    for (let i = 0; i < steps; i++) {
      if (currentPos >= TOTAL_SQUARES) break;
      currentPos++;
      player.position = currentPos;
      setPlayers([...newPlayers]);
      await new Promise(r => setTimeout(r, 200));
    }

    if (LADDERS[currentPos]) {
      if (!player.isBot) setJumpMessage(`${player.name.toUpperCase()} FOUND A LADDER!`);
      await new Promise(r => setTimeout(r, 800));
      currentPos = LADDERS[currentPos];
      player.position = currentPos;
      setPlayers([...newPlayers]);
      await new Promise(r => setTimeout(r, 800));
      setJumpMessage(null);
    } else if (SNAKES[currentPos]) {
      if (!player.isBot) setJumpMessage(`${player.name.toUpperCase()} HIT A SNAKE!`);
      await new Promise(r => setTimeout(r, 800));
      currentPos = SNAKES[currentPos];
      player.position = currentPos;
      setPlayers([...newPlayers]);
      await new Promise(r => setTimeout(r, 800));
      setJumpMessage(null);
    }

    if (currentPos === TOTAL_SQUARES) {
      setWinner(player);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      return;
    }

    setIsRolling(false);
    setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
  };

  const rollDice = () => {
    if (isRolling || winner) return;
    setIsRolling(true);
    setIsSpinning(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 15) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        
        // Stop the visual spinning animation
        setIsSpinning(false);
        
        // Wait for the "landing" animation to complete before moving
        setTimeout(() => {
          movePlayer(finalValue);
        }, 600);
      }
    }, 60);
  };

  useEffect(() => {
    const currentPlayer = players[currentPlayerIdx];
    if (currentPlayer?.isBot && !winner && !isRolling) {
      const timer = setTimeout(rollDice, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIdx, winner, isRolling, players]);

  const renderBoard = () => {
    const squares = [];
    for (let i = 1; i <= TOTAL_SQUARES; i++) {
      squares.push(
        <div 
          key={i} 
          className="relative aspect-square border border-black/10 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: getSquareColor(i) }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-10 pointer-events-none" />
          <span className="absolute top-1 right-1 text-[8px] md:text-sm font-black text-black/40 select-none">{i}</span>
          
          <div className="flex gap-0.5 flex-wrap justify-center p-0.5 z-20">
            {players.map(p => p.position === i && (
              <motion.div 
                key={p.id}
                layoutId={`token-${p.id}`}
                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                className="w-4 h-4 md:w-8 md:h-8 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-2 border-white/50 relative overflow-hidden"
                style={{ backgroundColor: p.color }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/40" />
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    const rows = [];
    for (let i = 0; i < 10; i++) {
      let rowSquares = squares.slice(i * 10, (i + 1) * 10);
      // Square 1 is Right-Most, so EVEN i (Row 0, 2, 4...) should be reversed
      if (i % 2 === 0) rowSquares.reverse();
      rows.push(rowSquares);
    }
    return rows.reverse().flat();
  };

  return (
    <div className="h-full w-full bg-[#f0f2f5] text-neutral-900 flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 shrink-0 relative">
         <button onClick={onBack} className="w-12 h-12 bg-white shadow-md hover:shadow-lg rounded-2xl flex items-center justify-center transition-all border border-neutral-200"><ArrowLeft size={24} /></button>
         <div className="text-center">
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-sm flex items-center gap-1 md:gap-3">
              <span className="text-red-500">Real</span>
              <span className="text-orange-500">Board</span>
              <span className="text-neutral-300 mx-1 md:mx-2">&</span>
              <span className="text-blue-500 underline decoration-4">Classic</span>
            </h2>
         </div>
         <div className="w-12" />
         
         <AnimatePresence>
           {jumpMessage && (
             <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.8 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 1.2 }}
               className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-8 py-3 rounded-full font-black text-sm shadow-[0_20px_50px_rgba(0,0,0,0.4)] whitespace-nowrap border-2 border-white/20"
             >
               {jumpMessage}
             </motion.div>
           )}
         </AnimatePresence>
      </header>

      <div className="w-full max-w-[min(100%,700px)] relative border-[10px] md:border-[20px] border-[#3e2723] rounded-[2rem] md:rounded-[4rem] shadow-[0_60px_120px_rgba(0,0,0,0.3)] mb-8 md:mb-12 bg-[#8d6e63] shrink-0 p-2 md:p-6 ring-4 ring-black/5">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern-with-soft-border.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10 border-[6px] md:border-[12px] border-neutral-900/10 rounded-xl md:rounded-[2.5rem] overflow-hidden bg-white shadow-2xl">
          <div className="grid grid-cols-10 border border-black/5">
            {renderBoard()}
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
             <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#4a0404" />
                   <stop offset="50%" stopColor="#ef4444" />
                   <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="#3e2723" />
                   <stop offset="50%" stopColor="#795548" />
                   <stop offset="100%" stopColor="#3e2723" />
                </linearGradient>
             </defs>

             {/* Ladders */}
             {Object.entries(LADDERS).map(([start, end]) => {
               const from = getCoords(Number(start));
               const to = getCoords(Number(end));
               const len = Math.sqrt(Math.pow(to.x-from.x, 2) + Math.pow(to.y-from.y, 2));
               const steps = Math.floor(len / 4);

               return (
                 <g key={`l-${start}`} style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.4))' }}>
                   <line x1={from.x - 1.8} y1={from.y} x2={to.x - 1.8} y2={to.y} stroke="url(#woodGrad)" strokeWidth="1.2" strokeLinecap="round" />
                   <line x1={from.x + 1.8} y1={from.y} x2={to.x + 1.8} y2={to.y} stroke="url(#woodGrad)" strokeWidth="1.2" strokeLinecap="round" />
                   {Array.from({ length: steps }).map((_, i) => {
                     const t = (i + 1) / (steps + 1);
                     const rx = from.x + (to.x - from.x) * t;
                     const ry = from.y + (to.y - from.y) * t;
                     return <line key={i} x1={rx - 2} y1={ry} x2={rx + 2} y2={ry} stroke="#3e2723" strokeWidth="0.8" strokeLinecap="round" />;
                   })}
                 </g>
               );
             })}

             {/* Snakes */}
             {Object.entries(SNAKES).map(([start, end]) => {
               const from = getCoords(Number(start));
               const to = getCoords(Number(end));
               const midX = from.x + (to.x - from.x) * 0.5 + (Math.sin(Number(start)) * 10);
               const midY = (from.y + to.y) / 2;
               
               return (
                 <g key={`s-${start}`} style={{ filter: 'drop-shadow(2px 5px 6px rgba(0,0,0,0.5))' }}>
                    <path 
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`} 
                      stroke="url(#bodyGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round"
                    />
                    {/* Scales shading */}
                    <path 
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`} 
                      stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" fill="none" strokeDasharray="0.5 1.5" strokeLinecap="round"
                    />
                    <circle cx={from.x} cy={from.y} r="1.8" fill="#4a0404" />
                    <circle cx={from.x - 0.5} cy={from.y - 0.5} r="0.4" fill="white" />
                    <circle cx={from.x + 0.5} cy={from.y - 0.5} r="0.4" fill="white" />
                    <path d={`M ${from.x} ${from.y} Q ${from.x} ${from.y-3} ${from.x+1} ${from.y-4}`} stroke="#ef4444" strokeWidth="0.3" fill="none" />
                 </g>
               );
             })}
          </svg>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="flex gap-6 md:gap-10">
            {players.map((p, idx) => (
              <div key={p.id} className={`flex flex-col items-center gap-3 transition-transform duration-500 ${idx === currentPlayerIdx ? 'scale-110' : 'opacity-20'}`}>
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl border-4 shadow-xl flex items-center justify-center relative" style={{ borderColor: p.color, backgroundColor: p.color + '10' }}>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/50 shadow-lg" style={{ backgroundColor: p.color }} />
                    {idx === currentPlayerIdx && <motion.div layoutId="pointer" className="absolute -top-3 bg-neutral-900 text-white text-[8px] px-2 py-0.5 rounded-full font-black">Active</motion.div>}
                 </div>
                 <p className="text-[10px] md:text-sm font-black uppercase text-neutral-800">{p.name}</p>
                 <p className="text-[10px] font-bold text-neutral-400">POS: {p.position}</p>
              </div>
            ))}
         </div>

         <div className="flex flex-col items-center gap-4">
            <button 
              onClick={rollDice}
              disabled={isRolling || !!winner || (players[currentPlayerIdx]?.isBot ?? false)}
              className="relative disabled:opacity-20 transition-all hover:scale-105 active:scale-95"
            >
              <Dice value={diceValue} isSpinning={isSpinning} />
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 italic">
               {isRolling ? 'Waiting for result...' : 'Click to roll dice'}
            </p>
         </div>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-neutral-900/95 backdrop-blur-xl flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-lg w-full">
                <Trophy className="w-40 h-40 md:w-60 md:h-60 text-yellow-400 mx-auto mb-10 drop-shadow-[0_20px_60px_rgba(250,204,21,0.5)]" />
                <h2 className="text-6xl md:text-9xl font-black text-white uppercase italic leading-none mb-4">{winner.isBot ? 'Bot Win' : 'Victory!'}</h2>
                <p className="text-yellow-400 font-bold uppercase tracking-[0.4em] mb-12 text-sm md:text-xl">{winner.name} Reached Success</p>
                <button onClick={onBack} className="w-full bg-white text-neutral-900 py-6 rounded-3xl font-black uppercase tracking-widest text-lg hover:brightness-110 transition-all shadow-2xl">Play Again</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
