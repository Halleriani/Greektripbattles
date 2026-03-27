export type EnemyAnimation = 'idle' | 'attack' | 'hit' | 'stare' | 'greek';

export type EnemyEffect = 'greek-burst' | null;

export type BattlePhase = 'player_choice' | 'message_queue' | 'finished';

export type Winner = 'player' | 'enemy';

export interface BattleResult {
  winner: Winner;
  loser: Winner;
  pointsAway?: number;
}

export interface BattleMessage {
  text: string;
  enemyAnimation: EnemyAnimation;
  enemyEffect?: EnemyEffect;
  reveal?: {
    playerCortisol: number;
    enemyCortisol: number;
  };
}

export interface PlayerState {
  cortisol: number;
  phoneShield: boolean;
  reboundTargetMoveId: string | null;
}

export interface EnemyState {
  cortisol: number;
  standing: boolean;
  angry: boolean;
  lastMoveId: string | null;
  unintelligibleGreekCooldown: number;
  skipNextTurn: boolean;
}

export interface BattleFlags {
  playerUsedPhoneThisTurn: boolean;
  exitDemandTurnsLeft: number;
  whistleLockActive: boolean;
  ignoredExitDemandCount: number;
}

export interface CharacterSprites {
  sitting: Record<EnemyAnimation, string>;
  standing: Record<EnemyAnimation, string>;
}

export interface BattleCharacter {
  id: string;
  name: string;
  playerMoveIds: string[];
  enemyMoveIds: string[];
  sprites: CharacterSprites;
  ai?: {
    chooseEnemyMove: (args: {
      state: BattleState;
      rng: () => number;
      enemyMoves: string[];
    }) => string;
  };
}

export interface BattleState {
  character: BattleCharacter;
  turn: number;
  phase: BattlePhase;
  player: PlayerState;
  enemy: EnemyState;
  flags: BattleFlags;
  display: {
    playerCortisol: number;
    enemyCortisol: number;
  };
  messageQueue: BattleMessage[];
  result: BattleResult | null;
}
