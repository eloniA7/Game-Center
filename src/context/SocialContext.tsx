import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface SocialContextType {
  friends: any[];
  pendingRequests: any[];
  incomingInvites: any[];
  unreadTotal: number;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;

    // Friends listener
    const friendsUnsub = onSnapshot(
      collection(db, 'users', userId, 'friends'),
      (snapshot) => {
        setFriends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // Pending Requests listener
    const requestsUnsub = onSnapshot(
      query(collection(db, 'friend_requests'), where('toId', '==', userId), where('status', '==', 'pending')),
      (snapshot) => {
        setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // Incoming Invites listener
    const invitesUnsub = onSnapshot(
      query(collection(db, 'game_invites'), where('toId', '==', userId), where('status', '==', 'pending')),
      (snapshot) => {
        setIncomingInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      friendsUnsub();
      requestsUnsub();
      invitesUnsub();
    };
  }, []);

  return (
    <SocialContext.Provider value={{ friends, pendingRequests, incomingInvites, unreadTotal }}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
