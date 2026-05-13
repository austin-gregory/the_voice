/**
 * Letter Puzzle UI
 * Final room puzzle where player arranges collected letters to spell NATHAN.
 * Full screen overlay with aged paper aesthetic, z-index 1500.
 */

import { gameState, STATES } from '../systems/gameState.js';

class LetterPuzzle {
  constructor() {
    this.overlay = null;
    this.blanks = [];
    this.letterButtons = [];
    this.filledLetters = [];
    this.targetName = 'NATHAN';
    this.availableLetters = [];
    this.isActive = false;

    // Callbacks
    this.onCorrect = null;

    this._createUI();
  }

  _createUI() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(20, 15, 10, 0.95)',
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '1500',
    });

    // Paper container
    const paper = document.createElement('div');
    Object.assign(paper.style, {
      backgroundColor: 'rgba(210, 190, 160, 0.15)',
      border: '1px solid rgba(210, 190, 160, 0.3)',
      borderRadius: '4px',
      padding: '60px 50px',
      maxWidth: '600px',
      width: '90%',
      textAlign: 'center',
    });
    this.overlay.appendChild(paper);

    // Header
    const header = document.createElement('p');
    header.textContent = 'Dear';
    Object.assign(header.style, {
      color: 'rgba(210, 190, 160, 0.6)',
      fontSize: '20px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'italic',
      marginBottom: '20px',
      userSelect: 'none',
    });
    paper.appendChild(header);

    // Blanks container
    const blanksContainer = document.createElement('div');
    Object.assign(blanksContainer.style, {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '40px',
    });
    paper.appendChild(blanksContainer);

    // 6 blank slots
    this.filledLetters = new Array(6).fill(null);
    for (let i = 0; i < 6; i++) {
      const blank = document.createElement('div');
      Object.assign(blank.style, {
        width: '50px',
        height: '60px',
        border: '2px solid rgba(210, 190, 160, 0.4)',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '32px',
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        color: '#ffffff',
        cursor: 'pointer',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        transition: 'border-color 0.2s',
        userSelect: 'none',
      });

      const idx = i;
      blank.addEventListener('click', () => this._removeFromSlot(idx));

      this.blanks.push(blank);
      blanksContainer.appendChild(blank);
    }

    // Comma
    const comma = document.createElement('span');
    comma.textContent = ',';
    Object.assign(comma.style, {
      color: 'rgba(210, 190, 160, 0.6)',
      fontSize: '32px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      alignSelf: 'flex-end',
      marginLeft: '-5px',
    });
    blanksContainer.appendChild(comma);

    // Divider
    const divider = document.createElement('hr');
    Object.assign(divider.style, {
      border: 'none',
      borderTop: '1px solid rgba(210, 190, 160, 0.2)',
      margin: '20px 0 30px',
    });
    paper.appendChild(divider);

    // Label
    const label = document.createElement('p');
    label.textContent = 'Collected letters:';
    Object.assign(label.style, {
      color: 'rgba(210, 190, 160, 0.4)',
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      marginBottom: '15px',
      userSelect: 'none',
    });
    paper.appendChild(label);

    // Letter buttons container
    this.lettersContainer = document.createElement('div');
    Object.assign(this.lettersContainer.style, {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '30px',
      flexWrap: 'wrap',
    });
    paper.appendChild(this.lettersContainer);

    // Submit button
    this.submitBtn = document.createElement('button');
    this.submitBtn.textContent = 'Submit';
    Object.assign(this.submitBtn.style, {
      padding: '12px 40px',
      backgroundColor: 'transparent',
      color: 'rgba(210, 190, 160, 0.7)',
      border: '1px solid rgba(210, 190, 160, 0.4)',
      borderRadius: '4px',
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '10px',
      pointerEvents: 'auto',
    });
    this.submitBtn.addEventListener('mouseenter', () => {
      this.submitBtn.style.backgroundColor = 'rgba(210, 190, 160, 0.1)';
      this.submitBtn.style.color = '#ffffff';
    });
    this.submitBtn.addEventListener('mouseleave', () => {
      this.submitBtn.style.backgroundColor = 'transparent';
      this.submitBtn.style.color = 'rgba(210, 190, 160, 0.7)';
    });
    this.submitBtn.addEventListener('click', () => this._submit());
    paper.appendChild(this.submitBtn);

    document.body.appendChild(this.overlay);
  }

  show(letters) {
    this.isActive = true;

    // Scramble letters
    this.availableLetters = [...letters];
    for (let i = this.availableLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.availableLetters[i], this.availableLetters[j]] =
        [this.availableLetters[j], this.availableLetters[i]];
    }

    // Reset blanks
    this.filledLetters = new Array(6).fill(null);
    this.blanks.forEach((blank) => { blank.textContent = ''; });

    this._renderLetterButtons();

    this.overlay.style.display = 'flex';

    // Exit pointer lock so user can click
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    gameState.setState(STATES.LETTER_PUZZLE);
  }

  _renderLetterButtons() {
    this.lettersContainer.innerHTML = '';
    this.letterButtons = [];

    this.availableLetters.forEach((letter, idx) => {
      const btn = document.createElement('div');
      Object.assign(btn.style, {
        width: '50px',
        height: '60px',
        border: '2px solid rgba(210, 190, 160, 0.5)',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '28px',
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        color: '#ffffff',
        cursor: 'pointer',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s',
        userSelect: 'none',
        pointerEvents: 'auto',
      });
      btn.textContent = letter;
      btn.dataset.idx = idx;

      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'rgba(210, 190, 160, 0.5)';
      });
      btn.addEventListener('click', () => this._placeLetterFromButton(idx));

      this.letterButtons.push(btn);
      this.lettersContainer.appendChild(btn);
    });
  }

  _placeLetterFromButton(buttonIdx) {
    const btn = this.letterButtons[buttonIdx];
    if (!btn || btn.style.visibility === 'hidden') return;

    const slotIdx = this.filledLetters.indexOf(null);
    if (slotIdx === -1) return;

    this.filledLetters[slotIdx] = {
      char: this.availableLetters[buttonIdx],
      buttonIdx,
    };
    this.blanks[slotIdx].textContent = this.availableLetters[buttonIdx];

    btn.style.visibility = 'hidden';
  }

  _removeFromSlot(slotIdx) {
    const entry = this.filledLetters[slotIdx];
    if (!entry) return;

    const btn = this.letterButtons[entry.buttonIdx];
    if (btn) btn.style.visibility = 'visible';

    this.filledLetters[slotIdx] = null;
    this.blanks[slotIdx].textContent = '';
  }

  _submit() {
    const answer = this.filledLetters.map((e) => (e ? e.char : '')).join('');

    if (answer === this.targetName) {
      this.isActive = false;
      this.overlay.style.display = 'none';
      if (this.onCorrect) this.onCorrect();
    } else {
      // Shake animation for wrong answer
      this.blanks.forEach((blank) => {
        blank.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => { blank.style.animation = ''; }, 300);
      });
    }
  }

  hide() {
    this.isActive = false;
    this.overlay.style.display = 'none';
  }

  dispose() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

export { LetterPuzzle };
