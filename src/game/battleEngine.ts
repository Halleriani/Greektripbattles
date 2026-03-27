import type {
  BattleCharacter,
  BattleMessage,
  BattleResult,
  BattleState,
  EnemyAnimation,
  EnemyEffect
} from './types';

export const MAX_CORTISOL = 100;
const SHUSH_STAND_THRESHOLD = 50;
const PHONE_MOVE_MISS_CHANCE = 0.2;
const EXIT_DEMAND_DELAY_TURNS = 2;
const EXIT_DEMAND_PENALTY = 10;

type RaiseCortisol = (target: 'player' | 'enemy', amount: number) => void;

type PushMessage = (
  text: string,
  enemyAnimation?: EnemyAnimation,
  enemyEffect?: EnemyEffect,
  reveal?: BattleMessage['reveal']
) => void;

type PlayerMoveContext = {
  state: BattleState;
  pushMessage: PushMessage;
  raiseCortisol: RaiseCortisol;
  forceStand: () => void;
  phoneMoveSucceeds: () => boolean;
  getReveal: () => BattleMessage['reveal'];
  selectedEnemyMoveId?: string;
};

type EnemyAttackResult = {
  damage: number;
  blocked: boolean;
  brokeShield: boolean;
  reflected: boolean;
  reflectedDamage: number;
};

type EnemyMoveContext = {
  state: BattleState;
  attackPlayer: (baseDamage: number, ignoresPhoneShield: boolean, enemyMoveId: string) => EnemyAttackResult;
  raiseCortisol: RaiseCortisol;
  pushMessage: PushMessage;
  getReveal: () => BattleMessage['reveal'];
};

type MoveDefinition = {
  id: string;
  label: string;
  execute: (ctx: PlayerMoveContext) => void;
};

type EnemyMoveDefinition = {
  id: string;
  label: string;
  baseDamage: number;
  ignoresPhoneShield: boolean;
  execute: (ctx: EnemyMoveContext) => void;
};

const isShushMan = (state: BattleState): boolean => state.character.id === 'shush-man';
const isExitWomen = (state: BattleState): boolean => state.character.id === 'exit-women';

const getEnemyDamageMultiplier = (state: BattleState): number => {
  let multiplier = 1;

  if (state.enemy.standing) {
    multiplier *= 2;
  }

  if (state.enemy.angry) {
    multiplier *= 2;
  }

  return multiplier;
};

const maybeStandUpAtThreshold = (state: BattleState, forceStand: () => void): void => {
  if (isShushMan(state) && state.enemy.cortisol >= SHUSH_STAND_THRESHOLD) {
    forceStand();
  }
};

export const MOVES_WITH_REPEAT_RESTRICTION: ReadonlyArray<string> = ['rebound', 'goOnPhone'];

export const PLAYER_MOVE_LIBRARY: Record<string, MoveDefinition> = {
  doNothing: {
    id: 'doNothing',
    label: 'Do nothing',
    execute: ({ state, pushMessage, raiseCortisol, forceStand, getReveal }) => {
      if (state.enemy.standing) {
        raiseCortisol('player', 10);
        pushMessage('You do nothing.', 'idle');
        pushMessage('Because he is standing up it makes you nervous. You gain 10 cortisol.', 'idle', null, getReveal());
        return;
      }

      raiseCortisol('enemy', 5);
      raiseCortisol('player', 5);
      pushMessage('You do nothing. Both cortisol levels rise by 5.', 'hit', null, getReveal());
      maybeStandUpAtThreshold(state, forceStand);
    }
  },
  talk: {
    id: 'talk',
    label: 'Talk',
    execute: ({ pushMessage, raiseCortisol, forceStand, state, getReveal }) => {
      raiseCortisol('enemy', 10);
      pushMessage(`You talk. ${state.character.name} gains 10 cortisol.`, 'hit', null, getReveal());
      maybeStandUpAtThreshold(state, forceStand);
    }
  },
  rebound: {
    id: 'rebound',
    label: 'Rebound',
    execute: ({ state, pushMessage, selectedEnemyMoveId }) => {
      if (!selectedEnemyMoveId || !state.character.enemyMoveIds.includes(selectedEnemyMoveId)) {
        pushMessage('Rebound failed because no target attack was selected.', 'idle');
        return;
      }

      state.player.reboundTargetMoveId = selectedEnemyMoveId;
      const moveLabel = ENEMY_MOVE_LIBRARY[selectedEnemyMoveId]?.label ?? selectedEnemyMoveId;
      pushMessage(`Rebound is ready for ${moveLabel}. If it is used, they take half the cortisol instead.`, 'idle');
    }
  },
  goOnPhone: {
    id: 'goOnPhone',
    label: 'Go on your phone',
    execute: ({ state, pushMessage, phoneMoveSucceeds }) => {
      if (!phoneMoveSucceeds()) {
        pushMessage('You try to go on your phone, but you fumble it. Move missed.', 'idle');
        return;
      }

      state.player.phoneShield = true;
      state.flags.playerUsedPhoneThisTurn = true;
      state.flags.shushManStareTimer = 2;
      pushMessage('You go on your phone. You are immune to the next attack unless it is Stare.', 'idle');
    }
  }
};

