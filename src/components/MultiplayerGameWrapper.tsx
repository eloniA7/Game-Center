import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users, Loader2, Copy, Share2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';
import { generateRoomCode } from '../lib/utils';
import { FriendsModal } from './FriendsModal';
import { PlayerActionModal } from './PlayerActionModal';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface MultiplayerGameWrapperProps {
  gameId: string;
  config: any;
  onBack: () => void;
  onStart: () => void;
  children: React.ReactNode;
}

export const MultiplayerGameWrapper: React.FC<MultiplayerGameWrapperProps> = ({ gameId, config, onBack, onStart, children }) => {
  const { language, profile } = useAppContext();
  const t = translations[language];
  const [isReady, setIsReady] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>(profile ? [{
    uid: profile.uid,
    name: profile.displayName,
    photo: profile.photoUrl
  }] : []);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [actionUser, setActionUser] = useState<any | null>(null);

  const isReadyRef = useRef(false);
  const playersRef = useRef<any[]>([]);
  const roomIdRef = useRef<string | null>(null);

  useEffect(() => {
    playersRef.current = joinedPlayers;
  }, [joinedPlayers]);

  useEffect(() => {
    roomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    if (!profile) return;
    
    if (!config || config.mode === 'bot') {
      setIsReady(true);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isActive = true;

    const startMatchmaking = async () => {
      try {
        if (config.mode === 'online') {
          // 1. Search for available rooms
          const roomsRef = collection(db, 'rooms');
          const q = query(
            roomsRef, 
            where('gameType', '==', gameId),
            where('status', '==', 'waiting'),
            where('mode', '==', 'online'),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
          if (!isActive) return;

          let roomId = '';

          if (!querySnapshot.empty) {
            // Join existing room
            const roomDoc = querySnapshot.docs[0];
            roomId = roomDoc.id;
            const roomData = roomDoc.data();
            
            // Avoid joining if full or already in
            if (roomData.players.length < (roomData.maxPlayers || 4)) {
              await updateDoc(doc(db, 'rooms', roomId), {
                players: arrayUnion({
                  uid: profile.uid,
                  name: profile.displayName,
                  photo: profile.photoUrl
                }),
                playerIds: arrayUnion(profile.uid)
              });
            }
          } else {
            // Create new room for matchmaking
            const newRoom = {
              roomId: generateRoomCode(),
              gameType: gameId,
              status: 'waiting',
              players: [{
                uid: profile.uid,
                name: profile.displayName,
                photo: profile.photoUrl
              }],
              playerIds: [profile.uid],
              createdAt: serverTimestamp(),
              hostId: profile.uid,
              maxPlayers: config?.maxPlayers || 4,
              mode: 'online'
            };
            const docRef = await addDoc(collection(db, 'rooms'), newRoom);
            roomId = docRef.id;
          }

          if (isActive) {
            setCurrentRoomId(roomId);
            listenToRoom(roomId);
          }
        } else if (config.mode === 'create') {
          // Create private room
          const code = generateRoomCode();
          setRoomCode(code);
          const newRoom = {
            roomId: code,
            gameType: gameId,
            status: 'waiting',
            players: [{
              uid: profile.uid,
              name: profile.displayName,
              photo: profile.photoUrl
            }],
            playerIds: [profile.uid],
            createdAt: serverTimestamp(),
            hostId: profile.uid,
            maxPlayers: config?.maxPlayers || 4,
            mode: 'private'
          };
          const docRef = await addDoc(collection(db, 'rooms'), newRoom);
          if (isActive) {
            setCurrentRoomId(docRef.id);
            listenToRoom(docRef.id);
          }
        } else if (config.mode === 'join' && config.code) {
          // Join room by code
          setRoomCode(config.code);
          const roomsRef = collection(db, 'rooms');
          const q = query(roomsRef, where('roomId', '==', config.code), where('status', '==', 'waiting'), limit(1));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const roomDoc = snapshot.docs[0];
            await updateDoc(roomDoc.ref, {
              players: arrayUnion({
                uid: profile.uid,
                name: profile.displayName,
                photo: profile.photoUrl
              }),
              playerIds: arrayUnion(profile.uid)
            });
            setCurrentRoomId(roomDoc.id);
            listenToRoom(roomDoc.id);
          }
        }
      } catch (error) {
        if (isActive) {
          handleFirestoreError(error, OperationType.WRITE, 'rooms');
        }
      }
    };

    const listenToRoom = (id: string) => {
      unsubscribe = onSnapshot(doc(db, 'rooms', id), (snapshot) => {
        if (!isActive) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          setJoinedPlayers(data.players || []);
          
          // Check if room is full to start or already active
          if (data.status === 'active') {
            setIsReady(true);
          } else if (data.players.length >= (data.maxPlayers || 4) && data.status === 'waiting') {
            updateDoc(doc(db, 'rooms', id), { status: 'active' });
            setTimeout(() => {
              if (isActive) setIsReady(true);
            }, 1000);
          }
        }
      }, (error) => {
        if (isActive) {
          handleFirestoreError(error, OperationType.GET, `rooms/${id}`);
        }
      });
    };

    startMatchmaking();

    return () => {
      isActive = false;
      if (unsubscribe) unsubscribe();
      
      const cid = roomIdRef.current;
      if (cid && !isReadyRef.current) {
        // Remove player from room on cleanup if game hasn't started
        const removePlayer = async () => {
          try {
            const roomRef = doc(db, 'rooms', cid);
            const remainingPlayers = playersRef.current.filter(p => profile && p.uid !== profile.uid);
            const remainingPlayerIds = remainingPlayers.map(p => p.uid);
            
            if (remainingPlayers.length === 0) {
              await updateDoc(roomRef, { status: 'finished' });
            } else {
              await updateDoc(roomRef, { 
                players: remainingPlayers,
                playerIds: remainingPlayerIds
              });
            }
          } catch (e) {
            console.error("Error removing player on cleanup:", e);
          }
        };
        removePlayer();
      }
    };
  }, [config, profile, gameId]);

  if (isReady) {
    return (
      <>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { players: joinedPlayers } as any);
          }
          return child;
        })}
      </>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 text-white overflow-y-auto">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <button onClick={onBack} className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><ArrowLeft size={20} /></button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl text-center"
      >
        <div className="mb-8 md:mb-12 relative">
          <div className="absolute inset-0 bg-gold/20 blur-[100px] rounded-full" />
          <h2 className="text-3xl md:text-4xl font-bold text-gold relative z-10 mb-2 md:mb-4">{t[gameId as keyof typeof t]}</h2>
          <p className="text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold text-[10px] md:text-sm relative z-10">
            {config?.mode === 'create' ? 'Room Created' : t.waiting_for_players}
          </p>
        </div>

        {config?.mode === 'create' && (
          <div className="mb-8 md:mb-12 bg-white/5 border border-white/10 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl">
            <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase mb-3 md:mb-4 tracking-widest">Share Room Code</p>
            <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
              <span className="text-3xl md:text-5xl font-mono font-bold tracking-[0.1em] md:tracking-[0.2em] text-white underline decoration-gold underline-offset-4 md:underline-offset-8">{roomCode}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                }}
                className="p-3 md:p-4 bg-white/10 rounded-xl md:rounded-2xl hover:bg-white/20 transition-all"
              >
                <Copy size={18} />
              </button>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="mt-6 md:mt-8 flex items-center justify-center gap-2 w-full bg-gold text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-bold uppercase transition-all active:scale-95 text-sm md:text-base"
            >
              <Share2 size={18} /> {t.invite_friends}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-4 md:gap-6 mb-8 md:mb-12 flex-wrap">
          {[...Array(config?.maxPlayers || 4)].map((_, i) => {
            const player = joinedPlayers[i];
            const isMe = player?.uid === profile?.uid;
            return (
              <div key={i} className="flex flex-col items-center gap-2 md:gap-3">
                <div 
                  onClick={() => {
                    if (player && !isMe) {
                      setActionUser({ uid: player.uid, displayName: player.name, photoUrl: player.photo });
                    }
                  }}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${player ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer hover:scale-110 active:scale-95' : 'border-white/5 bg-white/5'}`}
                >
                  {player?.photo ? (
                    <img src={player.photo} className="w-full h-full object-cover rounded-lg md:rounded-xl" alt={player.name} />
                  ) : (
                    <Users size={16} className="text-white/20 md:w-6 md:h-6" />
                  )}
                </div>
                <p className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${player ? 'text-white' : 'text-white/20'}`}>
                  {player ? player.name : 'Waiting...'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3 md:gap-4">
           <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-gold animate-spin" />
           <p className="text-[10px] md:text-xs text-white/40">{t.game_starts_automatically}</p>
        </div>
      </motion.div>

      <FriendsModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        inviteRoomId={roomCode}
        inviteGameType={gameId}
      />

      <PlayerActionModal 
        isOpen={actionUser !== null}
        user={actionUser}
        onClose={() => setActionUser(null)}
      />
    </div>
  );
};
