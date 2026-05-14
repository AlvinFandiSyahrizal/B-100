// ============================================================
// gameConfig.js — konfigurasi Phaser engine
// ============================================================

import { GAME_WIDTH, GAME_HEIGHT, SCENE } from './constants.js';

// Import semua scene
import { BootScene }            from '../scenes/BootScene.js';
import { PreloadScene }         from '../scenes/PreloadScene.js';
import { MainMenuScene }        from '../scenes/MainMenuScene.js';
import { CombatScene }          from '../scenes/CombatScene.js';
import { GameOverScene }        from '../scenes/GameOverScene.js';
import { NodeMapScene }         from '../scenes/NodeMapScene.js';
import { RewardScene }          from '../scenes/RewardScene.js';
import { ShopScene }            from '../scenes/ShopScene.js';
import { RestScene }            from '../scenes/RestScene.js';
import { BossIntroScene }       from '../scenes/BossIntroScene.js';
import { VictoryScene }         from '../scenes/VictoryScene.js';
import { EventScene }           from '../scenes/EventScene.js';

// Nanti scene lain ditambahkan di sini sesuai phase

export const gameConfig = {
    type: Phaser.AUTO,           // AUTO = pakai WebGL kalau bisa, fallback Canvas
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',   // div di index.html
    backgroundColor: '#0a0a0f',

    // Scale agar game muat di berbagai ukuran layar
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    // Physics tidak dipakai untuk game turn-based,
    // tapi tetap ada untuk kemungkinan efek animasi
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },

    // Semua scene yang terdaftar — urutan pertama = yang dijalankan pertama
    scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        NodeMapScene,
        CombatScene,
        RewardScene,
        ShopScene,
        RestScene,
        BossIntroScene,
        VictoryScene,
        GameOverScene,
        EventScene,
        // Phase 2 nanti tambah:
        // NodeMapScene, EventScene, ShopScene, RestScene,
        // BossIntroScene, RewardScene,
        // Phase 3+:
        // CharacterSelectScene, VictoryScene, MetaScene,
    ],
};