export const ENEMY_MOVE_LIBRARY: Record<string, EnemyMoveDefinition> = {
  shush: {
    id: 'shush',
    label: 'Shush',
    baseDamage: 10,
    ignoresPhoneShield: false,
    execute: ({ state, attackPlayer, pushMessage, getReveal }) => {
      pushMessage(`${state.character.name} used Shush.`, 'attack');
      const result = attackPlayer(10, false, 'shush');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
      } else if (result.blocked) {
        pushMessage('You blocked it with your phone. The enemy skips the next turn.', 'attack');
      } else {
        pushMessage(`You gained ${result.damage} cortisol.`, 'attack', null, getReveal());
      }
    }
  },
  stare: {
    id: 'stare',
    label: 'Stare',
    baseDamage: 5,
    ignoresPhoneShield: true,
    execute: ({ state, attackPlayer, pushMessage, getReveal }) => {
      pushMessage(`${state.character.name} used Stare.`, 'stare');
      const result = attackPlayer(5, true, 'stare');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
      } else if (result.brokeShield) {
        pushMessage(`It broke through your phone defense. You gained ${result.damage} cortisol.`, 'stare', null, getReveal());
      } else {
        pushMessage(`You gained ${result.damage} cortisol.`, 'stare', null, getReveal());
      }
    }
  },
  unintelligibleGreek: {
    id: 'unintelligibleGreek',
    label: 'Unintelligible Greek',
    baseDamage: 20,
    ignoresPhoneShield: false,
    execute: ({ state, attackPlayer, raiseCortisol, pushMessage, getReveal }) => {
      pushMessage('ΑΥΤΟ ΤΙ ΚΑΝΕΙΣ ΕΔΩ ΡΕ ΠΑΙΔΙ ΜΟΥ?!', 'greek', 'greek-burst');
      pushMessage('He starts staring intensely.', 'stare');
      raiseCortisol('enemy', 10);

      const result = attackPlayer(20, false, 'unintelligibleGreek');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
      } else if (result.blocked) {
        pushMessage('You blocked it with your phone. The enemy skips the next turn.', 'stare');
      } else {
        pushMessage(`You gained ${result.damage} cortisol.`, 'stare', null, getReveal());
      }
    }
  },
  askExit: {
    id: 'askExit',
    label: 'Ask You To Make Your Way To The Exit',
    baseDamage: 5,
    ignoresPhoneShield: false,
    execute: ({ state, attackPlayer, pushMessage, getReveal }) => {
      pushMessage(`${state.character.name} asks you to make your way to the exit.`, 'attack');
      const result = attackPlayer(5, false, 'askExit');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
        return;
      }

      if (result.blocked) {
        pushMessage('You blocked it with your phone. The enemy skips the next turn.', 'attack');
        return;
      }

      state.flags.exitDemandTurnsLeft = EXIT_DEMAND_DELAY_TURNS;
      pushMessage(`You gained ${result.damage} cortisol.`, 'attack', null, getReveal());
      pushMessage('If you do not make your way to the exit within 2 turns, you gain 10 extra cortisol.', 'idle');
    }
  },
  whistle: {
    id: 'whistle',
    label: 'Whistle',
    baseDamage: 10,
    ignoresPhoneShield: false,
    execute: ({ state, attackPlayer, pushMessage, getReveal }) => {
      pushMessage(`${state.character.name} used Whistle.`, 'attack');
      const result = attackPlayer(10, false, 'whistle');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
        return;
      }

      if (result.blocked) {
        pushMessage('You blocked it with your phone. The enemy skips the next turn.', 'attack');
        return;
      }

      state.flags.whistleLockActive = true;
      pushMessage(`You gained ${result.damage} cortisol.`, 'attack', null, getReveal());
      pushMessage('Next turn, if you do anything except Do nothing, you get stopped.', 'idle');
    }
  },
  throwOffMountain: {
    id: 'throwOffMountain',
    label: 'Throw Off Mountain',
    baseDamage: 20,
    ignoresPhoneShield: false,
    execute: ({ state, attackPlayer, pushMessage, getReveal }) => {
      pushMessage(`${state.character.name} used Throw off mountain.`, 'attack');
      const result = attackPlayer(20, false, 'throwOffMountain');

      if (result.reflected) {
        pushMessage(`You reflected it. ${state.character.name} gained ${result.reflectedDamage} cortisol.`, 'hit', null, getReveal());
      } else if (result.blocked) {
        pushMessage('You blocked it with your phone. The enemy skips the next turn.', 'attack');
      } else {
        pushMessage(`You gained ${result.damage} cortisol.`, 'attack', null, getReveal());
      }
    }
  }
};

