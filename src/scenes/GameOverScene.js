// ============================================================
// GameOverScene.js — layar game over
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.GAME_OVER });
    }

    init(data) {
        this.floor = data.floor || 1;
    }

    create() {
        const cx = GAME_WIDTH  / 2;
        const cy = GAME_HEIGHT / 2;

        // Background
        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x050508);

        // Judul
        this.add.text(cx, cy - 100, '— KAMU GUGUR —', {
            fontFamily: 'monospace',
            fontSize:   '40px',
            color:      '#882222',
            fontStyle:  'bold',
        }).setOrigin(0.5);

        // Info lantai
        this.add.text(cx, cy - 40, `Mencapai lantai B${this.floor}`, {
            fontFamily: 'monospace',
            fontSize:   '18px',
            color:      '#555566',
        }).setOrigin(0.5);

        // Pesan lore
        this.add.text(cx, cy + 10, 'Dungeon mengklaim jiwamu.\nNamun setiap kematian adalah pelajaran.', {
            fontFamily: 'monospace',
            fontSize:   '14px',
            color:      '#333344',
            align:      'center',
        }).setOrigin(0.5);

        // Tombol coba lagi
        this._createButton(cx, cy + 90, '▶  Coba Lagi', () => {
            this.scene.start(SCENE.COMBAT, { floor: 1, curseLevel: 1 });
        });

        // Tombol menu
        this._createButton(cx, cy + 150, '⌂  Menu Utama', () => {
            this.scene.start(SCENE.MAIN_MENU);
        });
    }

    _createButton(x, y, label, onClick) {
        const w = 240, h = 44;
        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setInteractive({ useHandCursor: true });

        this.add.graphics()
            .lineStyle(1, 0x331122, 1)
            .strokeRect(x - w / 2, y - h / 2, w, h);

        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '16px', color: '#886688',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x221133); txt.setColor('#ccaacc'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x111122); txt.setColor('#886688'); });
        bg.on('pointerdown', onClick);
    }
}
