import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Bot, PlusCircle, ChevronRight, X } from 'lucide-react';
import { translations } from '../translations';
import { useAppContext } from '../context/AppContext';

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  onSelectMode: (mode: 'online' | 'bot' | 'create', config: any) => void;
}

export const GameModeModal: React.FC<GameModeModalProps> = ({ isOpen, onClose, gameId, onSelectMode }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [step, setStep] = useState<'main' | 'difficulty' | 'players' | 'bot_players'>('main');
  const [selectedBotPlayers, setSelectedBotPlayers] = useState<number>(2);

  const reset = () => {
    setStep('main');
    setSelectedBotPlayers(2);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-slate-900/50 border border-white/10 rounded-[3rem] p-10 overflow-hidden relative"
          >
            <button onClick={reset} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5"><X size={24} /></button>

            {step === 'main' && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gold mb-8 text-center">{t[gameId as keyof typeof t]} Mode</h2>
                
                <button 
                  onClick={() => onSelectMode('online', {})}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-gold/10 hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400"><Users size={32} /></div>
                    <div className="text-left">
                      <p className="text-xl font-bold">{t.play_online}</p>
                      <p className="text-xs text-white/40">Real players match system</p>
                    </div>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-all text-gold" />
                </button>

                <button 
                  onClick={() => setStep('bot_players')}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400"><Bot size={32} /></div>
                    <div className="text-left">
                      <p className="text-xl font-bold">{t.play_with_bot}</p>
                      <p className="text-xs text-white/40">Practice with smart AI</p>
                    </div>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-all text-gold" />
                </button>

                <button 
                  onClick={() => setStep('players')}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:bg-gold/10 hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center text-gold"><PlusCircle size={32} /></div>
                    <div className="text-left">
                      <p className="text-xl font-bold">{t.create_room}</p>
                      <p className="text-xs text-white/40">Invite friends with code</p>
                    </div>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-all text-gold" />
                </button>
              </div>
            )}

            {step === 'bot_players' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gold mb-8">{t.number_of_bots}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <button 
                      key={n}
                      onClick={() => {
                        setSelectedBotPlayers(n + 1);
                        setStep('difficulty');
                      }}
                      className="p-8 bg-white/5 border border-white/10 rounded-2xl font-bold text-3xl hover:bg-gold hover:text-black transition-all"
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-white/40 text-sm italic">
                  {language === 'en' ? (
                    <>
                      {selectedBotPlayers === 2 && "1 Player vs 1 Bot"}
                      {selectedBotPlayers === 3 && "1 Player vs 2 Bots"}
                      {selectedBotPlayers === 4 && "1 Player vs 3 Bots"}
                    </>
                  ) : (
                    <>
                      {selectedBotPlayers === 2 && "١ یاریزان vs ١ بۆت"}
                      {selectedBotPlayers === 3 && "١ یاریزان vs ٢ بۆت"}
                      {selectedBotPlayers === 4 && "١ یاریزان vs ٣ بۆت"}
                    </>
                  )}
                </p>
              </div>
            )}

            {step === 'difficulty' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gold mb-8">{t.difficulty}</h2>
                <div className="space-y-4">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button 
                      key={d}
                      onClick={() => onSelectMode('bot', { difficulty: d, players: selectedBotPlayers })}
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      {t[d as keyof typeof t]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'players' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gold mb-8">{t.number_of_players}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[2, 3, 4].map((n) => (
                    <button 
                      key={n}
                      onClick={() => onSelectMode('create', { maxPlayers: n })}
                      className="p-8 bg-white/5 border border-white/10 rounded-2xl font-bold text-3xl hover:bg-gold hover:text-black transition-all"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
