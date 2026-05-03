import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, AlertTriangle, Send, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SocialService } from '../lib/SocialService';
import { translations } from '../translations';

interface PlayerActionModalProps {
  user: {
    uid: string;
    displayName: string;
    photoUrl?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: () => void;
}

export const PlayerActionModal: React.FC<PlayerActionModalProps> = ({ user, isOpen, onClose, onViewProfile }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return;
    setIsSubmitting(true);
    try {
      await SocialService.reportPlayer({
        reportedUserId: user.uid,
        reportedUserName: user.displayName,
        reportedUserPhoto: user.photoUrl,
        reason: reportReason
      });
      alert('Report submitted successfully. Admins will investigate.');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-white/10 overflow-hidden mb-6 ring-4 ring-white/5 shadow-xl">
             {user.photoUrl ? (
               <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-white/20"><User size={40} /></div>
             )}
          </div>
          <h3 className="text-xl font-bold text-white mb-8">{user.displayName}</h3>

          <AnimatePresence mode="wait">
            {!showReportForm ? (
              <motion.div 
                key="actions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full space-y-3"
              >
                <button 
                  onClick={onViewProfile}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex items-center justify-between px-6 hover:bg-white/10 transition-all group"
                >
                  <span className="flex items-center gap-3"><User size={20} className="text-blue-400" /> View Profile</span>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-all" />
                </button>
                <button 
                  onClick={() => setShowReportForm(true)}
                  className="w-full py-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 font-bold flex items-center justify-between px-6 hover:bg-red-600/20 transition-all group"
                >
                  <span className="flex items-center gap-3"><ShieldAlert size={20} /> Report Player</span>
                  <ChevronRight size={18} className="text-red-500/20 group-hover:text-red-500 transition-all" />
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 text-white/40 font-bold hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-4"
              >
                 <div className="flex items-center gap-2 text-red-500 mb-2">
                   <AlertTriangle size={18} />
                   <span className="text-xs font-black uppercase tracking-widest">Submit Report</span>
                 </div>
                 <textarea 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why you are reporting this player (e.g. hacking, toxicity...)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-red-500/50 min-h-[120px] resize-none"
                 />
                 <div className="flex gap-3">
                   <button 
                    onClick={handleReport}
                    disabled={isSubmitting || !reportReason.trim()}
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isSubmitting ? '...' : <><Send size={16} /> Submit</>}
                   </button>
                   <button 
                    onClick={() => setShowReportForm(false)}
                    className="px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                   >
                     Back
                   </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
