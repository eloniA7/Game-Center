import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Search, User, Hammer, AlertTriangle, Check, Clock, Eye, Ban, Gamepad2, ChevronRight, MessageSquare } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SocialService } from '../lib/SocialService';
import { translations } from '../translations';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DURATIONS = [
  { label: '5 Minutes', value: 5 * 60 * 1000 },
  { label: '10 Minutes', value: 10 * 60 * 1000 },
  { label: '30 Minutes', value: 30 * 60 * 1000 },
  { label: '1 Hour', value: 60 * 60 * 1000 },
  { label: '4 Hours', value: 4 * 60 * 60 * 1000 },
  { label: '6 Hours', value: 6 * 60 * 60 * 1000 },
  { label: '12 Hours', value: 12 * 60 * 60 * 1000 },
  { label: '1 Day', value: 24 * 60 * 60 * 1000 },
  { label: '1 Week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 Weeks', value: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 Month', value: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 Months', value: 60 * 24 * 60 * 1000 },
  { label: '5 Months', value: 150 * 24 * 60 * 60 * 1000 },
  { label: '1 Year', value: 365 * 24 * 60 * 60 * 1000 },
  { label: '10 Years', value: 10 * 365 * 24 * 60 * 60 * 1000 },
];

const GAMES = [
  { id: 'billiards', name: 'Billiards' },
  { id: 'ludo', name: 'Ludo' },
  { id: 'backgammon', name: 'Backgammon' },
  { id: 'chess', name: 'Chess' },
  { id: 'dominoes', name: 'Dominoes' },
  { id: 'rummy', name: 'Rummy' },
  { id: 'uno', name: 'Uno' },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'search' | 'reports'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [userBans, setUserBans] = useState<any[]>([]);
  const [banType, setBanType] = useState<'app' | 'game'>('game');
  const [selectedGame, setSelectedGame] = useState('billiards');
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Subscribe to reports
    const reportsPath = 'reports';
    const q = query(collection(db, reportsPath), where('status', '==', 'pending'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, reportsPath);
      });
    });

    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedUser) {
      setUserBans([]);
      return;
    }

    const q = query(
      collection(db, 'bans'),
      where('userId', '==', selectedUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setUserBans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching user bans:", error);
    });

    return () => unsub();
  }, [selectedUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const q = query(
      collection(db, 'users'), 
      where('displayName', '>=', searchQuery), 
      where('displayName', '<=', searchQuery + '\uf8ff'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    setSearchResults(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
  };

  const handleApplyBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setIsBanning(true);
    try {
      const expiresAt = new Date(Date.now() + selectedDuration.value);
      await SocialService.manageBan({
        userId: selectedUser.uid,
        userName: selectedUser.displayName,
        type: banType,
        gameId: banType === 'game' ? selectedGame : undefined,
        duration: selectedDuration.label,
        expiresAt,
        reason: banReason
      });
      setSelectedUser(null);
      setBanReason('');
      alert(`User ${selectedUser.displayName} has been banned.`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsBanning(false);
    }
  };

  const handleRemoveBan = async (banId: string) => {
    if (!confirm('Are you sure you want to remove this ban?')) return;
    try {
      await SocialService.removeBan(banId);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full sm:max-w-4xl bg-slate-900 border-x border-y sm:border border-red-500/20 rounded-none sm:rounded-[2.5rem] overflow-hidden flex flex-col h-full sm:h-[800px] shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Admin Terminal</h2>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Enforce Rules & Safety</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'search' ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Search Users
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Reports
                {reports.length > 0 && <span className="w-4 h-4 bg-white text-red-500 rounded-full text-[10px] flex items-center justify-center">{reports.length}</span>}
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-hide">
          {activeTab === 'search' ? (
            <div className="space-y-8">
              {!selectedUser ? (
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-red-500/50 transition-all font-medium"
                      />
                    </div>
                    <button 
                      onClick={handleSearch}
                      className="px-8 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all"
                    >
                      Search
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.map(user => (
                      <button 
                        key={user.uid}
                        onClick={() => setSelectedUser(user)}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-red-500/30 transition-all text-left"
                      >
                         <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden">
                           {user.photoUrl ? (
                             <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-white/20"><User size={24} /></div>
                           )}
                         </div>
                         <div className="flex-1">
                           <h4 className="font-bold text-white">{user.displayName}</h4>
                           <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter ring-1 ring-white/10 w-fit px-1.5 rounded mt-1">{user.uid}</p>
                         </div>
                         <ChevronRight size={18} className="text-white/20" />
                      </button>
                    ))}
                  </div>

                  {searchResults.length === 0 && searchQuery && (
                    <div className="py-20 text-center text-white/20">No users found matching "{searchQuery}"</div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* User Profile Info */}
                  <div className="space-y-8">
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="text-white/40 hover:text-white flex items-center gap-2 text-xs font-bold transition-all"
                    >
                      <ChevronRight size={14} className="rotate-180" /> Back to Search
                    </button>

                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-white/10 overflow-hidden ring-4 ring-white/5 ring-offset-[8px] ring-offset-slate-900">
                        {selectedUser.photoUrl ? (
                          <img src={selectedUser.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20"><User size={40} /></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white">{selectedUser.displayName}</h3>
                        <p className="text-white/40 text-sm font-mono mt-1">{selectedUser.uid}</p>
                        <div className="flex gap-4 mt-4">
                           <div className="text-center bg-white/5 px-4 py-2 rounded-xl">
                             <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Wins</p>
                             <p className="text-xl font-black text-white">{selectedUser.wins || 0}</p>
                           </div>
                           <div className="text-center bg-white/5 px-4 py-2 rounded-xl">
                             <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Reports</p>
                             <p className="text-xl font-black text-red-500">0</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Active/Past Bans List */}
                    {userBans.length > 0 && (
                      <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 space-y-4">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} /> Ban History
                        </h3>
                        <div className="space-y-3">
                          {userBans.map(ban => (
                            <div key={ban.id} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${ban.type === 'app' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                    {ban.type === 'app' ? 'App' : `Game: ${ban.gameId}`}
                                  </span>
                                  {new Date(ban.expiresAt?.toDate ? ban.expiresAt.toDate() : ban.expiresAt) > new Date() ? (
                                    <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Active</span>
                                  ) : (
                                    <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Expired</span>
                                  )}
                                </div>
                                <p className="text-xs text-white/60 mt-1 line-clamp-1 italic">"{ban.reason}"</p>
                              </div>
                              <button 
                                onClick={() => handleRemoveBan(ban.id)}
                                className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-lg transition-all"
                                title="Remove Ban"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ban Controls */}
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Hammer size={20} className="text-red-500" /> Apply Ban
                    </h3>

                    <div className="space-y-4">
                      {/* Ban Type */}
                      <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-2xl">
                        <button 
                          onClick={() => setBanType('game')}
                          className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${banType === 'game' ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          Game Ban
                        </button>
                        <button 
                          onClick={() => setBanType('app')}
                          className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${banType === 'app' ? 'bg-red-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          Full App Ban
                        </button>
                      </div>

                      {/* Game Selection (if game ban) */}
                      {banType === 'game' && (
                        <div className="space-y-2">
                           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-2">Select Game</p>
                           <div className="grid grid-cols-3 gap-2">
                             {GAMES.map(game => (
                               <button 
                                 key={game.id}
                                 onClick={() => setSelectedGame(game.id)}
                                 className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all border ${selectedGame === game.id ? 'bg-white/10 border-red-500/50 text-red-500' : 'bg-black/20 border-transparent text-white/40 hover:border-white/10'}`}
                               >
                                 {game.name}
                               </button>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Duration */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-2">Duration</p>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                          {DURATIONS.map(dur => (
                            <button 
                              key={dur.label}
                              onClick={() => setSelectedDuration(dur)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedDuration.label === dur.label ? 'bg-white/10 border-red-500/50 text-red-500' : 'bg-black/20 border-transparent text-white/40 hover:border-white/10'}`}
                            >
                              {dur.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-2">Reason (Investigation Details)</p>
                        <textarea 
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Why are you banning this user?"
                          className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-red-500/50 min-h-[100px] resize-none"
                        />
                      </div>

                      <button 
                        onClick={handleApplyBan}
                        disabled={isBanning || !banReason.trim()}
                        className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-red-900/20"
                      >
                        {isBanning ? 'Processing...' : (
                          <>
                            <Hammer size={18} /> Confirm {banType === 'game' ? `Game Ban (${selectedGame})` : 'Full App Ban'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {reports.length === 0 ? (
                <div className="py-40 text-center flex flex-col items-center gap-4 text-white/20">
                  <Check size={48} />
                  <span className="font-bold">Inbox clear. No pending reports.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div 
                      key={report.id}
                      className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col gap-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                             <AlertTriangle size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold text-white">Report against {report.reportedUserName}</h4>
                             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Reported by {report.reporterName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-white/40 font-mono mb-1">{new Date(report.timestamp?.seconds * 1000).toLocaleString()}</p>
                           <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">Pending Review</span>
                        </div>
                      </div>

                      <div className="bg-black/20 p-6 rounded-2xl">
                         <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                           <MessageSquare size={10} /> Player Statement
                         </p>
                         <p className="text-sm text-white/80 leading-relaxed italic">"{report.reason}"</p>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setSelectedUser({ uid: report.reportedUserId, displayName: report.reportedUserName, photoUrl: report.reportedUserPhoto });
                            setActiveTab('search');
                          }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                        >
                          <Eye size={16} /> Investigate & Ban
                        </button>
                        <button 
                          onClick={() => SocialService.updateReportStatus(report.id, 'cancelled')}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all border border-white/5"
                        >
                          Dismiss Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
