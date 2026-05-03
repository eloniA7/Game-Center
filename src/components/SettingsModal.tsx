import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronRight, Globe, Lock, Shield, Bell, 
  Settings as SettingsIcon, Volume2, Music, 
  Smartphone, User as UserIcon, Monitor, 
  Eye, Info, Trash2, Moon, AppWindow,
  Check, Sliders, Gamepad2, MousePointer2,
  Fingerprint, Pencil
} from 'lucide-react';
import { translations } from '../translations';
import { useAppContext } from '../context/AppContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

type Category = 'general' | 'account' | 'game' | 'notifications' | 'privacy' | 'about' | 'admin';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  const { language, setLanguage, profile } = useAppContext();
  const isAdmin = profile?.email === 'hfg98849@gmail.com';
  const t = translations[language];
  const [activeCategory, setActiveCategory] = useState<Category>('general');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim() || !auth.currentUser) return;
    setIsUpdatingName(true);
    try {
      const { updateProfile } = await import('firebase/auth');
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      // Update Firebase Auth
      await updateProfile(auth.currentUser, { displayName: newName });
      
      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { displayName: newName });
      
      setEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Dummy states for UI
  const [sounds, setSounds] = useState(true);
  const [music, setMusic] = useState(true);
  const [masterVolume, setMasterVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(60);
  const [sfxVolume, setSfxVolume] = useState(100);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compact, setCompact] = useState(false);
  const [quality, setQuality] = useState<'low' | 'high'>('high');
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fps, setFps] = useState('60');
  const [aa, setAa] = useState(true);
  const [particles, setParticles] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [dataAnalytics, setDataAnalytics] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);
  const [controlMode, setControlMode] = useState<'touch' | 'mouse'>('touch');

  if (!isOpen) return null;

  const categories: { id: Category; icon: any; label: string }[] = [
    { id: 'general', icon: Globe, label: t.general },
    { id: 'account', icon: UserIcon, label: t.account },
    { id: 'game', icon: SettingsIcon, label: t.game_settings },
    { id: 'notifications', icon: Bell, label: t.notifications },
    { id: 'privacy', icon: Shield, label: t.privacy },
    { id: 'about', icon: Info, label: t.about_support },
    ...(isAdmin ? [{ id: 'admin' as Category, icon: Shield, label: 'Admin Tools' }] : []),
  ];

  const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'bg-gold' : 'bg-white/10'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${active ? 'translate-x-6' : 'translate-x-0 shadow-sm'}`} />
    </button>
  );

  const SettingRow = ({ label, children, description, icon: Icon }: { label: string; children: React.ReactNode; description?: string; icon?: any }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-4 px-4 transition-colors">
      <div className="flex items-start gap-3 flex-1 pr-4">
        {Icon && <Icon size={18} className="text-white/20 mt-1 shrink-0" />}
        <div>
          <p className="font-semibold text-sm md:text-base text-white/90">{label}</p>
          {description && <p className="text-[10px] md:text-xs text-white/40 mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gold/60 mb-4 mt-8 first:mt-0">{title}</h3>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title={t.language} />
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${language === 'en' ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('ku')}
                className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${language === 'ku' ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
              >
                Kurdî
              </button>
            </div>

            <SectionTitle title="Interface" />
            <SettingRow label={t.dark_mode} icon={Moon}>
              <Toggle active={darkMode} onClick={() => setDarkMode(!darkMode)} />
            </SettingRow>
            <SettingRow label={t.compact_mode} description="Fit more items on screen" icon={AppWindow}>
              <Toggle active={compact} onClick={() => setCompact(!compact)} />
            </SettingRow>
            <SettingRow label={t.high_contrast} description="Increase visibility of UI elements" icon={Monitor}>
              <Toggle active={highContrast} onClick={() => setHighContrast(!highContrast)} />
            </SettingRow>

            <SectionTitle title="System" />
            <SettingRow label={t.auto_start} description="Launch application on system startup" icon={Smartphone}>
              <Toggle active={autoStart} onClick={() => setAutoStart(!autoStart)} />
            </SettingRow>
            <SettingRow label={t.region} description="Select your preferred server location">
              <select className="bg-white/5 text-white/60 text-xs font-bold p-2 px-3 rounded-lg border border-white/10 outline-none focus:border-gold/30">
                <option>Middle East (Iraq)</option>
                <option>Europe (Frankfurt)</option>
                <option>US East (Virginia)</option>
                <option>Asia (Singapore)</option>
              </select>
            </SettingRow>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-6 bg-white/5 rounded-3xl mb-8 flex items-center gap-4 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-gold/5 transition-opacity opacity-0 group-hover:opacity-100 to-transparent pointer-events-none" />
               <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-2xl font-black relative z-10">
                  {auth.currentUser?.email?.[0].toUpperCase()}
               </div>
               <div className="relative z-10 flex-1">
                  {editingName ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-white/10 border border-gold/30 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-gold"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleUpdateName}
                          disabled={isUpdatingName}
                          className="text-[10px] bg-gold text-black font-black uppercase px-3 py-1 rounded-md"
                        >
                          {isUpdatingName ? '...' : t.save}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingName(false);
                            setNewName(profile?.displayName || '');
                          }}
                          className="text-[10px] bg-white/10 text-white/60 font-black uppercase px-3 py-1 rounded-md"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <h4 className="font-bold text-lg text-white flex items-center gap-2">
                        {profile?.displayName || "Pro Gamer"}
                        <button 
                          onClick={() => {
                            setEditingName(true);
                            setNewName(profile?.displayName || '');
                          }}
                          className="p-1 hover:bg-white/10 rounded-md text-white/20 hover:text-gold transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                      </h4>
                      <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">Player Profile</p>
                    </div>
                  )}
               </div>
               <button className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 relative z-10">
                  {t.change_photo}
               </button>
            </div>

            <SectionTitle title={t.security} />
            <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Lock size={16} className="text-blue-400" />
                </div>
                <span className="font-semibold">{t.change_password}</span>
              </div>
              <ChevronRight size={18} className="text-white/20" />
            </button>
            <SettingRow label={t.two_factor_auth} description="Add extra layer of security using OTP" icon={Shield}>
              <Toggle active={false} onClick={() => {}} />
            </SettingRow>
            <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Globe size={16} className="text-purple-400" />
                </div>
                <span className="font-semibold">{t.sessions}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-md">2 {t.active}</span>
                 <ChevronRight size={18} className="text-white/20" />
              </div>
            </button>

            <SectionTitle title={t.linked_accounts} />
            <div className="space-y-2">
               <button 
                 onClick={async () => {
                   try {
                     const { linkWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                     const { googleProvider } = await import('../lib/firebase');
                     if (auth.currentUser) {
                       await linkWithPopup(auth.currentUser, googleProvider);
                       alert("Google account linked successfully!");
                     }
                   } catch (error: any) {
                     console.error("Error linking Google:", error);
                     alert(error.message);
                   }
                 }}
                 className={`w-full flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all ${auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? '' : 'grayscale opacity-50'}`}
               >
                  <div className="w-8 h-8 bg-[#4285F4]/10 rounded-lg flex items-center justify-center font-bold text-[#4285F4]">G</div>
                  <span className="font-bold text-sm">Google</span>
                  <span className="ml-auto text-[10px] uppercase font-black tracking-tighter">
                    {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? 'Connected' : 'Connect'}
                  </span>
               </button>
               
               <button 
                 onClick={async () => {
                   try {
                     const { linkWithPopup, GithubAuthProvider } = await import('firebase/auth');
                     const { githubProvider } = await import('../lib/firebase');
                     if (auth.currentUser) {
                       await linkWithPopup(auth.currentUser, githubProvider);
                       alert("GitHub account linked successfully!");
                     }
                   } catch (error: any) {
                     console.error("Error linking GitHub:", error);
                     alert(error.message);
                   }
                 }}
                 className={`w-full flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all ${auth.currentUser?.providerData.some(p => p.providerId === 'github.com') ? '' : 'grayscale opacity-50'}`}
               >
                  <div className="w-8 h-8 bg-[#333]/10 rounded-lg flex items-center justify-center font-bold text-[#333]">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </div>
                  <span className="font-bold text-sm">GitHub</span>
                  <span className="ml-auto text-[10px] uppercase font-black tracking-tighter">
                    {auth.currentUser?.providerData.some(p => p.providerId === 'github.com') ? 'Connected' : 'Connect'}
                  </span>
               </button>

               <button className="w-full flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all grayscale opacity-50">
                  <div className="w-8 h-8 bg-[#1877F2]/10 rounded-lg flex items-center justify-center font-bold text-[#1877F2]">f</div>
                  <span className="font-bold text-sm">Facebook</span>
                  <span className="ml-auto text-[10px] uppercase font-black text-white/20 tracking-tighter">Connect</span>
               </button>
            </div>

            <SectionTitle title="Management" />
            <button 
              onClick={() => { signOut(auth); onClose(); }}
              className="w-full py-4 text-center text-red-100 font-bold bg-red-600/20 rounded-2xl hover:bg-red-600/30 transition-all border border-red-500/20"
            >
              Sign Out
            </button>
            <button className="w-full py-4 text-center text-white/20 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-2 mt-4">
              <Trash2 size={12} />
              {t.delete_account}
            </button>
          </div>
        );
      case 'game':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title="Audio Levels" />
            <div className="space-y-6 px-1">
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                     <span>Master Volume</span>
                     <span>{masterVolume}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={masterVolume} 
                    onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                     <span>Music</span>
                     <span>{musicVolume}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={musicVolume} 
                    onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                     <span>Sound Effects</span>
                     <span>{sfxVolume}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sfxVolume} 
                    onChange={(e) => setSfxVolume(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
               </div>
            </div>

            <SectionTitle title="Audio Settings" />
            <SettingRow label={t.sound_effects} icon={Volume2}>
              <Toggle active={sounds} onClick={() => setSounds(!sounds)} />
            </SettingRow>
            <SettingRow label={t.music} icon={Music}>
              <Toggle active={music} onClick={() => setMusic(!music)} />
            </SettingRow>
            
            <SectionTitle title="Controls" />
            <SettingRow label="Control Mode" description="Choose your input method" icon={Gamepad2}>
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                {(['touch', 'mouse'] as const).map(m => (
                  <button 
                    key={m}
                    onClick={() => setControlMode(m)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${controlMode === m ? 'bg-white/20 text-white' : 'text-white/20 hover:text-white'}`}
                  >
                    {m === 'touch' ? <Smartphone size={12} /> : <MousePointer2 size={12} />}
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </div>
            </SettingRow>
            <div className="space-y-3 py-4">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40 px-1">
                  <span>Sensitivity</span>
                  <span>{sensitivity}%</span>
               </div>
               <input 
                 type="range" min="1" max="100" value={sensitivity} 
                 onChange={(e) => setSensitivity(parseInt(e.target.value))}
                 className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
               />
            </div>

            <SectionTitle title="Haptics" />
            <SettingRow label={t.vibration} description="Vibrate on game events and turns" icon={Smartphone}>
              <Toggle active={vibration} onClick={() => setVibration(!vibration)} />
            </SettingRow>

            <SectionTitle title="Visuals" />
            <SettingRow label={t.graphics_quality}>
              <div className="flex bg-white/5 rounded-xl p-1 shadow-inner border border-white/5">
                {(['low', 'high'] as const).map(q => (
                  <button 
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${quality === q ? 'bg-gold text-black shadow-lg scale-105' : 'text-white/40 hover:text-white'}`}
                  >
                    {t[q]}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label={t.frame_rate} description="Higher FPS makes movement smoother">
               <div className="flex bg-white/5 rounded-xl p-1 shadow-inner border border-white/5">
                  {['30', '60', '120'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFps(f)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${fps === f ? 'bg-white/20 text-white shadow-lg' : 'text-white/20 hover:text-white'}`}
                    >
                      {f} FPS
                    </button>
                  ))}
               </div>
            </SettingRow>
            <SettingRow label={t.anti_aliasing} description="Smooth out jagged object edges">
               <Toggle active={aa} onClick={() => setAa(!aa)} />
            </SettingRow>
            <SettingRow label={t.particle_effects} description="Enable smoke, fire and explosion effects">
               <Toggle active={particles} onClick={() => setParticles(!particles)} />
            </SettingRow>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title={t.notifications} />
            <SettingRow label={t.push_notifications} description="Alerts shown on your device lock screen">
              <Toggle active={pushNotif} onClick={() => setPushNotif(!pushNotif)} />
            </SettingRow>
            <SettingRow label={t.email_notifications} description="Occasional game updates and news">
              <Toggle active={emailNotif} onClick={() => setEmailNotif(!emailNotif)} />
            </SettingRow>
            
            <SectionTitle title="Communication" />
            <SettingRow label={t.friend_requests} description="When someone wants to add you">
              <Toggle active={true} onClick={() => {}} />
            </SettingRow>
            <SettingRow label={t.message_alerts} description="When you receive a chat message">
              <Toggle active={true} onClick={() => {}} />
            </SettingRow>
            
            <SectionTitle title="Engagement" />
            <SettingRow label="Game Invitations" description="When friends invite you to play">
              <Toggle active={true} onClick={() => {}} />
            </SettingRow>
            <div className="bg-white/5 rounded-2xl p-4 mt-2 mb-4 border border-white/5 space-y-3 shadow-inner">
               <p className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-2">Per Game Filters</p>
               {['Billiards', 'Domino', 'UNO', 'Snake & Ladder'].map(game => (
                 <div key={game} className="flex justify-between items-center group/item hover:bg-white/[0.03] -mx-2 px-2 py-1 rounded-lg transition-colors">
                    <span className="text-xs font-bold text-white/60 group-hover/item:text-white transition-colors">{game}</span>
                    <Toggle active={true} onClick={() => {}} />
                 </div>
               ))}
            </div>
            <SettingRow label="Tournament Updates" description="Notifications about live events">
              <Toggle active={false} onClick={() => {}} />
            </SettingRow>
            <SettingRow label="Daily Missions" description="Reminders about your active goals">
              <Toggle active={true} onClick={() => {}} />
            </SettingRow>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title="Visibility" />
            <SettingRow label={t.profile_visibility} description={profilePublic ? "Everyone can see your level and match history" : "Only people you are friends with can see your details"}>
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5 shadow-inner">
                {(['public', 'private'] as const).map(v => (
                  <button 
                    key={v}
                    onClick={() => setProfilePublic(v === 'public')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ (profilePublic && v === 'public') || (!profilePublic && v === 'private') ? 'bg-gold text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    {t[v]}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label={t.show_online_status} description="Let others see if you are currently online">
              <Toggle active={onlineStatus} onClick={() => setOnlineStatus(!onlineStatus)} />
            </SettingRow>

            <SectionTitle title="Messaging & Chat" />
            <SettingRow label={t.chat_bubble} description="Show floating chat icons in game">
              <Toggle active={true} onClick={() => {}} />
            </SettingRow>
            <SettingRow label={t.read_receipts} description="Allow others to see when you read their messages">
               <Toggle active={readReceipts} onClick={() => setReadReceipts(!readReceipts)} />
            </SettingRow>
            <SettingRow label={t.auto_translate} description="Automatically translate foreign chats to your language">
              <Toggle active={false} onClick={() => {}} />
            </SettingRow>
            <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left group mt-2">
               <span className="font-semibold text-white/80">{t.blocked_list}</span>
               <div className="flex items-center gap-2">
                  <span className="text-white/20 text-xs">0 Users</span>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-gold transition-all" />
               </div>
            </button>

            <SectionTitle title="Data" />
            <SettingRow label={t.data_usage} description="Help us improve by sharing usage analytics">
               <Toggle active={dataAnalytics} onClick={() => setDataAnalytics(!dataAnalytics)} />
            </SettingRow>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title="Information" />
            <div className="grid grid-cols-2 gap-3">
               <button className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 group gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Shield size={20} /></div>
                  <span className="font-bold text-xs uppercase tracking-widest text-white/60">{t.terms_of_service}</span>
               </button>
               <button className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 group gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform"><Lock size={20} /></div>
                  <span className="font-bold text-xs uppercase tracking-widest text-white/60">{t.privacy_policy}</span>
               </button>
            </div>

            <SectionTitle title="Support" />
            <div className="space-y-2">
               <button className="w-full flex items-center justify-between p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all text-left group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400"><Info size={20} /></div>
                     <span className="font-bold">{t.support_center}</span>
                  </div>
                  <ChevronRight size={18} className="text-white/20" />
               </button>
               <button className="w-full flex items-center justify-between p-5 bg-orange-500/5 hover:bg-orange-500/10 rounded-3xl transition-all text-left group border border-orange-500/10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400"><Trash2 size={20} /></div>
                     <span className="font-bold text-orange-200">{t.report_bug}</span>
                  </div>
                  <ChevronRight size={18} className="text-orange-900/40" />
               </button>
            </div>

            <SectionTitle title="Software" />
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/30 font-bold uppercase tracking-widest">{t.version}</span>
                <span className="px-3 py-1 bg-gold text-black rounded-lg font-mono font-black text-[10px]">1.2.4-ULTIMATE</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/30 font-bold uppercase tracking-widest">Build ID</span>
                <span className="text-white/60 font-mono text-[10px]">AIS-2026-XQ92</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                <span className="text-white/30 font-bold uppercase tracking-widest">{t.developer}</span>
                <span className="text-gold font-black italic tracking-tighter hover:scale-110 transition-transform cursor-pointer">@eloni</span>
              </div>
              <button className="w-full py-3 mt-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 transition-all border border-white/5">
                 {t.check_updates}
              </button>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <SectionTitle title="Administrator Controls" />
            <p className="text-white/40 text-sm mb-6">Access restricted management tools and system logs.</p>
            
            <button 
              onClick={() => {
                onOpenAdmin?.();
                onClose();
              }}
              className="w-full flex items-center justify-between p-6 bg-red-500/10 hover:bg-red-500/20 rounded-3xl transition-all text-left group border border-red-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all">
                  <Shield size={24} />
                </div>
                <div>
                  <span className="font-bold text-lg text-red-400 block tracking-tight">Open Admin Panel</span>
                  <span className="text-[10px] text-red-500/60 uppercase font-black tracking-widest">Reports, Bans, and Updates</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-900/40" />
            </button>

            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 mt-8">
               <h4 className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-4">Quick Stats</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                     <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Server Status</p>
                     <p className="text-green-500 font-black tracking-tighter">OPERATIONAL</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                     <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Active Queries</p>
                     <p className="text-white font-black tracking-tighter">SENSITIVE</p>
                  </div>
               </div>
            </div>
          </div>
        );
    }
  };


  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          className="w-full max-w-5xl h-full max-h-[85vh] bg-[#0a0c10] border border-white/10 rounded-[2.5rem] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-black text-gold uppercase tracking-tighter italic">{t.settings}</h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar (Icon Dock) */}
          <div className="w-full md:w-24 bg-[#0f1116] border-b md:border-b-0 md:border-r border-white/5 flex md:flex-col items-center justify-center md:justify-start py-4 md:py-8 px-4 md:px-0 gap-4 md:gap-6 shrink-0 z-10 overflow-x-auto md:overflow-y-auto scrollbar-hide">
            <div className="hidden md:block mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <SettingsIcon size={24} className="text-gold animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            <div className="flex md:flex-col gap-3 md:gap-4 min-w-max md:min-w-0">
               {categories.map((cat) => (
                 <div key={cat.id} className="relative group">
                   <button
                     onClick={() => setActiveCategory(cat.id)}
                     className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${
                       activeCategory === cat.id 
                       ? 'bg-gold text-black shadow-[4px_8px_24px_rgba(212,175,55,0.3)] scale-110' 
                       : 'text-white/30 hover:bg-white/5 hover:text-white hover:scale-105'
                     }`}
                   >
                     <cat.icon size={20} className="md:w-6 md:h-6" />
                     
                     {/* Indicator dot */}
                     {activeCategory === cat.id && (
                       <motion.div 
                         layoutId="activeDot"
                         className="absolute -bottom-1 md:bottom-auto md:-right-1 w-4 h-1 md:w-1.5 md:h-6 bg-gold rounded-full"
                         transition={{ type: "spring", stiffness: 300, damping: 30 }}
                       />
                     )}
                   </button>

                   {/* Tooltip Label (Desktop Only) */}
                   <div className="hidden md:block absolute left-full ml-4 px-3 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl">
                      {cat.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-8 border-transparent border-r-white" />
                   </div>
                 </div>
               ))}
            </div>

            <div className="mt-auto hidden md:block pb-4">
               <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c10] min-h-0">
             <div className="hidden md:flex items-center justify-end p-6 pr-8 shrink-0">
                <button 
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 min-h-0 relative scroll-smooth custom-scrollbar">
                <div className="max-w-2xl mx-auto md:mx-0">
                   <div className="mb-10">
                      <h3 className="text-3xl md:text-4xl font-black text-white/90 mb-2 capitalize">{t[activeCategory]}</h3>
                      <p className="text-white/30 text-sm md:text-base">Configure your {activeCategory} preferences and manage your account details.</p>
                   </div>
                   
                   {renderContent()}
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
