/**
 * HUD - Heads Up Display
 * Crosshair, letter tracker, interaction prompts, notifications.
 * All DOM-based, z-index 100.
 */

class HUD {
  constructor() {
    this.container = null;
    this.crosshair = null;
    this.letterTracker = null;
    this.interactionPrompt = null;
    this.notification = null;
    this.notificationTimeout = null;

    this._createUI();
  }

  _createUI() {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '100',
      display: 'none',
    });

    // Crosshair - small white dot
    this.crosshair = document.createElement('div');
    Object.assign(this.crosshair.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '4px',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
    });
    this.container.appendChild(this.crosshair);

    // Letter tracker (bottom left)
    this.letterTracker = document.createElement('div');
    Object.assign(this.letterTracker.style, {
      position: 'absolute',
      bottom: '40px',
      left: '30px',
      color: 'rgba(255, 255, 255, 0.3)',
      fontSize: '18px',
      fontFamily: '"Courier New", monospace',
      letterSpacing: '8px',
      userSelect: 'none',
    });
    this.container.appendChild(this.letterTracker);

    // Interaction prompt (bottom center)
    this.interactionPrompt = document.createElement('div');
    Object.assign(this.interactionPrompt.style, {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      textAlign: 'center',
      padding: '8px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '4px',
      display: 'none',
      userSelect: 'none',
    });
    this.container.appendChild(this.interactionPrompt);

    // Notification (top center)
    this.notification = document.createElement('div');
    Object.assign(this.notification.style, {
      position: 'absolute',
      top: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '18px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '12px 24px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '4px',
      opacity: '0',
      transition: 'opacity 0.5s ease-in-out',
      userSelect: 'none',
      maxWidth: '500px',
    });
    this.container.appendChild(this.notification);

    document.body.appendChild(this.container);
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  updateLetters(slots) {
    this.letterTracker.textContent = slots.join(' \u00B7 ');
  }

  setPrompt(text) {
    if (text) {
      this.interactionPrompt.textContent = text;
      this.interactionPrompt.style.display = 'block';
    } else {
      this.interactionPrompt.style.display = 'none';
    }
  }

  showNotification(text, duration = 3000) {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notification.textContent = text;
    this.notification.style.opacity = '1';

    this.notificationTimeout = setTimeout(() => {
      this.notification.style.opacity = '0';
    }, duration);
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
  }
}

export { HUD };
