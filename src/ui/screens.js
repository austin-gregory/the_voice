/**
 * Game Screens - Start, Win, and Lose screens
 * z-index 2000
 */

class GameScreens {
  constructor() {
    this.startScreen = null;
    this.winScreen = null;
    this.loseScreen = null;

    // Callbacks
    this.onStartClick = null;

    this._injectAnimations();
    this._createStartScreen();
    this._createWinScreen();
    this._createLoseScreen();
  }

  _injectAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.8; }
      }
      @keyframes glitch {
        0% { transform: translate(0); filter: none; }
        20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
        40% { transform: translate(2px, -1px); filter: saturate(200%); }
        60% { transform: translate(-1px, -2px); filter: hue-rotate(180deg); }
        80% { transform: translate(1px, 2px); filter: invert(50%); }
        100% { transform: translate(0); filter: none; }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }

  _createStartScreen() {
    this.startScreen = document.createElement('div');
    Object.assign(this.startScreen.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '2000',
      cursor: 'pointer',
    });

    const title = document.createElement('h1');
    title.textContent = 'THE VOICE';
    Object.assign(title.style, {
      color: '#ffffff',
      fontSize: '72px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: '300',
      letterSpacing: '20px',
      marginBottom: '30px',
      userSelect: 'none',
    });
    this.startScreen.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'You wake up. You don\'t know why you\'re here. Find the letter.';
    Object.assign(subtitle.style, {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '16px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'italic',
      marginBottom: '60px',
      textAlign: 'center',
      maxWidth: '500px',
      lineHeight: '1.6',
      userSelect: 'none',
    });
    this.startScreen.appendChild(subtitle);

    const prompt = document.createElement('p');
    prompt.textContent = '[Click to begin]';
    Object.assign(prompt.style, {
      color: 'rgba(255, 255, 255, 0.3)',
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      animation: 'pulse 2s ease-in-out infinite',
      userSelect: 'none',
    });
    this.startScreen.appendChild(prompt);

    this.startScreen.addEventListener('click', () => {
      if (this.onStartClick) this.onStartClick();
    });

    document.body.appendChild(this.startScreen);
  }

  _createWinScreen() {
    this.winScreen = document.createElement('div');
    Object.assign(this.winScreen.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '2000',
    });

    const winText = document.createElement('p');
    winText.textContent = 'You know now. You always knew.';
    Object.assign(winText.style, {
      color: '#ffffff',
      fontSize: '24px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'italic',
      opacity: '0',
      transition: 'opacity 2s ease-in',
      userSelect: 'none',
    });
    this.winScreen.appendChild(winText);
    this.winText = winText;

    document.body.appendChild(this.winScreen);
  }

  _createLoseScreen() {
    this.loseScreen = document.createElement('div');
    Object.assign(this.loseScreen.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: '2000',
      cursor: 'pointer',
    });

    const loseTitle = document.createElement('h1');
    loseTitle.textContent = 'YOU DIED';
    Object.assign(loseTitle.style, {
      color: '#cc0000',
      fontSize: '60px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: '300',
      letterSpacing: '15px',
      marginBottom: '40px',
      userSelect: 'none',
    });
    this.loseScreen.appendChild(loseTitle);

    const retryText = document.createElement('p');
    retryText.textContent = '[Click to retry]';
    Object.assign(retryText.style, {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      animation: 'pulse 2s ease-in-out infinite',
      userSelect: 'none',
    });
    this.loseScreen.appendChild(retryText);

    this.loseScreen.addEventListener('click', () => {
      window.location.reload();
    });

    document.body.appendChild(this.loseScreen);
  }

  showStart() {
    this.startScreen.style.display = 'flex';
  }

  hideStart() {
    this.startScreen.style.display = 'none';
  }

  showWin() {
    this.winScreen.style.display = 'flex';
    setTimeout(() => {
      this.winText.style.opacity = '1';
    }, 100);
  }

  showLose() {
    this.loseScreen.style.display = 'flex';
  }

  hideLose() {
    this.loseScreen.style.display = 'none';
  }

  dispose() {
    [this.startScreen, this.winScreen, this.loseScreen].forEach((el) => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
}

export { GameScreens };
