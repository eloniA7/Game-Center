import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Heart, Spade, Club as Clubs, Diamond, CheckCircle2, Users } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OkeyTile {
  number: number | null; // null for plain jokers
  color: 'red' | 'blue' | 'black' | 'yellow' | 'none';
  id: string;
}

const SYMBOLS = {
  red: Heart,
  blue: Clubs,
  black: Spade,
  yellow: Diamond,
  none: () => null
};

// Sortable Tile Component
interface SortableTileProps {
  tile: OkeyTile;
  id: string;
  size?: 'sm' | 'md';
  isOnRack?: boolean;
  isSelected?: boolean;
  onLongPress?: (id: string) => void;
  key?: React.Key;
}

const SortableTile = ({ tile, id, size = 'md', isOnRack = false, isSelected = false, onLongPress, onClick }: SortableTileProps & { onClick?: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : (isSelected ? 500 : 1),
    touchAction: 'none',
  };

  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const [isPressing, setIsPressing] = useState(false);

  const startLongPress = () => {
    setIsPressing(true);
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(id);
        setIsPressing(false);
      }, 2000); 
    }
  };

  const endLongPress = () => {
    setIsPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent | React.PointerEvent) => {
    // Only trigger if not dragging
    if (onClick) onClick(id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) onLongPress(id);
  };

  const mergedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      listeners?.onPointerDown?.(e);
      startLongPress();
    },
    onPointerUp: (e: React.PointerEvent) => {
      listeners?.onPointerUp?.(e);
      endLongPress();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      listeners?.onPointerLeave?.(e);
      endLongPress();
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...mergedListeners}
      onClick={handleClick}
      onDoubleClick={() => onLongPress?.(id)}
      onContextMenu={handleContextMenu}
      className={`shrink-0 outline-none transition-all duration-300 relative tile-item ${isSelected ? 'scale-105' : ''} ${isPressing ? 'scale-[0.98]' : ''}`}
    >
      <TileComponent tile={tile} size={size} isOnRack={isOnRack} />
      
      {isSelected && (
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -inset-1 border-2 border-amber-500/20 rounded-lg pointer-events-none z-10"
        />
      )}
    </div>
  );
};

const TileComponent = ({ tile, size = 'md', isOnRack = false, className = '' }: { tile: OkeyTile, size?: 'sm' | 'md' | 'xs', isOnRack?: boolean, className?: string, key?: React.Key }) => {
  const SymbolIcon = SYMBOLS[tile.color as keyof typeof SYMBOLS];
  const isJoker = tile.number === null;
  
  let dims = '';
  if (size === 'xs') dims = 'w-5 h-7 md:w-6 md:h-8';
  else if (isOnRack) dims = 'w-10 h-14 md:w-12 md:h-18';
  else if (size === 'md') dims = 'w-12 h-18 md:w-14 md:h-20';
  else dims = 'w-10 h-14';
  
  const colorHex = (color: string) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'black': return '#000000';
      case 'yellow': return '#fbbf24';
      default: return '#000000';
    }
  };
  
  return (
    <div 
      className={`${dims} bg-[#fdfaf1] rounded-sm md:rounded-md flex flex-col items-center justify-between py-0.5 md:py-0.5 border-b-[1px] md:border-b-[2px] border-neutral-300 relative overflow-hidden transition-all shrink-0 ${className}`}
      style={{
        boxShadow: isOnRack ? 'inset 0 -10px 20px rgba(0,0,0,0.05), 0 5px 15px rgba(0,0,0,0.3)' : (size === 'xs' ? '0 1px 0 rgba(0,0,0,0.2)' : '0 4px 0 rgba(0,0,0,0.2)')
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {!isJoker ? (
        <>
          <span 
            className={`${size === 'xs' ? 'text-[8px] md:text-[10px]' : 'text-lg md:text-2xl'} font-black leading-none mt-0.5`}
            style={{ color: colorHex(tile.color) }}
          >
            {tile.number}
          </span>
          <div className="mt-auto pb-0.5">
            <SymbolIcon 
              size={size === 'md' ? 14 : (size === 'xs' ? 5 : 10)} 
              fill={colorHex(tile.color)} 
              color={colorHex(tile.color)} 
              strokeWidth={size === 'xs' ? 1 : 3}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
        </div>
      )}
    </div>
  );
};

const DraggableBoardTile = ({ tile }: { tile: OkeyTile }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: tile.id });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 500 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none">
      <TileComponent tile={tile} size="md" />
    </div>
  );
};