const cloneBattleState = (state: BattleState): BattleState => ({
  ...state,
  player: { ...state.player },
  enemy: { ...state.enemy },
  flags: { ...state.flags },
  display: { ...state.display },
  messageQueue: [...state.messageQueue],
  result: state.result ? { ...state.result } : null
});

const raiseCortisol = (state: BattleState, target: 'player' | 'enemy', amount: number): void => {
  const current = state[target].cortisol;
  state[target].cortisol = Math.max(0, Math.min(MAX_CORTISOL, current + amount));
};

const evaluateResult = (state: BattleState): BattleResult | null => {
  const playerHigh = state.player.cortisol >= MAX_CORTISOL;
  const enemyHigh = state.enemy.cortisol >= MAX_CORTISOL;

  if (!playerHigh && !enemyHigh) {
    return null;
  }

  if (enemyHigh && !playerHigh) {
    return {
      winner: 'player',
      loser: 'enemy'
    };
  }

  return {
    winner: 'enemy',
    loser: 'player',
    pointsAway: Math.max(0, MAX_CORTISOL - state.enemy.cortisol)
  };
};

export const createInitialBattleState = (character: BattleCharacter): BattleState => ({
  character,
  turn: 1,
  phase: 'player_choice',
  player: {
    cortisol: 0,
    phoneShield: false,
    reboundTargetMoveId: null,
    lastMoveId: null
  },
  enemy: {
    cortisol: 0,
    standing: false,
    angry: false,
    lastMoveId: null,
    unintelligibleGreekCooldown: 0,
    skipNextTurn: false
  },
  flags: {
    playerUsedPhoneThisTurn: false,
    shushManStareTimer: 0,
    exitDemandTurnsLeft: 0,
    whistleLockActive: false,
    ignoredExitDemandCount: 0
  },
  display: {
    playerCortisol: 0,
    enemyCortisol: 0
  },
  messageQueue: [],
  result: null
});

const forceEnemyStand = (state: BattleState, pushMessage: PushMessage): void => {
  if (isShushMan(state) && !state.enemy.standing) {
    state.enemy.standing = true;
    pushMessage('Shush man stands up. His cortisol damage is now doubled.', 'idle');
  }
};

const getAvailableEnemyMoveIds = (state: BattleState): string[] => {
  const enemyMoveIds = state.character.enemyMoveIds;

  if (!isShushMan(state)) {
    return enemyMoveIds;
  }

  const filteredMoveIds = enemyMoveIds.filter((moveId) => moveId !== state.enemy.lastMoveId);
  return filteredMoveIds.length > 0 ? filteredMoveIds : enemyMoveIds;
};

const selectEnemyMoveId = (state: BattleState, rng: () => number = Math.random): string => {
  const character = state.character;
  const availableMoveIds = getAvailableEnemyMoveIds(state);

  if (typeof character.ai?.chooseEnemyMove === 'function') {
    return character.ai.chooseEnemyMove({
      state,
      rng,
      enemyMoves: availableMoveIds
    });
  }

  return availableMoveIds[0] ?? character.enemyMoveIds[0];
};

const sanitizeEnemyMoveId = (state: BattleState, moveId: string): string => {
  const availableMoveIds = getAvailableEnemyMoveIds(state);
  const fallbackMoveId = availableMoveIds[0] ?? state.character.enemyMoveIds[0] ?? 'shush';

  if (!state.character.enemyMoveIds.includes(moveId)) {
    return fallbackMoveId;
  }

  if (moveId === 'unintelligibleGreek' && state.enemy.unintelligibleGreekCooldown > 0) {
    return fallbackMoveId;
  }

  if (moveId === 'throwOffMountain' && !state.enemy.angry) {
    return fallbackMoveId;
  }

  return moveId;
};

