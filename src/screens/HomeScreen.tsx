import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Trophy, Star, ChevronRight, MessageCircle, Camera, Users, X, Check, Mail, Bell, Shield, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useSocial } from '../context/SocialContext';
import { SocialService } from '../lib/SocialService';
import { translations } from '../translations';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { GameModeModal } from '../components/GameModeModal';
import { SettingsModal } from '../components/SettingsModal';
import { FriendsModal } from '../components/FriendsModal';
import { UpdatesModal } from '../components/UpdatesModal';
import { AdminPanelModal } from '../components/AdminPanelModal';

const GAMES = [
  { id: 'billiards', name: 'Billiards', color: 'from-green-600 to-green-900', img: undefined },
  { id: 'snake_ladder', name: 'Snake & Ladder', color: 'from-orange-500 to-red-700', img: undefined },
  { id: 'domino', name: 'Domino', color: 'from-slate-600 to-slate-900', img: undefined },
  { id: 'kurdish_okey', name: 'Kurdish Okey', color: 'from-yellow-600 to-amber-900', img: undefined },
  { id: 'uno', name: 'UNO', color: 'from-red-600 to-blue-800', img: undefined },
];

const AVATAR_IDS: string[] = [];

const getAvatarUrl = (idOrIndex: string) => {
  return undefined;
};

const getRequiredLevel = (index: number) => {
  if (index < 5) return 1;
  return (index - 4) * 5; // Level 5, 10, 15... up to 100
};

