import { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { SocialProvider } from './context/SocialContext';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { BilliardsGame } from './screens/BilliardsGame';
import { SnakeLadderGame } from './screens/SnakeLadderGame';
import { DominoGame } from './screens/DominoGame';
import { UnoGame } from './screens/UnoGame';
import { KurdishOkeyGame } from './screens/KurdishOkeyGame';
import { AnimatePresence } from 'motion/react';
import { translations } from './translations';
import { MultiplayerGameWrapper } from './components/MultiplayerGameWrapper';

type ViewState = {
  id: 'home' | 'billiards' | 'snake_ladder' | 'domino' | 'uno' | 'kurdish_okey';
  config?: any;
};

function AppContent() {
  const { user, loading, language } = useAppContext();
  const [view, setView] = useState<ViewState>({ id: 'home' });

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-game-bg">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderGame = () => {
    const onBack = () => setView({ id: 'home' });
    
    switch (view.id) {
      case 'billiards':
        return <BilliardsGame onBack={onBack} />;
      case 'snake_ladder':
        return <MultiplayerGameWrapper gameId="snake_ladder" config={view.config} onBack={onBack} onStart={() => {}}>
                  <SnakeLadderGame onBack={onBack} mode={view.config} />
               </MultiplayerGameWrapper>;
      case 'domino':
        return <MultiplayerGameWrapper gameId="domino" config={view.config} onBack={onBack} onStart={() => {}}>
                  <DominoGame onBack={onBack} mode={view.config} />
               </MultiplayerGameWrapper>;
      case 'uno':
        return <MultiplayerGameWrapper gameId="uno" config={view.config} onBack={onBack} onStart={() => {}}>
                  <UnoGame onBack={onBack} mode={view.config} />
               </MultiplayerGameWrapper>;
      case 'kurdish_okey':
        return <MultiplayerGameWrapper gameId="kurdish_okey" config={view.config} onBack={onBack} onStart={() => {}}>
                  <KurdishOkeyGame onBack={onBack} mode={view.config} />
               </MultiplayerGameWrapper>;
      default:
        return <HomeScreen onSelectGame={(id, config) => setView({ id: id as any, config })} />;
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-game-bg text-white font-sans">
      <AnimatePresence mode="wait">
        <div key={view.id} className="h-full w-full">
          {renderGame()}
        </div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SocialProvider>
        <AppContent />
      </SocialProvider>
    </AppProvider>
  );
}
