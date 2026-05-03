import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Users, RefreshCw, Octagon, Ban, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'x2' | 'wild' | 'x4';

interface UnoCard {
  color: CardColor;
  value: CardValue;
  id: string;
  activeColor?: CardColor; // For wild cards
}

interface UnoPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  hand: UnoCard[];
  isBot: boolean;
  color: string;
}

export const UnoGame: React.FC<{ onBack: () => void, mode: any, players?: any[] }> = ({ onBack, mode, players: propPlayers }) => {
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [players, setPlayers] = useState<UnoPlayer[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [winner, setWinner] = useState<UnoPlayer | null>(null);
  const [userHasDrawn, setUserHasDrawn] = useState(false);
  const [drawStack, setDrawStack] = useState(0);
  const [numberOnlyRequired, setNumberOnlyRequired] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<UnoCard | null>(null);

  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'x2'];

  useEffect(() => {
    const newDeck: UnoCard[] = [];
    
    // Colored cards
    colors.forEach(color => {
      // One 0 per color
      newDeck.push({ color, value: '0', id: `initial-${color}-0-${Math.random()}` });
      
      // Two of each 1-9, skip, reverse, x2
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'x2'].forEach((val) => {
        newDeck.push({ color, value: val as CardValue, id: `initial-${color}-${val}-1-${Math.random()}` });
        newDeck.push({ color, value: val as CardValue, id: `initial-${color}-${val}-2-${Math.random()}` });
      });
    });

    // Wild cards
    for (let i = 0; i < 4; i++) {
      newDeck.push({ color: 'black', value: 'wild', id: `wild-${i}-${Math.random()}` });
      newDeck.push({ color: 'black', value: 'x4', id: `x4-${i}-${Math.random()}` });
    }
    
    const shuffled = [...newDeck].sort(() => Math.random() - 0.5);
    
    let initialPlayers: UnoPlayer[] = [];
    let playersCount = 2;

    if (mode?.mode === 'bot') {
      playersCount = mode.players || 2;
      initialPlayers.push({ id: '1', name: 'You', hand: [], isBot: false, color: '#FFD700' });
      const botColors = ['#3b82f6', '#22c55e', '#e879f9'];
      for (let i = 1; i < playersCount; i++) {
        initialPlayers.push({ id: String(i + 1), name: `Bot ${i}`, hand: [], isBot: true, color: botColors[i - 1] });
      }
    } else if (propPlayers && propPlayers.length > 0) {
      playersCount = propPlayers.length;
      initialPlayers = propPlayers.map((p, i) => ({
        id: p.uid || String(i),
        name: p.name,
        avatar: p.photo,
        hand: [],
        isBot: false,
        color: i === 0 ? '#FFD700' : i === 1 ? '#3b82f6' : i === 2 ? '#22c55e' : '#e879f9'
      }));
    } else {
      // Default
      initialPlayers = [
        { id: '1', name: 'You', hand: [], isBot: false, color: '#FFD700' },
        { id: '2', name: 'Bot 1', hand: [], isBot: true, color: '#3b82f6' }
      ];
    }

    // Deal cards
    initialPlayers.forEach((p, i) => {
      p.hand = shuffled.slice(i * 7, (i + 1) * 7);
    });

    // Ensure the first card is not a special wild card for simplicity
    let firstDiscardIdx = playersCount * 7;
    while (shuffled[firstDiscardIdx].color === 'black') {
      firstDiscardIdx++;
    }

    setPlayers(initialPlayers);
    setDiscardPile([shuffled[firstDiscardIdx]]);
    
    const remainingDeck = [...shuffled];
    remainingDeck.splice(firstDiscardIdx, 1);
    setDeck(remainingDeck.slice(playersCount * 7));
  }, [mode, propPlayers]);

  const topCard = discardPile[discardPile.length - 1];

  const canPlay = (card: UnoCard) => {
    if (!topCard) return false;
    
    // If a wild/x4 was just played, next player must play a NUMBER card of chosen color
    if (numberOnlyRequired) {
      const isNumber = /^[0-9]$/.test(card.value);
      const currentMatchingColor = topCard.activeColor || topCard.color;
      return card.color === currentMatchingColor && isNumber;
    }

    // Wild cards can always be played unless we are responding to an x2 stack (some house rules allow wild4 stacking but let's keep it simple)
    if (card.color === 'black') {
       if (drawStack > 0) {
          return card.value === 'x4';
       }
       return true;
    }

    if (drawStack > 0) {
       // Only stack same or higher draw cards
       if (topCard.value === 'x2') return card.value === 'x2';
       if (topCard.value === 'x4') return card.value === 'x4';
       return false;
    }

    const currentMatchingColor = topCard.activeColor || topCard.color;
    return card.color === currentMatchingColor || card.value === topCard.value;
  };

  const selectWildColor = (color: CardColor) => {
    if (!showColorPicker) return;
    
    const card = { ...showColorPicker, activeColor: color };
    setShowColorPicker(null);
    executePlayCard(card);
  };

  const playCard = (card: UnoCard, cardIndex: number) => {
    const currentPlayer = players[currentPlayerIdx];
    if (!currentPlayer || currentPlayer.isBot || !canPlay(card) || winner || showColorPicker) return;

    if (card.color === 'black') {
      setShowColorPicker(card);
      // We will finish the play after color selection
      const newPlayers = [...players];
      newPlayers[currentPlayerIdx].hand.splice(cardIndex, 1);
      setPlayers(newPlayers);
      return;
    }

    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIdx];
    player.hand.splice(cardIndex, 1);
    setPlayers(newPlayers);
    executePlayCard(card);
  };

  const executePlayCard = (card: UnoCard) => {
    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIdx];
    
    let nextIdx = (currentPlayerIdx + 1) % players.length;

    if (card.value === 'skip') {
      nextIdx = (nextIdx + 1) % players.length;
    } else if (card.value === 'reverse') {
       // In 2 player games, reverse acts as skip
       if (players.length === 2) {
          nextIdx = (nextIdx + 1) % players.length;
       } else {
          // Reverse order logic would go here if we had order state
          // For now let's just make it skip for 2 players or skip next
          nextIdx = (nextIdx + 1) % players.length;
       }
    } else if (card.value === 'x2') {
      setDrawStack(prev => prev + 2);
    } else if (card.value === 'x4') {
      setNumberOnlyRequired(true);
      setDrawStack(0);
    } else if (card.value === 'wild') {
      setNumberOnlyRequired(true);
      setDrawStack(0);
    }

    setPlayers(newPlayers);
    setDiscardPile([...discardPile, card]);
    setUserHasDrawn(false);
    // If it wasn't a wild/x4 (or if we just selected the color and calling this), reset restriction if a number was played
    if (numberOnlyRequired) {
      setNumberOnlyRequired(false);
    }

    if (player.hand.length === 0) {
      setWinner(player);
      confetti();
    } else {
      setCurrentPlayerIdx(nextIdx);
    }
  };

  const drawCard = () => {
    const currentPlayer = players[currentPlayerIdx];
    if (!currentPlayer || currentPlayer.isBot || winner || userHasDrawn) return;
    if (deck.length === 0) return;
    
    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIdx];

    if (numberOnlyRequired) {
      if (topCard.value === 'x4') {
        const penalty = 6;
        const drawn = deck.slice(0, penalty);
        player.hand.push(...drawn);
        setDeck(deck.slice(penalty));
        setNumberOnlyRequired(false);
        setPlayers(newPlayers);
        setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
        setUserHasDrawn(false);
        return;
      } else {
        // Wild penalty - draw 1 and see
        const drawnCard = deck[0];
        player.hand.push(drawnCard);
        setDeck(deck.slice(1));
        setPlayers(newPlayers);
        
        if (canPlay(drawnCard)) {
          // They can play it! Wait for them to play or allow them to play.
          // For consistency with current draw mechanics, we'll let them play it or wait.
          // But user said "if still not possible, the turn moves".
          setUserHasDrawn(true);
        } else {
          // Still not possible
          setTimeout(() => {
            setNumberOnlyRequired(false);
            setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
            setUserHasDrawn(false);
          }, 1000);
        }
        return;
      }
    }

    if (drawStack > 0) {
      const drawn = deck.slice(0, drawStack);
      player.hand.push(...drawn);
      setDeck(deck.slice(drawStack));
      setDrawStack(0);
      setPlayers(newPlayers);
      setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
      setUserHasDrawn(false);
      return;
    }
    
    // Lock drawing for this turn
    setUserHasDrawn(true);

    const drawnCard = deck[0];
    player.hand.push(drawnCard);
    
    setPlayers(newPlayers);
    setDeck(deck.slice(1));

    // If the drawn card cannot be played, automatically move to next player
    if (!canPlay(drawnCard)) {
      setTimeout(() => {
        setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
        // Reset draw lock for the next time it's our turn
        setUserHasDrawn(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const currentPlayer = players[currentPlayerIdx];
    if (!currentPlayer || !currentPlayer.isBot || winner) return;

    const timer = setTimeout(() => {
      const playableIdx = currentPlayer.hand.findIndex(c => canPlay(c));
      const newPlayers = [...players];
      const bot = newPlayers[currentPlayerIdx];

      if (playableIdx !== -1) {
        const card = bot.hand[playableIdx];
        bot.hand.splice(playableIdx, 1);
        
        let cardToPlay = { ...card };
        if (card.color === 'black') {
          const colorCounts = bot.hand.reduce((acc, c) => {
            if (c.color !== 'black') acc[c.color] = (acc[c.color] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const bestColor = Object.entries(colorCounts).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'red';
          cardToPlay.activeColor = bestColor as CardColor;
        }

        let nextIdx = (currentPlayerIdx + 1) % players.length;

        if (cardToPlay.value === 'skip') {
          nextIdx = (nextIdx + 1) % players.length;
        } else if (cardToPlay.value === 'reverse') {
           nextIdx = (nextIdx + 1) % players.length;
        } else if (cardToPlay.value === 'x2') {
          setDrawStack(prev => prev + 2);
        } else if (cardToPlay.value === 'x4') {
          setNumberOnlyRequired(true);
          setDrawStack(0);
        } else if (cardToPlay.value === 'wild') {
          setNumberOnlyRequired(true);
          setDrawStack(0);
        }

        setPlayers(newPlayers);
        setDiscardPile([...discardPile, cardToPlay]);
        if (bot.hand.length === 0) setWinner(bot);
        if (numberOnlyRequired) setNumberOnlyRequired(false);
        setCurrentPlayerIdx(nextIdx);
      } else {
        // Draw
        if (numberOnlyRequired) {
          if (topCard.value === 'x4') {
            const penalty = 6;
            const drawn = deck.slice(0, penalty);
            bot.hand.push(...drawn);
            setDeck(deck.slice(penalty));
            setNumberOnlyRequired(false);
            setPlayers(newPlayers);
            setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
            return;
          } else {
            // Wild penalty - draw 1
            const drawnCard = deck[0];
            bot.hand.push(drawnCard);
            setDeck(deck.slice(1));
            
            // Check if bot can play the drawn card (must be a number card of chosen color)
            if (canPlay(drawnCard)) {
              bot.hand.splice(bot.hand.length - 1, 1);
              setDiscardPile([...discardPile, drawnCard]);
              setNumberOnlyRequired(false);
              if (bot.hand.length === 0) setWinner(bot);
            } else {
              setNumberOnlyRequired(false);
            }
            
            setPlayers(newPlayers);
            setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
            return;
          }
        }

        if (drawStack > 0) {
          const drawn = deck.slice(0, drawStack);
          bot.hand.push(...drawn);
          setDeck(deck.slice(drawStack));
          setDrawStack(0);
          setPlayers(newPlayers);
          setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
          return;
        }

        if (deck.length > 0) {
          const drawnCard = deck[0];
          bot.hand.push(drawnCard);
          setDeck(deck.slice(1));
          
          // Check if drawn card is playable
          if (canPlay(drawnCard)) {
            const lastIdx = bot.hand.length - 1;
            bot.hand.splice(lastIdx, 1);
            setDiscardPile([...discardPile, drawnCard]);
            if (bot.hand.length === 0) setWinner(bot);
          }
          
          setPlayers(newPlayers);
        }
        setCurrentPlayerIdx((currentPlayerIdx + 1) % players.length);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentPlayerIdx, discardPile, players, winner, deck]);

  const getColorClass = (color: CardColor) => {
    switch (color) {
      case 'red': return 'bg-red-600';
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-green-600';
      case 'yellow': return 'bg-yellow-400 text-black';
      case 'black': return 'bg-zinc-900';
    }
  };

  const renderCardValue = (value: CardValue, size: 'sm' | 'md') => {
    switch (value) {
      case 'reverse':
        return (
          <RefreshCw className={size === 'sm' ? "w-8 h-8 md:w-12 md:h-12 stroke-[3]" : "w-10 h-10 md:w-16 md:h-16 stroke-[4]"} />
        );
      case 'skip':
        return (
          <Ban className={size === 'sm' ? "w-8 h-8 md:w-12 md:h-12 stroke-[3]" : "w-10 h-10 md:w-16 md:h-16 stroke-[4]"} />
        );
      case 'wild':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-white flex flex-wrap overflow-hidden rotate-45">
            <div className="w-1/2 h-1/2 bg-red-600" />
            <div className="w-1/2 h-1/2 bg-blue-600" />
            <div className="w-1/2 h-1/2 bg-green-600" />
            <div className="w-1/2 h-1/2 bg-yellow-400" />
          </div>
        );
      case 'x2':
        return <div className="flex items-center tracking-tighter">x2</div>;
      case 'x4':
        return <div className="flex items-center tracking-tighter">x4</div>;
      default:
        return value;
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col p-4 md:p-6 overflow-hidden">
      <header className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
        <button onClick={onBack} className="p-2 md:p-3 bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
        <h2 className="text-xl md:text-3xl font-bold tracking-tighter text-gold">UNOOO</h2>
        <div className="bg-white/10 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest">
           {players[currentPlayerIdx]?.isBot ? players[currentPlayerIdx].name : 'Your Turn'}
        </div>
      </header>

      {/* Opponents Info */}
      <div className="flex justify-center gap-4 md:gap-8 mb-4 shrink-0">
         {players.map((player, idx) => {
           if (idx === currentPlayerIdx && !player.isBot && player.id === '1') return null; // Skip self if it's our turn hand area? No, let's just show everyone else.
           if (player.id === '1' && !player.isBot) return null; // Player is at the bottom

           return (
             <div key={player.id} className={`flex flex-col items-center gap-2 transition-all ${players[currentPlayerIdx]?.id === player.id ? 'scale-110' : 'opacity-40'}`}>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl border-2 flex items-center justify-center relative overflow-hidden bg-zinc-900" style={{ borderColor: player.color }}>
                   <div className="text-[10px] font-black absolute inset-0 flex items-center justify-center bg-black/40 text-white z-10">
                      {player.hand.length}
                   </div>
                   {player.avatar ? (
                     <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                   ) : (
                     <Users size={20} className="text-white/20" />
                   )}
                </div>
                <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">{player.name}</p>
             </div>
           );
         })}
      </div>

      {/* Board */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-12 min-h-0">
         <div className="flex gap-4 md:gap-8 items-center">
            {/* Deck */}
            <div className="flex flex-col items-center gap-2">
              {drawStack > 0 && (
                <div className="bg-red-600 text-white text-[10px] md:text-sm font-black px-3 py-1 rounded-full animate-bounce shadow-lg ring-4 ring-white/20">
                  +{drawStack} CARDS
                </div>
              )}
              <button 
                onClick={drawCard}
                disabled={players[currentPlayerIdx]?.isBot || userHasDrawn}
                className={`w-16 h-24 md:w-24 md:h-36 bg-black border-2 md:border-4 border-white/20 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden active:scale-95 transition-all shadow-2xl relative group shrink-0 ${userHasDrawn ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="bg-red-600 w-full h-full flex items-center justify-center font-black text-xl md:text-4xl transform rotate-12">UNO</div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10" />
              </button>
            </div>

            {/* Top Card */}
            {topCard && (
               <div className="relative">
                  <motion.div 
                     key={topCard.id}
                     initial={{ scale: 0.5, y: -100, rotate: -20 }}
                     animate={{ scale: 1, y: 0, rotate: 0 }}
                     className={`w-16 h-24 md:w-24 md:h-36 ${getColorClass(topCard.color)} border-2 md:border-4 border-white rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] shrink-0`}
                  >
                     {renderCardValue(topCard.value, 'md')}
                  </motion.div>
                  {topCard.color === 'black' && topCard.activeColor && (
                     <div className={`absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-lg ${getColorClass(topCard.activeColor)}`} />
                  )}
               </div>
            )}
         </div>
      </div>

      {/* Player Hand */}
      <div className="p-4 md:p-8 bg-black/40 backdrop-blur-md rounded-[2rem] md:rounded-[3rem] border border-white/10 shrink-0 max-h-[35%] overflow-y-auto mt-4">
         <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {players.find(p => !p.isBot)?.hand.map((card, i) => (
               <motion.div
                 key={card.id || i}
                 whileHover={{ y: -20, scale: 1.05, zIndex: 10 }}
                 onClick={() => playCard(card, i)}
                 className={`w-14 h-20 md:w-20 md:h-32 ${getColorClass(card.color)} border-2 md:border-3 border-white rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl font-black cursor-pointer shadow-xl shrink-0 relative ${!canPlay(card) && !players[currentPlayerIdx]?.isBot ? 'opacity-40 grayscale-[0.5]' : ''}`}
               >
                 {renderCardValue(card.value, 'sm')}
               </motion.div>
            ))}
         </div>
      </div>

      <AnimatePresence>
        {showColorPicker && (
           <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
           >
              <div className="bg-slate-800 p-6 md:p-10 rounded-[2.5rem] border border-white/10 text-center max-w-sm w-full shadow-2xl">
                 <h3 className="text-xl md:text-2xl font-black mb-8 uppercase tracking-widest italic">Choose a Color</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {colors.map(color => (
                       <button
                          key={color}
                          onClick={() => selectWildColor(color)}
                          className={`aspect-square rounded-2xl border-4 border-white/20 hover:border-white transition-all transform hover:scale-105 active:scale-95 ${getColorClass(color)} shadow-xl`}
                       />
                    ))}
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
             <div className="text-center">
                <Trophy className="w-24 h-24 md:w-32 md:h-32 text-gold mx-auto mb-8 animate-bounce" />
                <h2 className="text-3xl md:text-5xl font-bold mb-8 uppercase tracking-tighter">{winner.isBot ? `${winner.name} WINS!` : 'YOU WIN!'}</h2>
                <button onClick={onBack} className="bg-gold text-black px-12 py-4 md:px-16 md:py-5 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Back to Menu</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
