import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, query, collection, where, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Language } from '../translations';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string;
  wins: number;
  level: number;
  xp: number;
  unlockedAvatars: string[];
}

interface BanInfo {
  id: string;
  type: 'app' | 'game';
  gameId?: string;
  duration: string;
  expiresAt: any;
  reason: string;
}

interface AppContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  activeBans: BanInfo[];
  language: Language;
  setLanguage: (lang: Language) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeBans, setActiveBans] = useState<BanInfo[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubBans: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubProfile) unsubProfile();
      if (unsubBans) unsubBans();

      if (firebaseUser) {
        // Sync profile
        const path = `users/${firebaseUser.uid}`;
        const profileRef = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // Initialize new user
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Guest',
              email: firebaseUser.email || '',
              photoUrl: '',
              wins: 0,
              level: 1,
              xp: 0,
              unlockedAvatars: ['1', '2', '3', '4', '5']
            };
            setDoc(profileRef, newProfile).catch(err => {
               import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
                 handleFirestoreError(err, OperationType.WRITE, path);
               });
            });
            setProfile(newProfile);
          }
        }, (error) => {
           import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
             handleFirestoreError(error, OperationType.GET, path);
           });
        });

        // Sync bans
        const bansPath = 'bans';
        const bansQuery = query(
          collection(db, bansPath), 
          where('userId', '==', firebaseUser.uid),
          where('expiresAt', '>', new Date())
        );
        unsubBans = onSnapshot(bansQuery, (snapshot) => {
          setActiveBans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BanInfo)));
          setLoading(false);
        }, (error) => {
          import('../lib/firebase').then(({ handleFirestoreError, OperationType }) => {
            handleFirestoreError(error, OperationType.GET, bansPath);
          });
          setLoading(false);
        });
      } else {
        setProfile(null);
        setActiveBans([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
      if (unsubBans) unsubBans();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, profile, activeBans, language, setLanguage, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
