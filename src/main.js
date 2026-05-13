// ============================================================
// main.js — init Phaser, titik masuk seluruh game
// ============================================================

import { gameConfig } from './config/gameConfig.js';

// Tunggu DOM siap sebelum init Phaser
window.addEventListener('load', () => {
    const game = new Phaser.Game(gameConfig);

    // Expose ke window untuk debugging di console (bisa dimatikan di production)
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        window.game = game;
    }
});
