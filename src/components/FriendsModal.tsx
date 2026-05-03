import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Search, UserPlus, Check, X, MessageSquare, Send, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useSocial } from '../context/SocialContext';
import { SocialService } from '../lib/SocialService';
import { translations } from '../translations';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { PlayerActionModal } from './PlayerActionModal';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteRoomId?: string | null;
  inviteGameType?: string | null;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, inviteRoomId, inviteGameType }) => {
  const { language } = useAppContext();
  const { friends, pendingRequests } = useSocial();
  const t = translations[language];
  const [activeTab, setActiveTab ] = useState<'friends' | 'requests' | 'search' | 'chat'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [actionUser, setActionUser] = useState<any | null>(null);

  useEffect(() => {
    if (activeTab === 'chat' && selectedFriend && auth.currentUser) {
      const chatId = [auth.currentUser.uid, selectedFriend.friendId].sort().join('_');
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      
      return () => unsub();
    }
  }, [activeTab, selectedFriend]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await SocialService.searchUsers(searchQuery);
    setSearchResults(results.filter(u => u.uid !== auth.currentUser?.uid));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;
    await SocialService.sendMessage(selectedFriend.friendId, newMessage);
    setNewMessage('');
  };

  const handleInvite = async (friend: any) => {
    if (!inviteRoomId || !inviteGameType) return;
    await SocialService.sendInvite(friend.friendId, inviteRoomId, inviteGameType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
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
          className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[600px] shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('friends')}
                className={`text-sm font-bold uppercase tracking-wider ${activeTab === 'friends' ? 'text-gold' : 'text-white/40'}`}
              >
                {t.friends || 'Friends'}
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`text-sm font-bold uppercase tracking-wider relative ${activeTab === 'requests' ? 'text-gold' : 'text-white/40'}`}
              >
                {t.requests || 'Requests'}
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-2 -right-3 w-4 h-4 bg-red-600 text-[10px] rounded-full flex items-center justify-center text-white">{pendingRequests.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={`text-sm font-bold uppercase tracking-wider ${activeTab === 'search' ? 'text-gold' : 'text-white/40'}`}
              >
                {t.search || 'Search'}
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {activeTab === 'friends' && (
              <div className="space-y-4">
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <User size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">{t.no_friends || 'No friends yet'}</p>
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => setActionUser({ uid: friend.friendId, displayName: friend.friendName, photoUrl: friend.friendPhoto })}
                          className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5 cursor-pointer hover:border-gold transition-all"
                        >
                          {friend.friendPhoto ? <img src={friend.friendPhoto} className="w-full h-full object-cover" /> : <User size={20} className="w-full h-full p-3 text-white/20" />}
                        </div>
                        <div>
                          <p 
                            onClick={() => setActionUser({ uid: friend.friendId, displayName: friend.friendName, photoUrl: friend.friendPhoto })}
                            className="font-bold text-white cursor-pointer hover:text-gold transition-all"
                          >
                            {friend.friendName}
                          </p>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Friend</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         {inviteRoomId ? (
                           <button 
                            onClick={() => handleInvite(friend)}
                            className="bg-gold text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                           >
                             {t.invite || 'Invite'}
                           </button>
                         ) : (
                           <button 
                            onClick={() => {
                              setSelectedFriend(friend);
                              setActiveTab('chat');
                            }}
                            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-gold"
                           >
                             <MessageSquare size={18} />
                           </button>
                         )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <Mail size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">{t.no_requests || 'No pending requests'}</p>
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                         <div 
                           onClick={() => setActionUser({ uid: req.fromId, displayName: req.fromName })}
                           className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20 cursor-pointer hover:border-gold transition-all"
                         >
                           <User size={16} />
                         </div>
                         <p 
                          onClick={() => setActionUser({ uid: req.fromId, displayName: req.fromName })}
                          className="font-bold text-white cursor-pointer hover:text-gold transition-all"
                         >
                          {req.fromName}
                         </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => SocialService.respondToFriendRequest(req.id, req.fromId, req.fromName, 'accepted')}
                          className="p-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => SocialService.respondToFriendRequest(req.id, req.fromId, req.fromName, 'rejected')}
                          className="p-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input 
                      type="text" 
                      placeholder={t.search_users || "Search users..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleSearch}
                    className="bg-gold text-black px-6 rounded-2xl font-bold font-sm"
                  >
                    {t.go || 'Go'}
                  </button>
                </div>

                <div className="space-y-4">
                  {searchResults.map(user => (
                    <div key={user.uid} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => setActionUser({ uid: user.uid, displayName: user.displayName, photoUrl: user.photoUrl })}
                          className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5 cursor-pointer hover:border-gold transition-all"
                        >
                          {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : <User size={20} className="w-full h-full p-3 text-white/20" />}
                        </div>
                        <div>
                          <p 
                            onClick={() => setActionUser({ uid: user.uid, displayName: user.displayName, photoUrl: user.photoUrl })}
                            className="font-bold text-white cursor-pointer hover:text-gold transition-all"
                          >
                            {user.displayName}
                          </p>
                          <p className="text-[10px] text-white/40 uppercase font-bold">Lvl {user.level || 1}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => SocialService.sendFriendRequest(user.uid, user.displayName)}
                        className="p-3 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-all"
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chat' && selectedFriend && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 bg-white/5 p-4 rounded-2xl">
                   <button onClick={() => setActiveTab('friends')} className="text-white/40"><X size={18} /></button>
                   <div 
                    onClick={() => setActionUser({ uid: selectedFriend.friendId, displayName: selectedFriend.friendName, photoUrl: selectedFriend.friendPhoto })}
                    className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden bg-white/5 cursor-pointer hover:border-gold transition-all"
                   >
                     {selectedFriend.friendPhoto ? <img src={selectedFriend.friendPhoto} className="w-full h-full object-cover" /> : <User size={16} className="w-full h-full p-2 text-white/20" />}
                   </div>
                   <p className="font-bold text-white">{selectedFriend.friendName}</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.senderId === auth.currentUser?.uid ? 'bg-gold text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex gap-2">
                   <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.type_message || "Type a message..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-gold"
                   />
                   <button 
                    onClick={handleSendMessage}
                    className="p-3 bg-gold text-black rounded-2xl hover:bg-gold/80 transition-all"
                   >
                     <Send size={18} />
                   </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <PlayerActionModal 
        isOpen={actionUser !== null}
        user={actionUser}
        onClose={() => setActionUser(null)}
        onViewProfile={() => {
          // This would ideally open a public profile view, but for now we close
          setActionUser(null);
        }}
      />
    </>
  );
};