const applyEnemyCooldownAfterMove = (state: BattleState, enemyMoveId: string): void => {
  if (enemyMoveId === 'unintelligibleGreek') {
    state.enemy.unintelligibleGreekCooldown = 1;
    return;
  }

  if (state.enemy.unintelligibleGreekCooldown > 0) {
    state.enemy.unintelligibleGreekCooldown -= 1;
  }
};

const parsePlayerMoveSelection = (rawMoveId: string): { baseMoveId: string; selectedEnemyMoveId?: string } => {
  if (rawMoveId.startsWith('rebound:')) {
    return {
      baseMoveId: 'rebound',
      selectedEnemyMoveId: rawMoveId.slice('rebound:'.length)
    };
  }

  return { baseMoveId: rawMoveId };
};

const processExitDemandAfterPlayerAction = (
  state: BattleState,
  performedMoveId: string | null,
  pushMessage: PushMessage,
  getReveal: () => BattleMessage['reveal']
): void => {
  if (!isExitWomen(state) || state.flags.exitDemandTurnsLeft <= 0) {
    return;
  }

  if (performedMoveId === 'doNothing') {
    state.flags.exitDemandTurnsLeft = 0;
    pushMessage('You made your way to the exit in time.', 'idle');
    return;
  }

  state.flags.exitDemandTurnsLeft -= 1;

  if (state.flags.exitDemandTurnsLeft > 0) {
    return;
  }

  const penalty = state.enemy.angry ? EXIT_DEMAND_PENALTY * 2 : EXIT_DEMAND_PENALTY;
  raiseCortisol(state, 'player', penalty);
  state.flags.ignoredExitDemandCount += 1;
  pushMessage(`You did not make your way to the exit in time. You gained ${penalty} cortisol.`, 'attack', null, getReveal());

  if (!state.enemy.angry && state.flags.ignoredExitDemandCount >= 2) {
    state.enemy.angry = true;
    pushMessage('She gets angry. Her attacks now do double damage.', 'attack');
  }
};