const DroppableTable = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'game-table',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`absolute inset-0 flex flex-col items-center justify-center transition-colors duration-200 ${isOver ? 'bg-amber-500/10' : ''}`}
    >
      {children}
    </div>
  );
};

const MeldArea = ({ children, isVisible, isHolding }: { children: React.ReactNode, isVisible: boolean, isHolding: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'meld-area',
  });

  const hasContent = React.Children.count(children) > 0;

  return (
    <div 
      ref={setNodeRef}
      className={`absolute bottom-[44%] right-[4%] md:bottom-[34%] md:right-[8%] lg:right-[15%] w-24 h-24 md:w-56 md:h-56 transition-all duration-300 rounded-lg flex flex-col items-center justify-center z-40 
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        ${isOver 
          ? 'bg-amber-500/5 border border-amber-500/40 shadow-xl' 
          : 'bg-black/20 border border-white/5 backdrop-blur-sm'}
      `}
    >
      {!hasContent && !isOver && (
        <div className="flex flex-col items-center opacity-10 pointer-events-none">
          <CheckCircle2 size={32} className="text-white" />
        </div>
      )}

      <div className="flex flex-wrap gap-1 justify-center w-full p-2 overflow-y-auto scrollbar-hide">
        {children}
      </div>
    </div>
  );
};

const RackRow = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      id={id} 
      className={`relative min-h-[70px] md:min-h-[100px] bg-[#3a261a]/40 rounded-sm ${id === 'rack-row-1' ? 'border-b-4 border-[#251810]' : 'border-b-8 border-[#1a0f0a] mt-2'}`}
    >
      {children}
    </div>
  );
};

// Unique ID generator state
let tileIdCounter = 1000;

