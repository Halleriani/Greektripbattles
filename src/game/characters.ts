import type { BattleCharacter } from './types';

const shushMan: BattleCharacter = {
  id: 'shush-man',
  name: 'Shush man',
  playerMoveIds: ['doNothing', 'talk', 'rebound', 'goOnPhone'],
  enemyMoveIds: ['shush', 'stare', 'unintelligibleGreek'],
  sprites: {
    sitting: {
      idle: '/sprites/sittingdownneutral.png',
      attack: '/sprites/sittingdownshush.png',
      hit: '/sprites/sittingdownneutral.png',
      stare: '/sprites/sittingdownneutral.png',
      greek: '/sprites/unitelligblegreek.gcse'
    },
    standing: {
      idle: '/sprites/standingupneutral.png',
      attack: '/sprites/standingupshush.png',
      hit: '/sprites/standingupneutral.png',
      stare: '/sprites/standingupstare.png',
      greek: '/sprites/unitelligblegreek.gcse'
    }
  },
  ai: {
    chooseEnemyMove: ({ state, rng }) => {
      if (state.flags.playerUsedPhoneThisTurn && rng() < 0.5) {
        return 'stare';
      }

      if (!state.enemy.standing) {
        return 'shush';
      }

      if (state.enemy.unintelligibleGreekCooldown > 0) {
        return 'shush';
      }

      // Standing state favors Shush more often, with a smaller Unintelligible Greek chance.
      return rng() < 0.35 ? 'unintelligibleGreek' : 'shush';
    }
  }
};

const exitWomen: BattleCharacter = {
  id: 'exit-women',
  name: 'Please make your way to the exit Women',
  playerMoveIds: ['doNothing', 'talk', 'rebound', 'goOnPhone'],
  enemyMoveIds: ['askExit', 'whistle', 'throwOffMountain'],
  sprites: {
    sitting: {
      idle: '/placeholders/exit-woman-placeholder.svg',
      attack: '/placeholders/exit-woman-placeholder.svg',
      hit: '/placeholders/exit-woman-placeholder.svg',
      stare: '/placeholders/exit-woman-placeholder.svg',
      greek: '/placeholders/exit-woman-placeholder.svg'
    },
    standing: {
      idle: '/placeholders/exit-woman-placeholder.svg',
      attack: '/placeholders/exit-woman-placeholder.svg',
      hit: '/placeholders/exit-woman-placeholder.svg',
      stare: '/placeholders/exit-woman-placeholder.svg',
      greek: '/placeholders/exit-woman-placeholder.svg'
    }
  },
  ai: {
    chooseEnemyMove: ({ state, rng }) => {
      if (state.enemy.angry && rng() < 0.42) {
        return 'throwOffMountain';
      }

      if (state.flags.exitDemandTurnsLeft === 0 && rng() < 0.5) {
        return 'askExit';
      }

      return 'whistle';
    }
  }
};

export const CHARACTER_LIBRARY: Record<string, BattleCharacter> = {
  'shush-man': shushMan,
  'exit-women': exitWomen
};

export const getCharacter = (characterId: string): BattleCharacter => CHARACTER_LIBRARY[characterId];
