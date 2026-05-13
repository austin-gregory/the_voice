/**
 * Game State Manager
 * LOADING -> MENU -> PLAYING -> MONSTER_ENCOUNTER -> LETTER_PUZZLE -> WIN -> LOSE
 */

const STATES = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  MONSTER_ENCOUNTER: 'MONSTER_ENCOUNTER',
  LETTER_PUZZLE: 'LETTER_PUZZLE',
  WIN: 'WIN',
  LOSE: 'LOSE',
};

class GameStateManager {
  constructor() {
    this.currentState = STATES.LOADING;
    this.previousState = null;
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  setState(newState) {
    if (!STATES[newState]) {
      console.warn(`GameState: Unknown state "${newState}"`);
      return;
    }
    if (this.currentState === newState) return;

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;

    this.emit(`exit:${oldState}`, { from: oldState, to: newState });
    this.emit(`enter:${newState}`, { from: oldState, to: newState });
    this.emit('change', { from: oldState, to: newState });
  }

  is(state) {
    return this.currentState === state;
  }

  get state() {
    return this.currentState;
  }
}

const gameState = new GameStateManager();

export { gameState, STATES };
