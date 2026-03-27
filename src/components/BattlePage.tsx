import { useEffect, useMemo, useState } from 'react';
import { getEnemyMoves, getPlayerMoves, MOVES_WITH_REPEAT_RESTRICTION } from '../game/battleEngine';
import type { BattleState } from '../game/types';
import Gauge from './Gauge';

type BattlePageProps = {
  battle: BattleState;
  onPlayAgain: () => void;
  onHome: () => void;
  onMove: (moveId: string) => void;
  onAdvance: () => void;
};

export default function BattlePage({ battle, onPlayAgain, onHome, onMove, onAdvance }: BattlePageProps) {
  const playerMoves = useMemo(() => getPlayerMoves(battle.character), [battle.character]);
  const enemyMoves = useMemo(() => getEnemyMoves(battle.character), [battle.character]);
  const [reboundPickerOpen, setReboundPickerOpen] = useState(false);
  const [noRepeatNotice, setNoRepeatNotice] = useState<string | null>(null);
  const currentMessage = battle.messageQueue[0] ?? null;
  const enemyPosture = battle.enemy.standing ? 'standing' : 'sitting';
  const enemyAnimation = currentMessage?.enemyAnimation ?? 'idle';
  const enemySprite = battle.character.sprites[enemyPosture][enemyAnimation] ?? battle.character.sprites[enemyPosture].idle;
  const showGreekBurst = currentMessage?.enemyEffect === 'greek-burst';
  const reboundTargetLabel =
    battle.player.reboundTargetMoveId ? enemyMoves.find((move) => move.id === battle.player.reboundTargetMoveId)?.label : null;

  useEffect(() => {
    if (battle.phase !== 'player_choice') {
      setReboundPickerOpen(false);
    }
  }, [battle.phase, battle.turn]);

  useEffect(() => {
    setNoRepeatNotice(null);
  }, [battle.turn]);

  const onChooseMove = (moveId: string): void => {
    if (MOVES_WITH_REPEAT_RESTRICTION.includes(moveId) && battle.player.lastMoveId === moveId) {
      setNoRepeatNotice("You can't use this move twice in a row!");
      return;
    }

    setNoRepeatNotice(null);

    if (moveId === 'rebound') {
      setReboundPickerOpen(true);
      return;
    }

    onMove(moveId);
  };

  const onChooseReboundTarget = (enemyMoveId: string): void => {
    setReboundPickerOpen(false);
    onMove(`rebound:${enemyMoveId}`);
  };

  return (
    <section className="screen battle-screen">
      <header className="battle-header">
        <h2>Battle: {battle.character.name}</h2>
        <button type="button" className="pixel-button small" onClick={onHome}>
          Home
        </button>
      </header>

      <div className="battle-hud">
        <Gauge value={battle.display.playerCortisol} label="Your Cortisol" />
        <Gauge value={battle.display.enemyCortisol} label={`${battle.character.name} Cortisol`} />
      </div>

      <div className="battle-stage">
        <div className="enemy-stage-slot">
          {showGreekBurst && (
            <div className="greek-burst-overlay" aria-label="Unintelligible greek visual effect">
              ΑΒΓΔ ΕΖΗ ΘΙΚ ΛΜΝ ΞΟΠ ΡΣΤ ΥΦΧ ΨΩ
            </div>
          )}
          <img src={enemySprite} alt={`${battle.character.name} ${enemyPosture} ${enemyAnimation} sprite`} className="enemy-sprite" />
        </div>

        <div className="battle-box">
          {battle.phase === 'player_choice' && (
            <div className="moves-panel">
              {!reboundPickerOpen && (
                <>
                  <h3>Choose your move</h3>
                  <div className="moves-grid">
                    {playerMoves.map((move) => (
                      <button key={move.id} type="button" className="pixel-button move" onClick={() => onChooseMove(move.id)}>
                        {move.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {reboundPickerOpen && (
                <>
                  <h3>Choose attack to rebound</h3>
                  <div className="moves-grid">
                    {enemyMoves.map((move) => (
                      <button
                        key={move.id}
                        type="button"
                        className="pixel-button move"
                        onClick={() => onChooseReboundTarget(move.id)}
                      >
                        {move.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="pixel-button move" onClick={() => setReboundPickerOpen(false)}>
                    Cancel
                  </button>
                </>
              )}
              {reboundTargetLabel && <p className="player-note">Rebound armed for: {reboundTargetLabel}</p>}
              {noRepeatNotice && <p className="player-note">{noRepeatNotice}</p>}
            </div>
          )}

          {battle.phase === 'message_queue' && currentMessage && (
            <div className="message-panel">
              <p>{currentMessage.text}</p>
              <button type="button" className="pixel-button" onClick={onAdvance}>
                Next
              </button>
            </div>
          )}

          {battle.phase === 'finished' && battle.result?.loser === 'player' && (
            <div className="end-panel lose">
              <h3>You lost.</h3>
              <p>You were only {battle.result.pointsAway} cortisol points away.</p>
              <div className="end-buttons">
                <button type="button" className="pixel-button" onClick={onPlayAgain}>
                  Play again
                </button>
                <button type="button" className="pixel-button" onClick={onHome}>
                  Home
                </button>
              </div>
            </div>
          )}
          <p className="player-note">You have no sprite and intentionally offscreen.</p>
        </div>
      </div>
    </section>
  );
}