export const HomeScreen: React.FC<{ onSelectGame: (id: string, mode?: any) => void }> = ({ onSelectGame }) => {
  const { profile, language, setLanguage, activeBans } = useAppContext();
  const { pendingRequests, incomingInvites } = useSocial();
  const t = translations[language];
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedGameForModal, setSelectedGameForModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [acknowledgedBans, setAcknowledgedBans] = useState<string[]>([]);

  const handleGameClick = (id: string) => {
    const appBan = activeBans.find(b => b.type === 'app');
    const gameBan = activeBans.find(b => b.type === 'game' && b.gameId === id);
    
    if (appBan || gameBan) {
      setToast(`Forbidden: You are currently banned from ${appBan ? 'the application' : 'this game'}.`);
      return;
    }

    if (id === 'billiards' && !isAdmin) { // For demo purposes, limiting billiards or similar
      // ... existing logic
    }
    setSelectedGameForModal(id);
  };

  const handleModeSelect = (mode: any, config: any) => {
    if (selectedGameForModal) {
      onSelectGame(selectedGameForModal, { mode, ...config });
      setSelectedGameForModal(null);
    }
  };

  const handleUpdateAvatar = async (id: string) => {
    if (!profile) return;
    const index = parseInt(id) - 1;
    const requiredLevel = getRequiredLevel(index);
    const isUnlocked = profile.unlockedAvatars?.includes(id) || profile.level >= requiredLevel;
    
    if (!isUnlocked) return;
    
    try {
      const profileRef = doc(db, 'users', profile.uid);
      await updateDoc(profileRef, { photoUrl: getAvatarUrl(id) });
    } catch (err) {
      console.error('Failed to update avatar', err);
    }
  };

const socialNotificationCount = pendingRequests.length;
  const isAdmin = profile?.email === 'hfg98849@gmail.com';
  const visibleBans = activeBans.filter(b => !acknowledgedBans.includes(b.id));

  return (
    <div className="h-screen w-screen overflow-y-auto scrollbar-hide p-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfile(true)}
            className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gold shadow-lg cursor-pointer"
          >
            {profile?.photoUrl && (
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            )}
          </motion.div>
          <div className="cursor-pointer" onClick={() => setShowProfile(true)}>
            <h2 className="text-xl font-bold">{profile?.displayName}</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-gold"><Trophy size={12} /> {profile?.wins} Wins</span>
              <span className="flex items-center gap-1 text-blue-400"><Star size={12} /> Lvl {profile?.level}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSocial(true)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all relative"
          >
            <Users size={20} />
            {socialNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold">{socialNotificationCount}</span>
            )}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setShowUpdates(true)}
            className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center hover:bg-gold/20 transition-all text-gold"
          >
            <Bell size={20} />
          </button>
        </div>
      </header>
      
      {/* Ban Notifications */}
      <AnimatePresence>
        {visibleBans.length > 0 && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            {visibleBans.slice(0, 1).map(ban => (
              <motion.div
                key={ban.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Access Restricted</h2>
                <p className="text-white/60 mb-8 leading-relaxed">
                  Player <span className="text-white font-bold">{profile?.displayName}</span> has been banned due to violation of game rules after investigation. 
                  <br /><br />
                  <span className="text-red-400 font-bold">Ban duration: {ban.duration}</span>
                  <br />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/20 mt-2 block">Reason: {ban.reason}</span>
                </p>
                <button 
                  onClick={() => setAcknowledgedBans([...acknowledgedBans, ban.id])}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-900/20"
                >
                  Understood
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Incoming Invites Overlay */}
      <AnimatePresence>
        {incomingInvites.length > 0 && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm px-6">
            {incomingInvites.map(invite => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-gold/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gold uppercase tracking-widest">{t.incoming_invite}</p>
                    <p className="text-sm font-semibold"><span className="text-gold">{invite.fromName}</span> {t.wants_to_play} {t[invite.gameType as keyof typeof t]}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      SocialService.respondToInvite(invite.id, 'accepted');
                      onSelectGame(invite.gameType, { mode: 'join', code: invite.roomId });
                    }}
                    className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => SocialService.respondToInvite(invite.id, 'rejected')}
                    className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Hero Title */}
      <div className="mb-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <motion.div
          initial={{ rotate: -5, scale: 0.9 }}
          whileHover={{ rotate: 0, scale: 1 }}
          className="shrink-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop" 
            alt="Game Center Logo" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] shadow-2xl border-2 border-gold/20"
          />
        </motion.div>
        <div>
          <p className="text-gold/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">{t.games}</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t.welcome}</h1>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {GAMES.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleGameClick(game.id)}
            className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer isometric-card border border-white/10 shadow-2xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-t ${game.color} opacity-80 z-10`} />
            {game.img && (
              <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            )}
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
              <h3 className="text-3xl font-bold mb-2">{t[game.id as keyof typeof t]}</h3>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                {t.play_online} <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Social & Support */}
      <div className="border-t border-white/10 pt-8 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">{t.social_support}</h3>
        <div className="flex flex-wrap gap-4">
          <a 
            href="https://www.snapchat.com/add/xx.eloni2024?share_id=WV4633htRac&locale=en-GB" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/10 transition-all"
          >
            <MessageCircle size={18} className="text-yellow-400" />
            <span className="font-semibold text-sm">Snapchat</span>
          </a>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-y-auto max-h-[90vh] relative shadow-2xl scrollbar-hide"
            >
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all z-10"
              >
                ×
              </button>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gold mb-6 md:mb-8">{t.profile}</h2>
              
              <div className="space-y-6 md:space-y-8">
                <div className="p-4 md:p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-2 border-gold shadow-2xl mb-4 flex items-center justify-center bg-white/5 relative group">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-white/20" />
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                      <Camera size={24} className="text-gold mb-1" />
                      <span className="text-[8px] font-bold uppercase">{t.change_photo || 'Change'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && profile) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64String = reader.result as string;
                              try {
                                const profileRef = doc(db, 'users', profile.uid);
                                await updateDoc(profileRef, { photoUrl: base64String });
                              } catch (err) {
                                console.error("Error uploading photo:", err);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <h3 className="text-2xl font-bold">{profile?.displayName}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mt-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase mb-1 font-bold">{t.total_wins}</p>
                      <p className="text-xl font-bold text-gold">{profile?.wins}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase mb-1 font-bold">{t.level}</p>
                      <p className="text-xl font-bold text-blue-400">{profile?.level}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] md:text-xs text-white/40 uppercase font-bold tracking-widest ml-1">Avatars ({AVATAR_IDS.length})</p>
                  <div className="grid grid-cols-5 gap-3">
                    {AVATAR_IDS.map((_, i) => {
                      const id = (i + 1).toString();
                      const requiredLevel = getRequiredLevel(i);
                      const isUnlocked = profile?.unlockedAvatars?.includes(id) || (profile?.level || 1) >= requiredLevel;
                      const isPremium = i >= 5;
                      const isCurrent = profile?.photoUrl === getAvatarUrl(id);
                      
                      return (
                        <motion.div 
                          key={id}
                          whileHover={isUnlocked ? { scale: 1.05 } : {}}
                          whileTap={isUnlocked ? { scale: 0.95 } : {}}
                          onClick={() => handleUpdateAvatar(id)}
                          className={`aspect-square rounded-xl border-2 overflow-hidden transition-all relative ${isUnlocked ? (isPremium ? 'border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'border-gold') : 'border-white/5 opacity-40 grayscale'} ${isCurrent ? 'ring-2 ring-gold ring-offset-2 ring-offset-slate-900 border-none scale-95' : ''} cursor-pointer flex items-center justify-center bg-white/5`}
                        >
                           {getAvatarUrl(id) ? (
                             <img src={getAvatarUrl(id)} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                             <User size={16} className="text-white/10" />
                           )}
                           {!isUnlocked && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-1">
                                <Trophy size={10} className="text-white/40" />
                                <span className="text-[7px] font-black tracking-tighter uppercase">Lvl {requiredLevel}</span>
                             </div>
                           )}
                           {isPremium && isUnlocked && (
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/80 to-transparent py-0.5 flex justify-center">
                               <span className="text-[6px] font-black text-white uppercase tracking-tighter">{t.premium}</span>
                             </div>
                           )}
                           {isCurrent && (
                             <div className="absolute top-0 right-0 p-1 bg-gold text-black rounded-bl-lg">
                               <Star size={8} fill="currentColor" />
                             </div>
                           )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameModeModal 
        isOpen={selectedGameForModal !== null} 
        onClose={() => setSelectedGameForModal(null)} 
        gameId={selectedGameForModal || ''} 
        onSelectMode={handleModeSelect}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-600/90 backdrop-blur-md text-white font-bold rounded-2xl shadow-2xl border border-white/20 whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <FriendsModal 
        isOpen={showSocial} 
        onClose={() => setShowSocial(false)} 
      />

      <UpdatesModal 
        isOpen={showUpdates} 
        onClose={() => setShowUpdates(false)} 
      />

      <AdminPanelModal 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)} 
      />
    </div>
  );
};
