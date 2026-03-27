import { useEffect, useState } from 'react';
import BattlePage from './components/BattlePage';
import CreditsPage from './components/CreditsPage';
import HomePage from './components/HomePage';
import WinPage from './components/WinPage';
import { advanceBattleMessage, createInitialBattleState, resolvePlayerMove } from './game/battleEngine';
import { getCharacter } from './game/characters';
import type { BattleState } from './game/types';

type Page = 'home' | 'battle' | 'credits' | 'win';

const PAGES: Record<string, Page> = {
  HOME: 'home',
  BATTLE: 'battle',
  CREDITS: 'credits',
  WIN: 'win'
};

const SHUSH_MAN = getCharacter('shush-man');
const EXIT_WOMEN = getCharacter('exit-women');

if (!SHUSH_MAN || !EXIT_WOMEN) {
  throw new Error('Character library is missing required entries.');
}

export default function App() {
  const [page, setPage] = useState<Page>(PAGES.HOME);
  const [battle, setBattle] = useState<BattleState>(() => createInitialBattleState(SHUSH_MAN));
  const [lastWonCharacterName, setLastWonCharacterName] = useState<string>('Shush man');

  useEffect(() => {
    if (page === PAGES.BATTLE && battle.phase === 'finished' && battle.result?.winner === 'player') {
      setLastWonCharacterName(battle.character.name);
      setPage(PAGES.WIN);
    }
  }, [battle, page]);

  const goHome = (): void => setPage(PAGES.HOME);

  const startShushManBattle = (): void => {
    setBattle(createInitialBattleState(SHUSH_MAN));
    setPage(PAGES.BATTLE);
  };

  const startExitWomenBattle = (): void => {
    setBattle(createInitialBattleState(EXIT_WOMEN));
    setPage(PAGES.BATTLE);
  };

  const replayBattle = (): void => {
    setBattle(createInitialBattleState(battle.character));
    setPage(PAGES.BATTLE);
  };

  const onMove = (moveId: string): void => {
    setBattle((current) => resolvePlayerMove(current, moveId));
  };

  const onAdvance = (): void => {
    setBattle((current) => advanceBattleMessage(current));
  };

  return (
    <main className="app-shell">
      {page === PAGES.HOME && (
        <HomePage
          onBattleShushMan={startShushManBattle}
          onBattleExitWomen={startExitWomenBattle}
          onCredits={() => setPage(PAGES.CREDITS)}
        />
      )}

      {page === PAGES.BATTLE && (
        <BattlePage
          battle={battle}
          onPlayAgain={replayBattle}
          onHome={goHome}
          onMove={onMove}
          onAdvance={onAdvance}
        />
      )}

      {page === PAGES.CREDITS && <CreditsPage onHome={goHome} />}
      {page === PAGES.WIN && <WinPage onHome={goHome} characterName={lastWonCharacterName} />}
    </main>
  );
}