export const resolvePlayerMove = (
  previousState: BattleState,
  playerMoveId: string,
  rng: () => number = Math.random
): BattleState => {
  if (previousState.phase !== 'player_choice') {
    return previousState;
  }

  const state = cloneBattleState(previousState);
  state.flags.playerUsedPhoneThisTurn = false;

  const getReveal = (): BattleMessage['reveal'] => ({
    playerCortisol: state.player.cortisol,
    enemyCortisol: state.enemy.cortisol
  });

  const localMessages: BattleMessage[] = [];
  const pushMessage: PushMessage = (text, enemyAnimation = 'idle', enemyEffect = null, reveal): void => {
    localMessages.push({ text, enemyAnimation, enemyEffect, reveal });
  };

  const attackPlayer = (
    baseDamage: number,
    ignoresPhoneShield: boolean,
    enemyMoveId: string
  ): EnemyAttackResult => {
    const multiplier = getEnemyDamageMultiplier(state);
    const damage = baseDamage * multiplier;

    if (state.player.reboundTargetMoveId === enemyMoveId) {
      state.player.reboundTargetMoveId = null;
      const reflectedDamage = Math.floor(damage / 2);
      raiseCortisol(state, 'enemy', reflectedDamage);
      return { damage: 0, blocked: false, brokeShield: false, reflected: true, reflectedDamage };
    }

    if (state.player.phoneShield) {
      state.player.phoneShield = false;

      if (!ignoresPhoneShield) {
        state.enemy.skipNextTurn = true;
        return { damage: 0, blocked: true, brokeShield: false, reflected: false, reflectedDamage: 0 };
      }

      raiseCortisol(state, 'player', damage);
      return { damage, blocked: false, brokeShield: true, reflected: false, reflectedDamage: 0 };
    }

    raiseCortisol(state, 'player', damage);
    return { damage, blocked: false, brokeShield: false, reflected: false, reflectedDamage: 0 };
  };

  const forceStand = (): void => forceEnemyStand(state, pushMessage);

  const parsedMove = parsePlayerMoveSelection(playerMoveId);
  const moveDefinition = PLAYER_MOVE_LIBRARY[parsedMove.baseMoveId];
  const canUseMove = state.character.playerMoveIds.includes(parsedMove.baseMoveId);

  if (!moveDefinition || !canUseMove) {
    return previousState;
  }

  if (MOVES_WITH_REPEAT_RESTRICTION.includes(parsedMove.baseMoveId) && parsedMove.baseMoveId === state.player.lastMoveId) {
    return previousState;
  }

  let performedMoveId: string | null = parsedMove.baseMoveId;

  if (state.flags.whistleLockActive) {
    state.flags.whistleLockActive = false;

    if (parsedMove.baseMoveId !== 'doNothing') {
      performedMoveId = null;
      pushMessage('The whistle stops you from moving. Only Do nothing works this turn.', 'attack');
    }
  }

  const phoneMoveSucceeds = (): boolean => rng() >= PHONE_MOVE_MISS_CHANCE;

  if (performedMoveId) {
    moveDefinition.execute({
      state,
      pushMessage,
      raiseCortisol: (target, amount) => raiseCortisol(state, target, amount),
      forceStand,
      phoneMoveSucceeds,
      getReveal,
      selectedEnemyMoveId: parsedMove.selectedEnemyMoveId
    });
    state.player.lastMoveId = parsedMove.baseMoveId;
  }

  processExitDemandAfterPlayerAction(state, performedMoveId, pushMessage, getReveal);
  maybeStandUpAtThreshold(state, forceStand);

  let result = evaluateResult(state);

  if (!result) {
    if (state.enemy.skipNextTurn) {
      state.enemy.skipNextTurn = false;
      state.enemy.lastMoveId = null;
      applyEnemyCooldownAfterMove(state, 'skip');
      pushMessage(`${state.character.name} is distracted by your phone and skips this turn.`, 'idle');
    } else {
      const desiredEnemyMoveId =
        isShushMan(state) && state.flags.shushManStareTimer === 1 ? 'stare' : selectEnemyMoveId(state, rng);
      const enemyMoveId = sanitizeEnemyMoveId(state, desiredEnemyMoveId);
      const fallbackMoveId = state.character.enemyMoveIds[0] ?? 'shush';
      const enemyMoveDefinition = ENEMY_MOVE_LIBRARY[enemyMoveId] ?? ENEMY_MOVE_LIBRARY[fallbackMoveId] ?? ENEMY_MOVE_LIBRARY.shush;
      state.enemy.lastMoveId = enemyMoveDefinition.id;

      enemyMoveDefinition.execute({
        state,
        attackPlayer,
        raiseCortisol: (target, amount) => raiseCortisol(state, target, amount),
        pushMessage,
        getReveal
      });

      if (isShushMan(state) && state.flags.shushManStareTimer > 0) {
        state.flags.shushManStareTimer -= 1;
      }

      applyEnemyCooldownAfterMove(state, enemyMoveDefinition.id);
      maybeStandUpAtThreshold(state, forceStand);
    }

    result = evaluateResult(state);
  }

  state.turn += 1;
  state.messageQueue = localMessages;
  state.result = result;
  state.phase = localMessages.length > 0 ? 'message_queue' : result ? 'finished' : 'player_choice';

  if (localMessages.length === 0) {
    state.display.playerCortisol = state.player.cortisol;
    state.display.enemyCortisol = state.enemy.cortisol;
  }

  return state;
};

export const advanceBattleMessage = (previousState: BattleState): BattleState => {
  if (previousState.phase !== 'message_queue') {
    return previousState;
  }

  const state = cloneBattleState(previousState);
  const messageThatWasRead = state.messageQueue[0];

  if (messageThatWasRead?.reveal) {
    state.display.playerCortisol = messageThatWasRead.reveal.playerCortisol;
    state.display.enemyCortisol = messageThatWasRead.reveal.enemyCortisol;
  }

  state.messageQueue = state.messageQueue.slice(1);

  if (state.messageQueue.length > 0) {
    return state;
  }

  state.display.playerCortisol = state.player.cortisol;
  state.display.enemyCortisol = state.enemy.cortisol;
  state.phase = state.result ? 'finished' : 'player_choice';
  return state;
};

export const getPlayerMoves = (character: BattleCharacter): Array<{ id: string; label: string }> =>
  character.playerMoveIds
    .map((moveId) => PLAYER_MOVE_LIBRARY[moveId])
    .filter(Boolean)
    .map(({ id, label }) => ({ id, label }));

export const getEnemyMoves = (character: BattleCharacter): Array<{ id: string; label: string }> =>
  character.enemyMoveIds
    .map((moveId) => ENEMY_MOVE_LIBRARY[moveId])
    .filter(Boolean)
    .map(({ id, label }) => ({ id, label }));

export const getEnemyMoveLabel = (moveId: string): string => ENEMY_MOVE_LIBRARY[moveId]?.label ?? moveId;
