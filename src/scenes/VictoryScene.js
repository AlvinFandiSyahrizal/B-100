// ============================================================
// VictoryScene.js — layar kemenangan setelah tamat B100
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { SaveSystem }  from '../storage/SaveSystem.js';
import { GameGuard }   from '../utils/GameGuard.js';

export class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.VICTORY });
    }

    init(data) {
        this.floor      = data.floor      || 100;
        this.curseLevel = data.curseLevel || 1;
        this.playerData = data.playerData || null;

        // Victory = run selesai
        GameGuard.deactivate();
        SaveSystem.recordRun({ floor: this.floor, won: true });
        SaveSystem.clearRun();
    }

    create() {
        const cx = GAME_WIDTH  / 2;
        const cy = GAME_HEIGHT / 2;

        this._buildBackground();
        this._buildTitle(cx, cy);
        this._buildStats(cx, cy);
        this._buildButtons(cx, cy);
    }

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x060608
        );

        // Partikel bintang sederhana
        const g = this.add.graphics();
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const r = Math.random() * 2;
            g.fillStyle(0xffffff, Math.random() * 0.5 + 0.1);
            g.fillCircle(x, y, r);
        }
    }

    _buildTitle(cx, cy) {
        this.add.text(cx, cy - 160, '✦  DUNGEON TAKLUK  ✦', {
            fontFamily:    'monospace',
            fontSize:      '14px',
            color:         '#cc8833',
            letterSpacing: 4,
        }).setOrigin(0.5);

        this.add.text(cx, cy - 110, 'B100 CLEARED', {
            fontFamily: 'monospace',
            fontSize:   '56px',
            fontStyle:  'bold',
            color:      '#ffcc44',
            stroke:     '#441100',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(cx, cy - 55, `Curse Level ${this.curseLevel}  •  Kamu telah menembus kegelapan terdalam.`, {
            fontFamily: 'monospace',
            fontSize:   '13px',
            color:      '#556677',
            fontStyle:  'italic',
        }).setOrigin(0.5);
    }

    _buildStats(cx, cy) {
        const meta = SaveSystem.loadMeta();

        const lines = [
            `Total Run    : ${meta.totalRuns}`,
            `Best Floor   : B${meta.bestFloor}`,
            `Total Kills  : ${meta.totalKills}`,
        ];

        lines.forEach((line, i) => {
            this.add.text(cx, cy + 20 + i * 28, line, {
                fontFamily: 'monospace',
                fontSize:   '14px',
                color:      '#445566',
            }).setOrigin(0.5);
        });
    }

    _buildButtons(cx, cy) {
        this._createButton(cx, cy + 150, '▶  Main Lagi', () => {
            this.scene.start(SCENE.NODE_MAP, {
                zone: 1, floor: 1, curseLevel: this.curseLevel,
            });
        });

        this._createButton(cx, cy + 205, '⌂  Menu Utama', () => {
            this.scene.start(SCENE.MAIN_MENU);
        });
    }

    _createButton(x, y, label, onClick) {
        const w = 240, h = 42;
        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setStrokeStyle(1, 0x333344)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '15px', color: '#778899',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x1a1a33); txt.setColor('#aabbcc'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x111122); txt.setColor('#778899'); });
        bg.on('pointerdown', onClick);
    }
}