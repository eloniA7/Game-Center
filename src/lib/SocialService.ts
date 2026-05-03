import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface FriendProfile {
  friendId: string;
  friendName: string;
  friendPhoto: string;
}

export const SocialService = {
  async voteInPoll(pollId: string, option: 'yes' | 'no') {
    if (!auth.currentUser) return;
    try {
      const pollRef = doc(db, 'polls', pollId);
      await updateDoc(pollRef, {
        [option + 'Votes']: increment(1),
        voters: arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `polls/${pollId}`);
    }
  },

  async addUpdate(update: { version: string, title: string, description: string, features: string[] }) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'updates'), {
        ...update,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'updates');
    }
  },

  async managePoll(pollId: string | null, pollData: { question: string, yesLabel: string, noLabel: string, isActive: boolean }) {
    if (!auth.currentUser) return;
    try {
      if (pollId) {
        await updateDoc(doc(db, 'polls', pollId), pollData);
      } else {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        await addDoc(collection(db, 'polls'), {
          ...pollData,
          yesVotes: 0,
          noVotes: 0,
          voters: [],
          timestamp: serverTimestamp(),
          expiresAt: expiresAt
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'polls');
    }
  },

  async deletePoll(pollId: string) {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'polls', pollId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `polls/${pollId}`);
    }
  },

  async reportPlayer(report: { 
    reportedUserId: string, 
    reportedUserName: string, 
    reportedUserPhoto?: string, 
    reason: string 
  }) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'reports'), {
        ...report,
        reporterId: auth.currentUser.uid,
        reporterName: auth.currentUser.displayName || 'Anonymous',
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  },

  async manageBan(ban: {
    userId: string,
    userName: string,
    type: 'app' | 'game',
    gameId?: string,
    duration: string,
    expiresAt: Date,
    reason: string
  }) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'bans'), {
        ...ban,
        expiresAt: ban.expiresAt,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bans');
    }
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'cancelled') {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reports/${reportId}`);
    }
  },

  async removeBan(banId: string) {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'bans', banId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bans/${banId}`);
    }
  },

  async sendFriendRequest(toId: string, toName: string) {
    if (!auth.currentUser) return;
    
    try {
      const requestId = `${auth.currentUser.uid}_${toId}`;
      await setDoc(doc(db, 'friend_requests', requestId), {
        fromId: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Guest',
        toId: toId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'friend_requests');
    }
  },

  async respondToFriendRequest(requestId: string, fromId: string, fromName: string, status: 'accepted' | 'rejected') {
    if (!auth.currentUser) return;

    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, 'friend_requests', requestId);
      
      if (status === 'accepted') {
        // Add to both users' friends collections
        const userFriendRef = doc(db, 'users', auth.currentUser.uid, 'friends', fromId);
        const friendUserRef = doc(db, 'users', fromId, 'friends', auth.currentUser.uid);
        
        batch.set(userFriendRef, {
          friendId: fromId,
          friendName: fromName,
          timestamp: serverTimestamp()
        });
        
        batch.set(friendUserRef, {
          friendId: auth.currentUser.uid,
          friendName: auth.currentUser.displayName || 'Guest',
          timestamp: serverTimestamp()
        });
      }
      
      batch.delete(requestRef);
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'friend_requests/friends');
    }
  },

  async sendInvite(toId: string, roomId: string, gameType: string) {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'game_invites'), {
        fromId: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Guest',
        toId: toId,
        roomId: roomId,
        gameType: gameType,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'game_invites');
    }
  },

  async respondToInvite(inviteId: string, status: 'accepted' | 'rejected') {
    if (!auth.currentUser) return;

    try {
      if (status === 'rejected') {
        await deleteDoc(doc(db, 'game_invites', inviteId));
      } else {
        await updateDoc(doc(db, 'game_invites', inviteId), {
          status: 'accepted'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `game_invites/${inviteId}`);
    }
  },

  async sendMessage(toId: string, text: string) {
    if (!auth.currentUser) return;
    
    // Sort IDs to create a consistent chatId
    const chatId = [auth.currentUser.uid, toId].sort().join('_');
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  },

  async searchUsers(queryText: string) {
    try {
      const usersRef = collection(db, 'users');
      // Simple prefix search (case-sensitive unfortunately in Firestore without extra fields)
      const q = query(
        usersRef, 
        where('displayName', '>=', queryText),
        where('displayName', '<=', queryText + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }
};