export const KurdishOkeyGame: React.FC<{ onBack: () => void, mode: any, players?: any[] }> = ({ onBack, mode, players: propPlayers }) => {
  const [allHands, setAllHands] = useState<OkeyTile[][]>([[], [], [], []]);
  const [board, setBoard] = useState<OkeyTile[]>([]);
  const [allMelds, setAllMelds] = useState<OkeyTile[][][]>([[], [], [], []]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [winner, setWinner] = useState<boolean>(false);
  const [deck, setDeck] = useState<OkeyTile[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [turn, setTurn] = useState<number>(0);
  const [hasPickedUp, setHasPickedUp] = useState(true); 
  const [restrictedTileId, setRestrictedTileId] = useState<string | null>(null);
  const [indicatorTile, setIndicatorTile] = useState<OkeyTile | null>(null);
  const [players, setPlayers] = useState([
    { id: 'user', name: 'تۆ', avatar: null as string | null },
    { id: 'bot1', name: 'BOT 1', avatar: null as string | null },
    { id: 'bot2', name: 'BOT 2', avatar: null as string | null },
    { id: 'bot3', name: 'BOT 3', avatar: null as string | null },
  ]);

  // Handy getter for current user's hand (index 0)
  const hand = allHands[0];
  const setHand = (updater: OkeyTile[] | ((prev: OkeyTile[]) => OkeyTile[])) => {
    setAllHands(prev => {
      const next = [...prev];
      if (typeof updater === 'function') {
        next[0] = updater(next[0]);
      } else {
        next[0] = updater;
      }
      return next;
    });
  };

  const finishedMelds = allMelds[0];
  const setFinishedMelds = (updater: OkeyTile[][] | ((prev: OkeyTile[][]) => OkeyTile[][])) => {
    setAllMelds(prev => {
      const next = [...prev];
      if (typeof updater === 'function') {
        next[0] = updater(next[0]);
      } else {
        next[0] = updater;
      }
      return next;
    });
  };

  useEffect(() => {
    if (propPlayers && propPlayers.length > 0) {
      setPlayers(prev => {
        const next = [...prev];
        propPlayers.forEach((p, i) => {
          if (i < next.length) {
            next[i] = {
              id: p.uid || String(i),
              name: p.name || (i === 0 ? 'تۆ' : 'BOT'),
              avatar: p.photo || null
            };
          }
        });
        return next;
      });
    }
  }, [propPlayers]);
  
  // Clear selection on background click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Find if we clicked a tile or rack
      const target = e.target as HTMLElement;
      if (!target.closest('.rack-item') && !target.closest('.tile-item')) {
        setSelectedTileIds([]);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const generateId = (prefix: string) => {
    tileIdCounter++;
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${randomStr}-${tileIdCounter}`;
  };
  
  const findMeldGroup = (tileId: string, currentHand: OkeyTile[]) => {
    const tile = currentHand.find(t => t.id === tileId);
    if (!tile || tile.number === null) return [tileId];

    const idx = currentHand.findIndex(t => t.id === tileId);
    
    const consecutive = [tile];
    // Left
    for (let i = idx - 1; i >= 0; i--) {
        const p = currentHand[i];
        if (p.number !== null && p.number === (consecutive[0].number as number) - 1) {
            consecutive.unshift(p);
        } else break;
    }
    // Right
    for (let i = idx + 1; i < currentHand.length; i++) {
        const n = currentHand[i];
        if (n.number !== null && n.number === (consecutive[consecutive.length - 1].number as number) + 1) {
            consecutive.push(n);
        } else break;
    }

    // Rule 2: Per (Sets) - Same numbers of DIFFERENT colors
    const sameNum = [tile];
    const colorsUsed = new Set([tile.color]);
    // Left
    for (let i = idx - 1; i >= 0; i--) {
        const p = currentHand[i];
        if (p.number === tile.number && !colorsUsed.has(p.color)) {
            sameNum.unshift(p);
            colorsUsed.add(p.color);
        } else break;
    }
    // Right
    for (let i = idx + 1; i < currentHand.length; i++) {
        const n = currentHand[i];
        if (n.number === tile.number && !colorsUsed.has(n.color)) {
            sameNum.push(n);
            colorsUsed.add(n.color);
        } else break;
    }

    // Return valid group if >= 3 tiles, otherwise just the clicked tile
    if (consecutive.length >= 3) return consecutive.map(t => t.id);
    if (sameNum.length >= 3) return sameNum.map(t => t.id);

    return [tileId];
  };

  const isValidMeld = (tiles: OkeyTile[]) => {
    if (tiles.length < 3) return false;
    if (tiles.some(t => t.number === null)) return false;

    // Check for Run (Consecutive numbers)
    const sortedTiles = [...tiles].sort((a, b) => (a.number || 0) - (b.number || 0));
    const isConsecutive = sortedTiles.every((t, i) => {
        if (i === 0) return true;
        return t.number === (sortedTiles[i-1].number as number) + 1;
    });
    if (isConsecutive) return true;

    // Check for Set (Same number, different colors)
    const allSameNumber = tiles.every(t => t.number === tiles[0].number);
    const colors = new Set(tiles.map(t => t.color));
    const allDiffColors = colors.size === tiles.length;
    
    return allSameNumber && allDiffColors;
  };

  const handleLongPress = (id: string) => {
    const group = findMeldGroup(id, hand);
    if (group.length > 1) {
      // Rearrange hand so selected group is adjacent
      const groupTiles = hand.filter(t => group.includes(t.id));
      // Sort groupTiles to match the order in the detected meld (findMeldGroup already does this but let's be safe)
      const firstTileIdx = hand.findIndex(t => group.includes(t.id));
      const remainingTiles = hand.filter(t => !group.includes(t.id));
      
      const newHand = [...remainingTiles];
      newHand.splice(firstTileIdx, 0, ...groupTiles);
      
      setHand(newHand);
      setSelectedTileIds(group);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } else {
      setSelectedTileIds([id]);
    }
  };

  const handleTileClick = (id: string) => {
    if (turn !== 0) return;
    setSelectedTileIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(tid => tid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateDeck = () => {
    const colors: ('red' | 'blue' | 'black' | 'yellow')[] = ['red', 'blue', 'black', 'yellow'];
    const newDeck: OkeyTile[] = [];
    
    for (let set = 0; set < 2; set++) {
      for (const color of colors) {
        for (let num = 1; num <= 13; num++) {
          newDeck.push({
            number: num,
            color: color,
            id: generateId(`${color}-${num}-${set}`)
          });
        }
      }
    }
    for (let i = 0; i < 2; i++) {
      newDeck.push({
        number: null,
        color: 'none',
        id: generateId(`joker-${i}`)
      });
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const fullDeck = generateDeck();
    setDeck(fullDeck);
    
    // Set Indicator (Gosterge)
    setIndicatorTile(fullDeck[fullDeck.length - 1]);
    
    // Deal tiles
    const hands = [
      fullDeck.slice(0, 15), // Player (starter)
      fullDeck.slice(15, 29),
      fullDeck.slice(29, 43),
      fullDeck.slice(43, 57),
    ];
    setAllHands(hands);
    setDeckIndex(57);
    setHasPickedUp(true);
  }, []);

  const handleDrawFromDeck = () => {
    if (turn !== 0 || hasPickedUp) return;
    
    // Restrict deckIndex so it never draws the indicator tile (last tile)
    const nextTile = deckIndex < deck.length - 1 ? deck[deckIndex] : null;
    if (nextTile) {
      setHand(prev => {
        if (prev.some(t => t.id === nextTile.id)) return prev;
        return [...prev, nextTile];
      });
      setDeckIndex(prev => prev + 1);
      setHasPickedUp(true);
      setRestrictedTileId(null);
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (!selectedTileIds.includes(active.id)) {
      setSelectedTileIds([]);
    }
    setActiveId(active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // --- LOGIC: Dropping to Meld Area ---
    if (over.id === 'meld-area') {
      if (turn !== 0 || !hasPickedUp) {
        setActiveId(null);
        return;
      }
      
      const activeIds = selectedTileIds.length > 0 ? selectedTileIds : [active.id];
      const tilesToMeld = hand.filter(t => activeIds.includes(t.id));
      
      if (isValidMeld(tilesToMeld)) {
        setFinishedMelds(prev => [...prev, tilesToMeld]);
        setHand(prev => prev.filter(t => !activeIds.includes(t.id)));
        setSelectedTileIds([]);
      } else {
        // Show rejection feedback if needed
        if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
        setSelectedTileIds([]);
      }
      setActiveId(null);
      return;
    }

    // --- LOGIC: Picking up from the table ---
    const isBoardToHand = board.some(t => t.id === active.id) && (over.id.includes('rack') || hand.some(t => t.id === over.id));
    if (isBoardToHand) {
      if (turn !== 0 || hasPickedUp) {
        setActiveId(null);
        return;
      }
      
      const lastDiscarded = board[board.length - 1];
      if (lastDiscarded && active.id === lastDiscarded.id) {
        setBoard(prev => prev.slice(0, -1));
        setHand(prev => [...prev, lastDiscarded]);
        setHasPickedUp(true);
        setRestrictedTileId(lastDiscarded.id);
      }
      setActiveId(null);
      return;
    }

    // --- LOGIC: Discarding to the table ---
    const isDiscardingToTable = over.id === 'game-table' || board.some(t => t.id === over.id);
    if (isDiscardingToTable) {
      if (turn !== 0 || !hasPickedUp || active.id === restrictedTileId) {
        setActiveId(null);
        return;
      }

      const tileToDiscard = hand.find(t => t.id === active.id);
      if (tileToDiscard) {
        setHand(prev => prev.filter(t => t.id !== active.id));
        setBoard(prev => {
          if (prev.some(t => t.id === tileToDiscard.id)) return prev;
          return [...prev, tileToDiscard];
        });
        
        // --- TURN TRANSITION TO NEXT BOT ---
        setTurn(1);
        setHasPickedUp(false); 
        setRestrictedTileId(null);
      }
      setActiveId(null);
      return;
    }

    // --- LOGIC: Moving rack to rack ---
    if (active.id !== over.id) {
      if (selectedTileIds.includes(active.id) && selectedTileIds.length > 1) {
        // Multi-move logic for rack (simplified: move the whole block)
        const activeIds = selectedTileIds;
        const overIdx = hand.findIndex(t => t.id === over.id);
        const remainingTiles = hand.filter(t => !activeIds.includes(t.id));
        const movingTiles = hand.filter(t => activeIds.includes(t.id));
        
        const newHand = [...remainingTiles];
        // Insert moving tiles at overIdx position adjusted for removals
        // (Actually it's easier to find where over item is now)
        const insertAt = newHand.findIndex(t => t.id === over.id);
        if (insertAt !== -1) {
            newHand.splice(insertAt, 0, ...movingTiles);
            setHand(newHand);
        }
      } else {
        const activeIdx = hand.findIndex(t => t.id === active.id);
        const overIdx = hand.findIndex(t => t.id === over.id);
        
        if (activeIdx !== -1 && overIdx !== -1) {
            setHand((items) => arrayMove(items, activeIdx, overIdx));
        }
      }
    }
    
    // Clear selection if not melded
    if (over.id !== 'meld-area') {
        // We keep selection for a bit or clear it? User didn't specify. 
        // Clearing it on standard move is probably better.
        setSelectedTileIds([]);
    }
    
    setActiveId(null);
  };

  const deckIndexRef = React.useRef(deckIndex);
  const boardRef = React.useRef(board);
  
  useEffect(() => { deckIndexRef.current = deckIndex; }, [deckIndex]);
  useEffect(() => { boardRef.current = board; }, [board]);

  useEffect(() => {
    if (turn !== 0 && !winner) {
      setIsBotThinking(true);
      
      let pTimer: NodeJS.Timeout;
      let dTimer: NodeJS.Timeout;
      let eTimer: NodeJS.Timeout;

      // Bot Turn Sequence:
      // 1. Initial delay
      // 2. Pick up tile (from board or deck)
      // 3. Thinking delay (melding)
      // 4. Discard tile
      // 5. End turn delay

      pTimer = setTimeout(() => {
        // Step 1: Decision for Picking
        const currentBoard = boardRef.current;
        const currentDeckIndex = deckIndexRef.current;
        const shouldPickFromBoard = currentBoard.length > 0;
        
        let pickedTile: OkeyTile | null = null;

        if (shouldPickFromBoard) {
          pickedTile = currentBoard[currentBoard.length - 1];
          setBoard(prev => prev.slice(0, -1));
        } else {
          if (currentDeckIndex < deck.length - 1) {
            pickedTile = deck[currentDeckIndex];
            setDeckIndex(prev => prev + 1);
          }
        }

        if (pickedTile) {
          setAllHands(prevAll => {
            const nextAll = [...prevAll];
            nextAll[turn] = [...(nextAll[turn] || []), pickedTile!];
            return nextAll;
          });
        }

        // Step 2: Thinking/Melding/Discarding delay
        dTimer = setTimeout(() => {
          setAllHands(prevAll => {
            const nextAll = [...prevAll];
            let botHand = [...(nextAll[turn] || [])];
            
            // --- BOT MELDING LOGIC ---
            const newMelds: OkeyTile[][] = [];
            let tilesToMeldIds: string[] = [];
            
            const sortedHand = [...botHand].sort((a, b) => {
              if (a.color !== b.color) return a.color.localeCompare(b.color);
              return (a.number || 0) - (b.number || 0);
            });

            for (let i = 0; i < sortedHand.length - 2; i++) {
              const group = [sortedHand[i], sortedHand[i+1], sortedHand[i+2]];
              if (isValidMeld(group)) {
                newMelds.push(group);
                tilesToMeldIds.push(...group.map(t => t.id));
                i += 2;
              }
            }
            
            if (newMelds.length > 0) {
              botHand = botHand.filter(t => !tilesToMeldIds.includes(t.id));
              setAllMelds(prevMelds => {
                const nextMelds = [...prevMelds];
                nextMelds[turn] = [...(nextMelds[turn] || []), ...newMelds];
                return nextMelds;
              });
            }

            // Step 3: Discard - Only if we have at least one tile
            if (botHand.length > 0) {
              const discardIdx = Math.floor(Math.random() * botHand.length);
              const tileToDiscard = botHand[discardIdx];
              botHand.splice(discardIdx, 1);
              setBoard(prevBoard => [...prevBoard, tileToDiscard]);
            }
            
            nextAll[turn] = botHand;
            return nextAll;
          });
          
          // Step 4: End Turn delay
          eTimer = setTimeout(() => {
            setIsBotThinking(false);
            const nextTurn = (turn + 1) % 4;
            setTurn(nextTurn);
            if (nextTurn === 0) {
              setHasPickedUp(false);
              setRestrictedTileId(null);
            }
          }, 1200);
        }, 1800);

      }, 1500);

      return () => {
        clearTimeout(pTimer);
        clearTimeout(dTimer);
        clearTimeout(eTimer);
        setIsBotThinking(false);
      };
    }
  }, [turn, winner]);


  const row1 = hand.slice(0, Math.ceil(hand.length / 2));
  const row2 = hand.slice(Math.ceil(hand.length / 2));

  return (
    <div className="h-full w-full bg-[#0a0503] flex flex-col overflow-hidden relative font-sans">
      <DndContext 
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Table Surface */}
        <div className="absolute inset-0 bg-[#1a0f0a] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-40" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #fbbf24 0%, transparent 70%)' }} />
        </div>
        
        <header className="flex items-center justify-between p-4 md:p-6 shrink-0 relative z-30">
          <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="text-lg md:text-2xl font-black text-amber-500 italic tracking-tighter uppercase">Kurdish Okey</h2>
            <div className="text-[7px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Premium Edition</div>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center opacity-40">
             <Trophy size={16} />
          </div>
        </header>

        {/* 3D Game Table View */}
        <div className="flex-1 relative perspective-[1200px] z-10">
          <div className="absolute inset-0 flex flex-col items-center justify-center origin-bottom transform rotateX(25deg)">
            <div className="w-[120%] h-[150%] bg-[#0f1a14] rounded-[10rem] border-[20px] border-[#2a1b12] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              
              {/* Opponent Bots / Players Icons */}
              {[1, 2, 3].map((index) => {
                const player = players[index];
                const isActive = turn === index;
                const positionClasses = 
                  index === 1 ? "left-[2%] md:left-[10%] top-1/2 -translate-y-1/2" :
                  index === 2 ? "top-[4%] md:top-[5%] left-1/2 -translate-x-1/2" :
                  "right-[2%] md:right-[10%] top-1/2 -translate-y-1/2";

                return (
                  <div 
                    key={index}
                    className={`absolute ${positionClasses} flex flex-col items-center gap-1 md:gap-2 transition-transform duration-500 z-50 ${isActive ? 'scale-110 md:scale-125' : 'opacity-40 scale-90 md:scale-100'}`}
                  >
                    <div className={`w-11 h-11 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-zinc-900 shadow-2xl overflow-hidden ${isActive ? 'border-amber-500 shadow-amber-500/40 animate-pulse' : 'border-zinc-700'}`}>
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={window.innerWidth < 768 ? 18 : 32} className={isActive ? 'text-amber-500' : 'text-zinc-500'} />
                      )}
                    </div>
                    <span className="text-[9px] md:text-[14px] font-bold text-white bg-black/60 px-2 md:px-4 py-0.5 md:py-1 rounded-full uppercase tracking-widest">
                      {player.name}
                    </span>

                    {/* Opponent Melds Area */}
                    {allMelds[index].length > 0 && (
                      <div className="absolute -bottom-16 md:-bottom-24 flex flex-wrap gap-1 justify-center w-32 md:w-48 bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/5 shadow-2xl pointer-events-none">
                        {allMelds[index].map((meld, mIdx) => (
                           <div key={mIdx} className="flex gap-0.5 bg-white/5 p-0.5 rounded shadow-sm scale-75 md:scale-90 origin-top">
                              {meld.map(t => <TileComponent key={t.id} tile={t} size="xs" />)}
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <DroppableTable>
                <div className="flex flex-col items-center gap-8 w-full h-full justify-center p-20 relative">
                  {/* Central Game Area */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-12 items-end justify-center">
                       {/* Indicator (Gosterge) - Non-interactive reference */}
                       <div className="flex flex-col items-center gap-2">
                          <div className="opacity-40 grayscale-[0.2] scale-90 -rotate-2 select-none pointer-events-none">
                            {indicatorTile && <TileComponent tile={indicatorTile} size="sm" />}
                          </div>
                          <p className="text-[6px] font-black text-amber-500/20 uppercase tracking-[0.3em]">Indicator</p>
                       </div>

                       {/* Discard Pile (Stacked) - Moved to the central location */}
                       <div className="relative w-14 h-20 perspective-[500px]">
                          <AnimatePresence>
                            {board.map((tile, index) => {
                              const isTop = index === board.length - 1;
                              const canPickUpTop = isTop && turn === 0 && !hasPickedUp;

                              return (
                                <motion.div 
                                  key={tile.id} 
                                  initial={{ scale: 0.8, opacity: 0, y: -100 }}
                                  animate={{ 
                                    scale: 1, 
                                    opacity: 1, 
                                    y: -index * 2,
                                    x: (index % 3) * 0.5,
                                    rotateZ: (index % 5) - 2
                                  }}
                                  className="absolute inset-0"
                                  style={{ zIndex: index }}
                                >
                                  {isTop ? (
                                    <div className="relative">
                                      <DraggableBoardTile tile={tile} />
                                      {canPickUpTop && (
                                        <motion.div 
                                          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                          className="absolute -inset-1 border-2 border-amber-500 rounded-lg pointer-events-none z-10"
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <TileComponent tile={tile} size="md" />
                                  )}
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>

                          {board.length === 0 && (
                            <div className="absolute inset-0 border-2 border-dashed border-white/5 flex items-center justify-center rounded-lg">
                              <p className="text-[6px] font-black text-white/5 uppercase tracking-widest text-center">Discard<br/>Area</p>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                       {/* Draw control replaces the big deck tile */}
                       <div 
                          className={`group relative px-4 py-2 rounded-full bg-white/5 border border-white/10 transition-all ${turn === 0 && !hasPickedUp ? 'hover:bg-amber-500/10 hover:border-amber-500/50 cursor-active' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={handleDrawFromDeck}
                       >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Draw from Deck</span>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[10px] font-black text-white/40">{Math.max(0, deck.length - deckIndex - 1)}</span>
                          </div>
                           {turn === 0 && !hasPickedUp && (
                            <motion.div 
                              animate={{ scale: [1, 1.02, 1], opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 rounded-full border border-amber-500 pointer-events-none"
                            />
                          )}
                       </div>
                       
                       <div className="mt-1">
                         <span className="text-[8px] font-black uppercase tracking-widest text-white/20 text-center block">
                           {turn === 0 ? (
                             hasPickedUp ? (restrictedTileId ? 'Discard a different tile' : 'Discard a tile') : 'Your Turn'
                           ) : null}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              </DroppableTable>
            </div>
          </div>

    </div>

        {/* Wooden Rack */}
        <footer className="mt-auto relative z-30 pt-10">
          <div className="max-w-screen-xl mx-auto px-4 md:px-10">
            <div className="relative pb-10">
              <div className="bg-gradient-to-b from-[#4a3225] to-[#2a1b12] rounded-t-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.6)] border-t border-white/10 overflow-hidden pt-4 pb-12 px-2 md:px-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-30 pointer-events-none" />
                
                <SortableContext items={hand.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex flex-col gap-6 relative z-10 max-w-4xl mx-auto">
                    {/* Top Row */}
                    <RackRow id="rack-row-1">
                      <div className="flex gap-1 md:gap-3 px-2 py-4 overflow-x-auto scrollbar-hide">
                         {row1.map((tile) => (
                           <SortableTile 
                            key={tile.id} 
                            id={tile.id} 
                            tile={tile} 
                            isOnRack={true} 
                            size={window.innerWidth < 768 ? 'sm' : 'md'} 
                            isSelected={selectedTileIds.includes(tile.id) && selectedTileIds.length >= 3 && isValidMeld(hand.filter(t => selectedTileIds.includes(t.id)))}
                            onLongPress={handleLongPress}
                            onClick={handleTileClick}
                           />
                         ))}
                      </div>
                    </RackRow>

                    {/* Bottom Row */}
                    <RackRow id="rack-row-2">
                       <div className="flex gap-1 md:gap-3 px-2 py-4 overflow-x-auto scrollbar-hide">
                          {row2.map((tile) => (
                            <SortableTile 
                              key={tile.id} 
                              id={tile.id} 
                              tile={tile} 
                              isOnRack={true} 
                              size={window.innerWidth < 768 ? 'sm' : 'md'} 
                              isSelected={selectedTileIds.includes(tile.id) && selectedTileIds.length >= 3 && isValidMeld(hand.filter(t => selectedTileIds.includes(t.id)))}
                              onLongPress={handleLongPress}
                              onClick={handleTileClick}
                            />
                          ))}
                       </div>
                    </RackRow>
                  </div>
                </SortableContext>
              </div>
            </div>
          </div>
        </footer>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="flex gap-0">
              {(selectedTileIds.includes(activeId) ? selectedTileIds : [activeId]).map(id => {
                const tile = [...hand, ...board].find(t => t.id === id);
                if (!tile) return null;
                return (
                  <div key={`overlay-${id}`} className="shadow-2xl">
                    <TileComponent 
                      tile={tile} 
                      isOnRack={true} 
                      size={window.innerWidth < 768 ? 'sm' : 'md'} 
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </DragOverlay>

        {/* Meld Area - Fixed Layer */}
        <MeldArea 
          isVisible={finishedMelds.length > 0 || (selectedTileIds.length >= 3 && isValidMeld(hand.filter(t => selectedTileIds.includes(t.id))))}
          isHolding={activeId !== null && selectedTileIds.includes(activeId) && isValidMeld(hand.filter(t => selectedTileIds.includes(t.id)))}
        >
          {finishedMelds.map((meld, mIdx) => (
            <motion.div 
              key={mIdx} 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex border border-amber-500/20 bg-amber-500/10 p-1.5 rounded-xl gap-1 shadow-lg ring-1 ring-white/5"
            >
              {meld.map((tile) => (
                <TileComponent key={tile.id} tile={tile} size="xs" />
              ))}
            </motion.div>
          ))}
        </MeldArea>
      </DndContext>

      {/* Win View */}
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
             <motion.div initial={{ scale: 0.8, y: 100 }} animate={{ scale: 1, y: 0 }} className="text-center">
                <Trophy className="w-32 h-32 text-amber-500 mx-auto mb-8" />
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 italic tracking-tighter uppercase">Hand Submitted!</h2>
                <div className="flex gap-4 justify-center">
                   <button onClick={() => setWinner(false)} className="px-8 py-4 bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest">Continue</button>
                   <button onClick={onBack} className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">Exit Game</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
