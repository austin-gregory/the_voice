/**
 * QTE (Quick Time Event) System
 * 4 random keys, 1.5s window each.
 * All correct -> monster dissolves. Any miss or timeout -> LOSE.
 */

import { gameState, STATES } from './gameState.js';
import { audioSystem } from './audio.js';

const LETTER_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

class QTESystem {
  constructor() {
    this.isActive = false;
    this.keys = [];
    this.currentIndex = 0;
    this.timePerKey = 1.5;
    this.elapsed = 0;

    // UI elements
    this.overlay = null;
    this.keyDisplay = null;
    this.progressBar = null;
    this.statusText = null;
    this.heartbeatInterval = null;

    // Callbacks
    this.onSuccess = null;
    this.onFail = null;

    this._createUI();
    this._bindInput();
  }

  _createUI() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '1000',
      pointerEvents: 'none',
    });

    this.keyDisplay = document.createElement('div');
    Object.assign(this.keyDisplay.style, {
      color: '#ffffff',
      fontSize: '120px',
      fontFamily: '"Courier New", monospace',
      fontWeight: 'bold',
      textShadow: '0 0 20px rgba(255, 100, 100, 0.8), 0 0 40px rgba(255, 50, 50, 0.5)',
      marginBottom: '30px',
      letterSpacing: '4px',
      userSelect: 'none',
    });
    this.overlay.appendChild(this.keyDisplay);

    const progressContainer = document.createElement('div');
    Object.assign(progressContainer.style, {
      width: '200px',
      height: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      overflow: 'hidden',
    });

    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      width: '100%',
      height: '100%',
      backgroundColor: '#ff4444',
      borderRadius: '4px',
      transition: 'none',
    });
    progressContainer.appendChild(this.progressBar);
    this.overlay.appendChild(progressContainer);

    this.statusText = document.createElement('div');
    Object.assign(this.statusText.style, {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      marginTop: '20px',
      userSelect: 'none',
    });
    this.overlay.appendChild(this.statusText);

    document.body.appendChild(this.overlay);
  }

  _bindInput() {
    this._keyHandler = (event) => {
      if (!this.isActive) return;

      const pressed = event.key.toUpperCase();
      const expected = this.keys[this.currentIndex];

      if (pressed === expected) {
        audioSystem.playQTESuccess();
        this.currentIndex++;
        this.elapsed = 0;

        if (this.currentIndex >= this.keys.length) {
          this._succeed();
        } else {
          this._showCurrentKey();
        }
      } else if (pressed.length === 1 && pressed >= 'A' && pressed <= 'Z') {
        this._fail();
      }
    };

    document.addEventListener('keydown', this._keyHandler);
  }

  start() {
    this.isActive = true;
    this.currentIndex = 0;
    this.elapsed = 0;

    this.keys = [];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * LETTER_POOL.length);
      this.keys.push(LETTER_POOL[idx]);
    }

    this.overlay.style.display = 'flex';
    this._showCurrentKey();

    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) audioSystem.playHeartbeat();
    }, 800);

    gameState.setState(STATES.MONSTER_ENCOUNTER);
  }

  _showCurrentKey() {
    this.keyDisplay.textContent = this.keys[this.currentIndex];
    this.progressBar.style.width = '100%';
    this.statusText.textContent = `${this.currentIndex + 1} / ${this.keys.length}`;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    this.elapsed += deltaTime;

    const remaining = 1 - (this.elapsed / this.timePerKey);
    this.progressBar.style.width = `${Math.max(0, remaining * 100)}%`;

    if (remaining > 0.5) {
      this.progressBar.style.backgroundColor = '#44ff44';
    } else if (remaining > 0.25) {
      this.progressBar.style.backgroundColor = '#ffaa00';
    } else {
      this.progressBar.style.backgroundColor = '#ff4444';
    }

    if (this.elapsed >= this.timePerKey) {
      this._fail();
    }
  }

  _succeed() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    clearInterval(this.heartbeatInterval);
    if (this.onSuccess) this.onSuccess();
  }

  _fail() {
    this.isActive = false;
    audioSystem.playQTEFail();

    this.keyDisplay.style.color = '#ff0000';
    this.keyDisplay.textContent = 'X';

    clearInterval(this.heartbeatInterval);

    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.keyDisplay.style.color = '#ffffff';
      if (this.onFail) this.onFail();
    }, 800);
  }

  dispose() {
    document.removeEventListener('keydown', this._keyHandler);
    clearInterval(this.heartbeatInterval);
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export { QTESystem };
