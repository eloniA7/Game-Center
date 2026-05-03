import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Zap, BarChart3, Plus, Settings, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SocialService } from '../lib/SocialService';
import { translations } from '../translations';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [updates, setUpdates] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminTab, setShowAdminTab] = useState(false);

  // Admin states
  const [newUpdate, setNewUpdate] = useState({ version: '', title: '', description: '', features: '' });
  const [pollSettings, setPollSettings] = useState({ question: '', yesLabel: '', noLabel: '', isActive: true });

  useEffect(() => {
    if (!isOpen) return;

    // Check admin
    if (auth.currentUser?.email === 'hfg98849@gmail.com') {
      setIsAdmin(true);
    }

    // Subscribe to updates
    const updatesPath = 'updates';
    const updatesQuery = query(collection(db, updatesPath), orderBy('timestamp', 'desc'), limit(10));
    const unsubUpdates = onSnapshot(updatesQuery, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, updatesPath);
      });
    });

    // Subscribe to active poll
    const pollsPath = 'polls';
    const pollsQuery = query(collection(db, pollsPath), orderBy('timestamp', 'desc'), limit(1));
    const unsubPolls = onSnapshot(pollsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const poll = { id: snapshot.docs[0].id, ...data };
        setActivePoll(poll);
        setPollSettings({
          question: data.question,
          yesLabel: data.yesLabel,
          noLabel: data.noLabel,
          isActive: data.isActive
        });
      } else {
        setActivePoll(null);
      }
    }, (error) => {
      import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, pollsPath);
      });
    });

    return () => {
      unsubUpdates();
      unsubPolls();
    };
  }, [isOpen]);

  const handleVote = async (option: 'yes' | 'no') => {
    if (!activePoll || !auth.currentUser) return;
    if (activePoll.voters?.includes(auth.currentUser.uid)) return;
    await SocialService.voteInPoll(activePoll.id, option);
  };

  const handleAddUpdate = async () => {
    const featuresArray = newUpdate.features.split('\n').filter(f => f.trim());
    await SocialService.addUpdate({ ...newUpdate, features: featuresArray });
    setNewUpdate({ version: '', title: '', description: '', features: '' });
  };

  const handleCreatePoll = async () => {
    await SocialService.managePoll(null, pollSettings);
  };

  if (!isOpen) return null;

  const userHasVoted = activePoll?.voters?.includes(auth.currentUser?.uid);
  const totalVotes = (activePoll?.yesVotes || 0) + (activePoll?.noVotes || 0);
  const yesPercent = totalVotes > 0 ? Math.round((activePoll?.yesVotes || 0) / totalVotes * 100) : 0;
  const noPercent = totalVotes > 0 ? Math.round((activePoll?.noVotes || 0) / totalVotes * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.whats_new}</h2>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">App Changelog & Polls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setShowAdminTab(!showAdminTab)}
                className={`p-2 rounded-full transition-all ${showAdminTab ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}
              >
                <Settings size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {showAdminTab ? (
            <div className="space-y-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gold">
                  <Plus size={18} /> {t.add_update}
                </h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Version (e.g. 1.2.0)"
                    value={newUpdate.version}
                    onChange={e => setNewUpdate({...newUpdate, version: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
                  />
                  <input 
                    type="text" 
                    placeholder="Title"
                    value={newUpdate.title}
                    onChange={e => setNewUpdate({...newUpdate, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
                  />
                  <textarea 
                    placeholder="Description"
                    value={newUpdate.description}
                    onChange={e => setNewUpdate({...newUpdate, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold min-h-[100px]"
                  />
                  <textarea 
                    placeholder="Features (one per line)"
                    value={newUpdate.features}
                    onChange={e => setNewUpdate({...newUpdate, features: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold min-h-[100px]"
                  />
                  <button 
                    onClick={handleAddUpdate}
                    className="w-full bg-gold text-black py-3 rounded-xl font-bold uppercase tracking-wider"
                  >
                    {t.save}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gold">
                  <BarChart3 size={18} /> {t.manage_poll}
                </h3>
                <div className="space-y-4">
                   <input 
                    type="text" 
                    placeholder="Question"
                    value={pollSettings.question}
                    onChange={e => setPollSettings({...pollSettings, question: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Yes Label (e.g. Free)"
                      value={pollSettings.yesLabel}
                      onChange={e => setPollSettings({...pollSettings, yesLabel: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
                    />
                    <input 
                      type="text" 
                      placeholder="No Label (e.g. Add)"
                      value={pollSettings.noLabel}
                      onChange={e => setPollSettings({...pollSettings, noLabel: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-sm font-bold text-white/60">Poll Active</span>
                    <button 
                      onClick={() => setPollSettings({...pollSettings, isActive: !pollSettings.isActive})}
                      className={`w-12 h-6 rounded-full transition-all relative ${pollSettings.isActive ? 'bg-gold' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pollSettings.isActive ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleCreatePoll}
                      className="flex-1 bg-gold text-black py-3 rounded-xl font-bold uppercase tracking-wider"
                    >
                      {activePoll ? 'Update Poll' : 'Create Poll'}
                    </button>
                    {activePoll && (
                      <button 
                        onClick={() => SocialService.deletePoll(activePoll.id)}
                        className="px-6 bg-red-600 text-white py-3 rounded-xl font-bold uppercase"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Poll Section */}
              {activePoll && (activePoll.isActive || isAdmin) && (
                <div className={`bg-gradient-to-br p-8 rounded-[2.5rem] border shadow-xl overflow-hidden relative group ${activePoll.isActive ? 'from-gold/20 to-transparent border-gold/30' : 'from-white/5 to-transparent border-white/10 grayscale'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/20 transition-all"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-gold mb-4">
                      <BarChart3 size={18} />
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em]">
                        {activePoll.isActive ? t.should_we_update : 'Poll Paused/Inactive'}
                      </span>
                      {activePoll.expiresAt && (activePoll.expiresAt.toDate ? activePoll.expiresAt.toDate() : new Date(activePoll.expiresAt)) < new Date() && (
                        <span className="text-[10px] text-red-500 font-bold ml-auto uppercase tracking-tighter ring-1 ring-red-500/50 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-8 leading-tight">
                      {activePoll.question}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <button 
                        onClick={() => handleVote('yes')}
                        disabled={userHasVoted || !activePoll.isActive || (activePoll.expiresAt && (activePoll.expiresAt.toDate ? activePoll.expiresAt.toDate() : new Date(activePoll.expiresAt)) < new Date())}
                        className={`relative h-20 rounded-2xl overflow-hidden transition-all active:scale-95 border ${userHasVoted || !activePoll.isActive ? 'bg-white/5 border-white/10 opacity-60' : 'bg-gold hover:bg-gold/90 border-gold'}`}
                       >
                         <div className="relative z-10 flex flex-col items-center justify-center h-full">
                           <span className={`text-lg font-black uppercase tracking-widest ${userHasVoted || !activePoll.isActive ? 'text-white' : 'text-black'}`}>{activePoll.yesLabel}</span>
                           <span className={`text-xs font-bold ${userHasVoted || !activePoll.isActive ? 'text-white/40' : 'text-black/60'}`}>{yesPercent}%</span>
                         </div>
                         {userHasVoted && (
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${yesPercent}%` }}
                              className="absolute inset-0 bg-gold/10"
                           />
                         )}
                       </button>

                       <button 
                        onClick={() => handleVote('no')}
                        disabled={userHasVoted || !activePoll.isActive || (activePoll.expiresAt && (activePoll.expiresAt.toDate ? activePoll.expiresAt.toDate() : new Date(activePoll.expiresAt)) < new Date())}
                        className={`relative h-20 rounded-2xl overflow-hidden transition-all active:scale-95 border ${userHasVoted || !activePoll.isActive ? 'bg-white/5 border-white/10 opacity-60' : 'bg-white/10 hover:bg-white/20 border-white/10'}`}
                       >
                         <div className="relative z-10 flex flex-col items-center justify-center h-full">
                           <span className="text-lg font-black uppercase tracking-widest text-white">{activePoll.noLabel}</span>
                           <span className="text-xs font-bold text-white/40">{noPercent}%</span>
                         </div>
                         {userHasVoted && (
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${noPercent}%` }}
                              className="absolute inset-0 bg-white/5"
                           />
                         )}
                       </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                      <div className="flex items-center gap-2">
                        {userHasVoted ? (
                          <span className="flex items-center gap-1 text-gold"><Check size={12} /> {t.voted}</span>
                        ) : (
                          <span>{activePoll.isActive ? t.vote : 'Voting Disabled'}</span>
                        )}
                      </div>
                      <span>{totalVotes} {t.total_votes}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Updates List */}
              <div className="space-y-8">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/20 px-2">{t.update_log}</h3>
                <div className="space-y-6">
                  {updates.length === 0 ? (
                    <div className="text-center py-20 text-white/20 italic">No updates recorded yet.</div>
                  ) : (
                    updates.map((update, idx) => (
                      <div key={update.id} className="relative pl-10">
                        {/* Vertical line connector */}
                        {idx !== updates.length - 1 && (
                          <div className="absolute left-[19px] top-6 bottom-[-24px] w-px bg-white/5"></div>
                        )}
                        
                        <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center ${idx === 0 ? 'bg-gold text-black' : 'bg-white/5 text-white/40'}`}>
                          {idx === 0 ? <Zap size={16} /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white group-hover:text-gold transition-colors">{update.title}</h4>
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40">v{update.version}</span>
                          </div>
                          <p className="text-sm text-white/60 mb-6 leading-relaxed">{update.description}</p>
                          
                          {update.features && update.features.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">{t.features}</p>
                              <div className="grid gap-2">
                                {update.features.map((feature: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3 text-xs text-white/40">
                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0"></div>
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
