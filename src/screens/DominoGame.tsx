import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Settings2, Info, Layers, Hand, RotateCw, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { cn } from '../lib/utils';

// --- Types ---
type Tile = [number, number];

interface Player {
  id: string;
  name: string;
  hand: Tile[];
  isBot: boolean;
  color: string;
  score: number;
}

interface GameState {
  deck: Tile[];
  players: Player[];
  board: Tile[];
  currentPlayerIdx: number;
  winner: Player | null;
  gameStatus: 'setup' | 'playing' | 'gameover';
  variant: 'block' | 'draw';
  maxDot: number;
}

// --- Helpers ---
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const generateDeck = (max: number): Tile[] => {
  const deck: Tile[] = [];
  for (let i = 0; i <= max; i++) {
    for (let j = i; j <= max; j++) {
      deck.push([i, j]);
    }
  }
  return deck;
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const isDouble = (tile: Tile) => tile[0] === tile[1];
const getTileSum = (tile: Tile) => tile[0] + tile[1];

// --- Components ---

interface DominoTileProps {
  tile: Tile;
  isVertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isPlayable?: boolean;
  isGhost?: boolean;
  rotation?: number;
  highlight?: boolean;
  isFlipped?: boolean;
}

const DominoTile: React.FC<DominoTileProps> = ({ 
  tile, 
  isVertical = true, 
  size = 'md', 
  onClick, 
  disabled, 
  className = "",
  isPlayable = false,
  isGhost = false,
  rotation = 0,
  highlight = false,
  isFlipped = false
}) => {
  const dotPositions: Record<number, number[]> = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 3, 6, 2, 5, 8],
  };

  const renderHalf = (val: number) => {
    const padding = size === 'sm' ? 'p-1' : 'p-1.5 md:p-2';
    const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-2 h-2 md:w-2.5 md:h-2.5';
    
    return (
      <div className={`grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full ${padding}`}>
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[val]?.includes(i) && (
              <div className={`${dotSize} bg-black rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getDimensions = () => {
    switch(size) {
      case 'sm': return isVertical ? 'w-8 h-16' : 'w-16 h-8';
      case 'md': return isVertical ? 'w-14 h-28' : 'w-28 h-14';
      case 'lg': return isVertical ? 'w-18 h-36' : 'w-36 h-18';
      default: return 'w-14 h-28';
    }
  }

  if (isGhost) {
    return (
      <div 
        className={cn(
          "relative border-2 border-dashed border-white/40 flex items-center justify-center rounded-[0.8rem] md:rounded-[1.2rem] transition-all duration-300 bg-white/5",
          getDimensions(),
          highlight ? "border-amber-400 bg-amber-400/20 scale-110 shadow-[0_0_40px_rgba(251,191,36,0.3)]" : "",
          className
        )}
      >
        <div className={cn(
          "w-3 h-3 rounded-full transition-all",
          highlight ? "bg-amber-400 animate-pulse" : "bg-white/20"
        )} />
      </div>
    );
  }

  return (
    <motion.div
      layout
      style={{ rotate: rotation }}
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
      className={`
        ${getDimensions()} 
        ${isVertical ? 'flex-col' : 'flex-row'}
        flex bg-[#fdfaf0] rounded-[0.8rem] md:rounded-[1.2rem] border-[2px] border-black/90 shadow-[4px_6px_0px_rgba(0,0,0,0.3)] relative overflow-visible transition-all shrink-0
        ${disabled && !isGhost ? 'opacity-100' : ''}
        ${isGhost ? 'opacity-40 shadow-none' : ''}
        ${highlight ? 'ring-4 ring-amber-400 z-30 shadow-2xl' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {!isFlipped && (
        <>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {renderHalf(tile[0])}
          </div>
          <div className={`relative ${isVertical ? 'w-full h-[1.5px]' : 'w-[1.5px] h-full'} bg-black/80 shrink-0`}>
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-3 h-3'} bg-[#cda434] rounded-full border border-black/40 shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] z-10`} />
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {renderHalf(tile[1])}
          </div>
        </>
      )}
      {isFlipped && (
        <div className="w-full h-full bg-[#fdfaf0] flex items-center justify-center rounded-[inherit]">
           <div className="w-4 h-4 rounded-full bg-black/5 border border-black/10" />
        </div>
      )}
    </motion.div>
  );
};

export const DominoGame: React.FC<{ onBack: () => void, mode: any, players?: any[] }> = ({ onBack, mode, players: propPlayers }) => {
  const { language } = useAppContext();
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    players: [],
    board: [],
    currentPlayerIdx: 0,
    winner: null,
    gameStatus: 'setup',
    variant: 'draw',
    maxDot: 6,
  });

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragOverSide, setDragOverSide] = useState<'start' | 'end' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const startZoneRef = useRef<HTMLDivElement>(null);
  const endZoneRef = useRef<HTMLDivElement>(null);
  const centerZoneRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const currentBoardEnds = useMemo(() => {
    if (gameState.board.length === 0) return [null, null];
    return [gameState.board[0][0], gameState.board[gameState.board.length - 1][1]];
  }, [gameState.board]);

  const initGame = useCallback((maxDot: number = 6, variant: 'block' | 'draw' = 'draw') => {
    const fullDeck = generateDeck(maxDot);
    const shuffled = shuffle(fullDeck);
    
    let gamePlayers: Player[] = [];
    const count = mode?.players || 2;

    const createPlayer = (id: string, name: string, isBot: boolean, index: number): Player => ({
      id,
      name,
      hand: [],
      isBot,
      color: COLORS[index % COLORS.length],
      score: 0,
    });

    if (mode?.mode === 'bot') {
      gamePlayers.push(createPlayer('1', 'You', false, 0));
      for (let i = 1; i < count; i++) {
        gamePlayers.push(createPlayer(String(i + 1), `Bot ${i}`, true, i));
      }
    } else if (propPlayers && propPlayers.length > 0) {
      gamePlayers = propPlayers.map((p, i) => createPlayer(p.uid || String(i), p.name, false, i));
    } else {
      gamePlayers = [createPlayer('1', 'You', false, 0), createPlayer('2', 'Bot 1', true, 1)];
    }

    const tilesPerPlayer = gamePlayers.length <= 2 ? 7 : (gamePlayers.length === 3 ? 6 : 5);
    gamePlayers.forEach((p) => {
      p.hand = shuffled.splice(0, tilesPerPlayer);
    });

    setGameState({
      deck: shuffled,
      players: gamePlayers,
      board: [],
      currentPlayerIdx: 0,
      winner: null,
      gameStatus: 'playing',
      variant,
      maxDot,
    });
    setLastAction("Match Started");
  }, [mode, propPlayers]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const canPlayTile = (tile: Tile, ends: (number | null)[]) => {
    const [leftEnd, rightEnd] = ends;
    if (leftEnd === null) return true;
    return tile[0] === leftEnd || tile[1] === leftEnd || tile[0] === rightEnd || tile[1] === rightEnd;
  };

  const getPlayableSides = (tile: Tile, ends: (number | null)[]) => {
    const [leftEnd, rightEnd] = ends;
    if (leftEnd === null) return ['start', 'end'] as const;
    const sides: ('start' | 'end')[] = [];
    if (tile[0] === leftEnd || tile[1] === leftEnd) sides.push('start');
    if (tile[0] === rightEnd || tile[1] === rightEnd) sides.push('end');
    return sides;
  };

  const handleTilePlacement = (side: 'start' | 'end', tileIndex: number) => {
    let actionText = "";
    let hasWon = false;
    
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIdx];
      if (!currentPlayer || !currentPlayer.hand[tileIndex]) return prev;
      
      const tile = currentPlayer.hand[tileIndex];
      const [leftEnd, rightEnd] = [
        prev.board.length === 0 ? null : prev.board[0][0],
        prev.board.length === 0 ? null : prev.board[prev.board.length - 1][1]
      ];

      if (leftEnd !== null && !canPlayTile(tile, [leftEnd, rightEnd])) return prev;

      let orientedTile: Tile = [tile[0], tile[1]];
      if (side === 'start') {
        if (leftEnd !== null) orientedTile = tile[1] === leftEnd ? [tile[0], tile[1]] : [tile[1], tile[0]];
      } else {
        if (rightEnd !== null) orientedTile = tile[0] === rightEnd ? [tile[0], tile[1]] : [tile[1], tile[0]];
      }

      const newBoard = [...prev.board];
      if (side === 'start') newBoard.unshift(orientedTile);
      else newBoard.push(orientedTile);

      const newPlayers = prev.players.map((p, idx) => {
        if (idx === prev.currentPlayerIdx) {
          const newHand = [...p.hand];
          newHand.splice(tileIndex, 1);
          return { ...p, hand: newHand };
        }
        return p;
      });

      hasWon = newPlayers[prev.currentPlayerIdx].hand.length === 0;
      const t = (translations[language] as any);
      actionText = `${currentPlayer.name} ${t.played} ${tile[0]}|${tile[1]}`;
      
      // Auto-scroll logic 
      setTimeout(() => {
        if (boardRef.current) {
          if (side === 'start') boardRef.current.scrollLeft = 0;
          else boardRef.current.scrollLeft = boardRef.current.scrollWidth;
        }
      }, 50);

      return {
        ...prev,
        board: newBoard,
        players: newPlayers,
        winner: hasWon ? newPlayers[prev.currentPlayerIdx] : null,
        gameStatus: hasWon ? 'gameover' : 'playing',
        currentPlayerIdx: hasWon ? prev.currentPlayerIdx : (prev.currentPlayerIdx + 1) % prev.players.length
      };
    });

    if (hasWon) confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    const isBot = gameState.players[gameState.currentPlayerIdx]?.isBot;
    if (actionText && !isBot) setLastAction(actionText);
    
    setDraggingIndex(null);
    setDragOverSide(null);
  };

  const drawTile = () => {
    if (gameState.deck.length === 0) return;

    let actionText = "";
    setGameState(prev => {
      const newDeck = [...prev.deck];
      const drawnTile = newDeck.pop()!;
      const newPlayers = prev.players.map((p, idx) => {
        if (idx === prev.currentPlayerIdx) {
          return { ...p, hand: [...p.hand, drawnTile] };
        }
        return p;
      });

      const [leftEnd, rightEnd] = [
        prev.board.length === 0 ? null : prev.board[0][0],
        prev.board.length === 0 ? null : prev.board[prev.board.length - 1][1]
      ];
      
      const canPlayNewTile = canPlayTile(drawnTile, [leftEnd, rightEnd] as [number | null, number | null]);
      const shouldSkipTurn = !canPlayNewTile;
      
      const t = (translations[language] as any);
      actionText = `${prev.players[prev.currentPlayerIdx].name} ${t.drew} ${drawnTile[0]}|${drawnTile[1]}${shouldSkipTurn ? ` (${t.no_move_skipping})` : ""}`;

      return {
        ...prev,
        deck: newDeck,
        players: newPlayers,
        currentPlayerIdx: shouldSkipTurn ? (prev.currentPlayerIdx + 1) % prev.players.length : prev.currentPlayerIdx
      };
    });
    
    // Only show action if it's not a bot
    const isBot = gameState.players[gameState.currentPlayerIdx]?.isBot;
    if (actionText && !isBot) setLastAction(actionText);
  };

  const passTurn = () => {
    let actionText = "";
    setGameState(prev => {
      const nextIdx = (prev.currentPlayerIdx + 1) % prev.players.length;
      const t = (translations[language] as any);
      actionText = `${prev.players[prev.currentPlayerIdx].name} ${t.passed}`;
      return { ...prev, currentPlayerIdx: nextIdx };
    });
    const isBot = gameState.players[gameState.currentPlayerIdx]?.isBot;
    if (actionText && !isBot) setLastAction(actionText);
  };

  // Drag logic: Snapping and Previews
  const handleDragUpdate = (info: any, tileIndex: number) => {
    const isTouchDevice = window.innerWidth < 1024;
    const myPlayer = gameState.players[0];
    const currentTile = myPlayer?.hand[tileIndex];
    if (!currentTile || !info.point) return;

    // Visual Tile Relative Coordinates
    // Standard domino size is ~56x112 or similar. Let's assume some defaults for center hit testing
    const lift = isTouchDevice ? 140 : 60;
    const posX = info.point.x - dragOffset.x;
    const posY = info.point.y - dragOffset.y - lift;
    
    // Get potential drop zones in viewport space
    const startZone = startZoneRef.current?.getBoundingClientRect();
    const endZone = endZoneRef.current?.getBoundingClientRect();
    const centerZone = centerZoneRef.current?.getBoundingClientRect();
    
    const playableSides = getPlayableSides(currentTile, currentBoardEnds);

    // Snap detection logic
    if (gameState.board.length === 0) {
      // First tile: Any drop on center table
      if (centerZone && posX >= centerZone.left - 50 && posX <= centerZone.right + 50 && posY >= centerZone.top - 50 && posY <= centerZone.bottom + 50) {
        setDragOverSide('end');
      } else {
        setDragOverSide(null);
      }
    } else {
      const startZoneCenterX = startZone ? startZone.left + startZone.width / 2 : -99999;
      const startZoneCenterY = startZone ? startZone.top + startZone.height / 2 : -99999;
      const endZoneCenterX = endZone ? endZone.left + endZone.width / 2 : -99999;
      const endZoneCenterY = endZone ? endZone.top + endZone.height / 2 : -99999;

      const distToStart = Math.hypot(posX - startZoneCenterX, posY - startZoneCenterY);
      const distToEnd = Math.hypot(posX - endZoneCenterX, posY - endZoneCenterY);

      // VERY generous magnetic pull for mobile
      const baseThreshold = isTouchDevice ? 700 : 800;
      
      // If only one side is possible, force pull
      const startThreshold = (!playableSides.includes('end')) ? baseThreshold * 4 : baseThreshold;
      const endThreshold = (!playableSides.includes('start')) ? baseThreshold * 4 : baseThreshold;

      if (distToStart < startThreshold && playableSides.includes('start') && (distToStart < distToEnd || !playableSides.includes('end'))) {
        setDragOverSide('start');
      } else if (distToEnd < endThreshold && playableSides.includes('end')) {
        setDragOverSide('end');
      } else {
        setDragOverSide(null);
      }
    }
  };

  const handleDragEnd = (tileIndex: number, info: any) => {
    if (!info.point) {
      setDraggingIndex(null);
      setDragOverSide(null);
      return;
    }

    const isTouchDevice = window.innerWidth < 1024;
    const lift = isTouchDevice ? 140 : 60;
    const posX = info.point.x - dragOffset.x;
    const posY = info.point.y - dragOffset.y - lift;

    let sideToPlace = dragOverSide;

    // Last resort snap: if we dropped near the board without an active side
    if (!sideToPlace && draggingIndex !== null && myPlayer && myPlayer.hand[tileIndex]) {
      const tile = myPlayer.hand[tileIndex];
      const playable = getPlayableSides(tile, currentBoardEnds);
      const centerZone = centerZoneRef.current?.getBoundingClientRect();

      // Even more aggressive pull on mobile
      const releaseMargin = isTouchDevice ? 400 : 250;

      if (centerZone && posX >= centerZone.left - releaseMargin && posX <= centerZone.right + releaseMargin && 
          posY >= centerZone.top - releaseMargin && posY <= centerZone.bottom + releaseMargin) {
        
        if (gameState.board.length === 0) {
          sideToPlace = 'end';
        } else if (playable.length === 1) {
          sideToPlace = playable[0];
        } else if (playable.length > 1) {
          const startZone = startZoneRef.current?.getBoundingClientRect();
          const endZone = endZoneRef.current?.getBoundingClientRect();
          const dS = startZone ? Math.hypot(posX - (startZone.left + startZone.width/2), posY - (startZone.top + startZone.height/2)) : Infinity;
          const dE = endZone ? Math.hypot(posX - (endZone.left + endZone.width/2), posY - (endZone.top + endZone.height/2)) : Infinity;
          sideToPlace = dS < dE ? 'start' : 'end';
        }
      }
    }

    if (sideToPlace) {
      handleTilePlacement(sideToPlace, tileIndex);
    } else {
      setDraggingIndex(null);
      setDragOverSide(null);
    }
    
    setDragPos({ x: 0, y: 0 }); // Reset position
  };

  // Bot logic
  useEffect(() => {
    const player = gameState.players[gameState.currentPlayerIdx];
    if (!player || !player.isBot || gameState.gameStatus !== 'playing' || gameState.winner) return;

    const timer = setTimeout(() => {
      const playable = player.hand.map((t, i) => ({ tile: t, index: i, sides: getPlayableSides(t, currentBoardEnds) }))
                                  .filter(item => item.sides.length > 0);

      if (playable.length > 0) {
        const best = playable.sort((a, b) => getTileSum(b.tile) - getTileSum(a.tile))[0];
        const side = best.sides[Math.floor(Math.random() * best.sides.length)];
        handleTilePlacement(side, best.index);
      } else if (gameState.variant === 'draw' && gameState.deck.length > 0) {
        drawTile();
      } else {
        passTurn();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState, currentBoardEnds]);

  const myPlayer = gameState.players[0];
  const currentPlayer = gameState.players[gameState.currentPlayerIdx];
  const isMyTurn = gameState.currentPlayerIdx === 0 && myPlayer && !myPlayer.isBot;

  return (
    <div className="h-full w-full bg-[#1e130c] text-white flex flex-col font-sans overflow-hidden relative">
      {/* Tabletop Atmosphere */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      {/* Interface overlay */}
      <header id="game-header" className="p-4 md:p-8 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={onBack} className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition-all shadow-xl">
             <ArrowLeft size={20} className="text-amber-50" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-amber-50 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              Elite <span className="text-amber-500">Dominoes</span>
            </h2>
            <div className="flex gap-2 md:gap-4 mt-0.5 md:mt-2">
               <span className="text-[8px] md:text-[10px] font-black bg-amber-500 text-black px-2 md:px-3 py-0.5 rounded-sm uppercase tracking-widest">{gameState.variant}</span>
               <span className="text-[8px] md:text-[10px] font-black bg-white/5 text-amber-200/50 px-2 md:px-3 py-0.5 rounded-sm uppercase tracking-widest border border-white/5">DBL-{gameState.maxDot}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           {lastAction && (
             <motion.div 
               key={lastAction}
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               className="hidden border border-white/5 px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/60 lg:block"
             >
               {lastAction}
             </motion.div>
           )}
           <button onClick={() => setShowSettings(true)} className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl border border-white/10 transition-all shadow-xl text-amber-500">
             <Settings2 size={20} />
           </button>
        </div>
      </header>

      {/* Main Table Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-8 overflow-hidden relative z-10">
        
        {/* Boneyard - Left Panel */}
        <div className="hidden md:flex w-24 md:w-40 lg:w-48 flex-col gap-4 shrink-0 overflow-y-auto scrollbar-hide pb-20 px-2 md:px-4 border-r border-white/5">
           <div className="sticky top-0 bg-[#2a1b12]/40 backdrop-blur-md py-2 z-20 border-b border-white/5 mb-2">
              <p className="text-[10px] font-black uppercase text-amber-500/40 tracking-[0.3em]">Boneyard</p>
           </div>
           
           <div className="grid grid-cols-2 gap-2 md:gap-3 justify-items-center">
              {gameState.deck.map((tile, i) => (
                <motion.div 
                  key={`deck-${tile[0]}-${tile[1]}-${i}`} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, rotate: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={drawTile}
                  className="relative cursor-pointer"
                >
                   <DominoTile tile={tile} size="sm" isVertical={true} isFlipped={true} className="shadow-black/60 shadow-xl" />
                </motion.div>
              ))}
              {gameState.deck.length === 0 && (
                <div className="col-span-2 text-center py-10 opacity-20">
                   <p className="text-[10px] font-black uppercase tracking-widest">Empty</p>
                </div>
              )}
           </div>
        </div>

        {/* Board - The Action Stage */}
        <div 
          id="board-container"
          ref={centerZoneRef}
          className={`flex-1 min-h-[350px] md:mt-16 rounded-[2rem] md:rounded-[6rem] flex items-center justify-center relative overflow-hidden backdrop-blur-md bg-black/10 border transition-all duration-500 ${draggingIndex !== null ? 'border-amber-400/30 shadow-[inset_0_0_120px_rgba(251,191,36,0.1)]' : 'border-white/5 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]'}`}
        >
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] opacity-5" />
           
            <div 
              id="game-board-scroller"
              ref={boardRef}
              className="flex flex-row items-center gap-4 md:gap-6 px-4 md:px-[20vw] py-12 md:py-20 overflow-x-auto overflow-y-hidden scroll-smooth relative z-10 w-full h-full scrollbar-hide lg:justify-center"
            >
               <AnimatePresence>
                 {/* Placement START ZONE Detection & UI */}
                 {draggingIndex !== null && myPlayer && getPlayableSides(myPlayer.hand[draggingIndex], currentBoardEnds).includes('start') && (
                   <motion.div 
                     key="start-zone-container"
                     ref={startZoneRef}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="shrink-0 w-32 md:w-40 h-32 md:h-40 flex items-center justify-center relative z-20"
                   >
                     <div className={`relative transition-all duration-300 ${dragOverSide === 'start' ? 'scale-125' : 'scale-100'}`}>
                       <DominoTile 
                         tile={myPlayer.hand[draggingIndex]}
                         size={window.innerWidth < 768 ? 'sm' : 'md'}
                         isVertical={false}
                         isGhost={true}
                         highlight={dragOverSide === 'start'}
                         className={`transition-all border-2 md:border-4 ${dragOverSide === 'start' ? 'border-amber-400 opacity-100 shadow-[0_0_80px_rgba(251,191,36,0.8)]' : 'border-white/20 opacity-30 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                       />
                       <div className={`absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] md:text-[12px] font-black text-amber-500 uppercase tracking-tighter transition-opacity ${dragOverSide === 'start' ? 'opacity-100' : 'opacity-40'}`}>
                         {translations[language].start}
                       </div>
                     </div>
                   </motion.div>
                 )}

                 {/* Board Chain */}
                 {gameState.board.map((tile, i) => (
                   <DominoTile 
                     key={`board-tile-${tile[0]}-${tile[1]}-${i}`}
                     tile={tile}
                     size={window.innerWidth < 768 ? 'sm' : 'md'}
                     isVertical={false}
                     disabled
                     className="shadow-2xl"
                   />
                 ))}

                 {/* Placement END ZONE Detection & UI */}
                 {draggingIndex !== null && myPlayer && (getPlayableSides(myPlayer.hand[draggingIndex], currentBoardEnds).includes('end') || gameState.board.length === 0) && (
                   <motion.div 
                     key="end-zone-container"
                     ref={endZoneRef}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="shrink-0 w-32 md:w-40 h-32 md:h-40 flex items-center justify-center relative z-20"
                   >
                     <div className={`relative transition-all duration-300 ${dragOverSide === 'end' ? 'scale-125' : 'scale-100'}`}>
                       <DominoTile 
                         tile={myPlayer.hand[draggingIndex]}
                         size={window.innerWidth < 768 ? 'sm' : 'md'}
                         isVertical={false}
                         isGhost={true}
                         highlight={dragOverSide === 'end'}
                         className={`transition-all border-2 md:border-4 ${dragOverSide === 'end' ? 'border-amber-400 opacity-100 shadow-[0_0_80px_rgba(251,191,36,0.8)]' : 'border-white/20 opacity-30 shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}
                       />
                       <div className={`absolute -bottom-8 md:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] md:text-[12px] font-black text-amber-500 uppercase tracking-tighter transition-opacity ${dragOverSide === 'end' ? 'opacity-100' : 'opacity-40'}`}>
                         {gameState.board.length === 0 ? translations[language].place_here : translations[language].end}
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
        </div>
      </div>

      {/* Hand Area - Tray at the bottom */}
      <footer className="p-4 md:p-8 pt-0 shrink-0 relative z-20 -mb-6 md:-mb-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-10">
            
            {/* Hand Tray */}
            <div className="flex-1 w-full bg-black/40 backdrop-blur-2xl p-4 md:p-6 rounded-[2rem] md:rounded-[4rem] border border-white/5 shadow-2xl relative overflow-visible">
               
               <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10 px-4">
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full ring-2 ring-white/10 flex items-center justify-center font-black text-[8px] shadow-lg" style={{ backgroundColor: currentPlayer?.color }}>
                        {currentPlayer?.name[0]}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{currentPlayer?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={passTurn}
                      disabled={!isMyTurn || (gameState.variant === 'draw' && gameState.deck.length > 0) || (currentPlayer && currentPlayer.hand.some(t => canPlayTile(t, currentBoardEnds)))}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-500 disabled:opacity-20 hover:text-amber-400"
                    >
                      Pass Turn
                    </button>
                    <div className="flex gap-1.5">
                       {gameState.players.map((p) => (
                         <div key={`status-dot-${p.id}`} className={`w-1.5 h-1.5 rounded-full transition-all ${gameState.currentPlayerIdx === gameState.players.indexOf(p) ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]' : 'bg-white/5'}`} />
                       ))}
                    </div>
                  </div>
               </div>

               {/* Hand Grid */}
               <div 
                 className={`
                    grid gap-4 md:gap-6 relative z-10 p-2
                    ${myPlayer && myPlayer.hand.length > 6 ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8' : 'grid-cols-2 md:grid-cols-4'}
                    place-items-center
                 `}
               >
                  {myPlayer && myPlayer.hand.map((tile, i) => (
                    <motion.div
                      key={`hand-tile-${tile[0]}-${tile[1]}-${i}`}
                      drag={isMyTurn && canPlayTile(tile, currentBoardEnds)}
                      dragMomentum={false}
                      dragElastic={1}
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      onDragStart={(e: any, info) => {
                        const rect = (e.currentTarget || e.target).getBoundingClientRect();
                        if (!rect) return;
                        // Better offset calculation for centered lift
                        setDragOffset({
                          x: info.point.x - (rect.left + rect.width / 2),
                          y: info.point.y - (rect.top + rect.height / 2)
                        });
                        setDraggingIndex(i);
                        setDragPos({ x: info.point.x, y: info.point.y });
                      }}
                      onDrag={(e, info) => {
                        setDragPos({ x: info.point.x, y: info.point.y });
                        handleDragUpdate(info, i);
                      }}
                      onDragEnd={(e: any, info) => handleDragEnd(i, info)}
                      className={`relative grow-0 touch-none ${draggingIndex === i ? 'z-[1000]' : 'z-10'}`}
                    >
                      {/* The Physical Tile (Source) - Hidden while dragging */}
                      <div className={draggingIndex === i ? 'opacity-0' : 'opacity-100 transition-opacity'}>
                        <DominoTile 
                          tile={tile} 
                          size={(window.innerWidth < 768 ? 'sm' : 'md') as 'sm' | 'md'} 
                          highlight={false}
                          disabled={draggingIndex !== null && draggingIndex !== i || (isMyTurn && !canPlayTile(tile, currentBoardEnds)) || !isMyTurn}
                          className="hover:-translate-y-2 transition-transform cursor-grab active:cursor-grabbing"
                        />
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Quick Draw Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={drawTile}
              disabled={!isMyTurn || gameState.deck.length === 0}
              className="flex md:flex flex-col items-center justify-center gap-1 md:gap-2 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-amber-500 text-black rounded-full shadow-2xl disabled:opacity-20 transition-all shrink-0 self-center absolute -right-2 md:relative md:right-0 z-30"
            >
               <Layers size={window.innerWidth < 768 ? 16 : 24} />
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter">Draw ({gameState.deck.length})</span>
            </motion.button>
         </div>
      </footer>

      {/* Global Dragging Proxy - Rendered high in the hierarchy to avoid stacking context issues */}
      <AnimatePresence>
        {draggingIndex !== null && myPlayer && myPlayer.hand[draggingIndex] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: dragOverSide ? (window.innerWidth < 1024 ? 1.8 : 1.5) : (window.innerWidth < 1024 ? 1.5 : 1.3) }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed pointer-events-none z-[5000] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ 
              left: dragPos.x - dragOffset.x, 
              top: dragPos.y - dragOffset.y - (window.innerWidth < 1024 ? 140 : 60),
              filter: dragOverSide ? 'drop-shadow(0 0 40px rgba(251, 191, 36, 0.8))' : 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))'
            }}
          >
            <DominoTile 
              tile={myPlayer.hand[draggingIndex]} 
              size={(window.innerWidth < 1024 ? 'sm' : 'md') as 'sm' | 'md'} 
              highlight={dragOverSide !== null}
              className="saturate-150 brightness-110 transition-all duration-300"
            />
            {dragOverSide && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-14 bg-amber-500 text-black text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl border-2 border-white/20"
              >
                Snap!
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win View */}
      <AnimatePresence>
        {gameState.gameStatus === 'gameover' && (
          <motion.div 
            key="game-over-modal"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
          >
             <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} className="text-center max-w-2xl w-full">
                <div className="relative inline-block mb-12">
                   <Trophy size={180} className="text-amber-500 drop-shadow-[0_20px_60px_rgba(245,158,11,0.5)] animate-bounce-slow" />
                   <div className="absolute inset-0 animate-ping opacity-20 bg-amber-500 rounded-full blur-3xl" />
                </div>
                <h2 className="text-8xl md:text-[10rem] font-black uppercase italic tracking-tighter text-white leading-none mb-6">
                  {gameState.winner?.isBot ? 'Bot Master' : 'Victory'}
                </h2>
                <div className="bg-amber-500 py-2 px-12 rounded-full inline-block mb-16 shadow-2xl shadow-amber-500/20">
                   <p className="text-black font-black uppercase tracking-[0.4em] text-sm">{gameState.winner?.name} Dominates the table</p>
                </div>
                <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                   <button onClick={() => initGame(gameState.maxDot, gameState.variant)} className="bg-white text-black py-6 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all">New Match</button>
                   <button onClick={onBack} className="bg-white/5 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest border border-white/10 active:scale-95 transition-all">Return Home</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showSettings && (
          <motion.div 
            key="settings-modal"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#2a1b12] w-full max-w-xl rounded-[4rem] p-12 shadow-2xl border border-white/5 relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"><RotateCw size={32} className="rotate-45" /></button>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter text-amber-50 mb-12">Table Rules</h3>
                
                <div className="space-y-12">
                  <section>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] mb-6">Tile Distribution</p>
                    <div className="grid grid-cols-3 gap-4">
                       {[6, 9, 12].map(n => (
                         <button key={n} onClick={() => { initGame(n, gameState.variant); setShowSettings(false); }} className={`py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${gameState.maxDot === n ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>DBL-{n}</button>
                       ))}
                    </div>
                  </section>
                  <section>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] mb-6">Game Mode</p>
                    <div className="grid grid-cols-2 gap-4">
                       {['block', 'draw'].map(v => (
                         <button key={v} onClick={() => { initGame(gameState.maxDot, v as any); setShowSettings(false); }} className={`py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${gameState.variant === v ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{v} Mode</button>
                       ))}
                    </div>
                  </section>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-5px); } 50% { transform: translateY(5px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
