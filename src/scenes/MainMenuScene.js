// ============================================================
// MainMenuScene.js — layar menu utama
// Phase 1: simpel, hanya tombol Start Game dan logo
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { SaveSystem } from '../storage/SaveSystem.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.MAIN_MENU });
    }

    create() {
        const cx = GAME_WIDTH  / 2;
        const cy = GAME_HEIGHT / 2;

        this._createBackground();
        this._createTitle(cx);
        this._createMenu(cx, cy);
        this._createFooter();
    }

    // ── Private ───────────────────────────────────────────────

    _createBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x080810
        );

        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x1a1a2e, 0.6);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            lineGfx.moveTo(0, y);
            lineGfx.lineTo(GAME_WIDTH, y);
        }
        lineGfx.strokePath();
    }

    _createTitle(cx) {
        this.add.text(cx, 160, '⛩  YOKAI ROGUELITE  ⛩', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#7755aa', letterSpacing: 4,
        }).setOrigin(0.5);

        this.add.text(cx, 220, 'DUNGEON', {
            fontFamily: 'monospace', fontSize: '72px', fontStyle: 'bold',
            color: '#cc8833', stroke: '#441100', strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(cx, 295, 'B  1  0  0', {
            fontFamily: 'monospace', fontSize: '42px', fontStyle: 'bold',
            color: '#884411', letterSpacing: 8,
        }).setOrigin(0.5);

        const g = this.add.graphics();
        g.lineStyle(1, 0x443322, 1);
        g.moveTo(cx - 200, 325); g.lineTo(cx + 200, 325);
        g.strokePath();
    }

    _createMenu(cx, cy) {
        const hasSave = SaveSystem.hasRun();

        const buttons = [];

        // Kalau ada save, tampilkan tombol Continue di atas
        if (hasSave) {
            const saveData = SaveSystem.loadRun();
            const floorLabel = saveData ? `  (B${saveData.floor || '?'})` : '';
            buttons.push({
                label: `▶  Lanjutkan${floorLabel}`,
                key:   'continue',
                y:     cy - 10,
                color: '#44aa66',
            });
            buttons.push({ label: '✦  Mulai Baru',      key: 'start',   y: cy + 55  });
        } else {
            buttons.push({ label: '▶  Mulai Petualangan', key: 'start', y: cy + 30  });
        }

        buttons.push({ label: '📖  Panduan',  key: 'guide',   y: cy + (hasSave ? 115 : 90)  });
        buttons.push({ label: '⚙  Pengaturan', key: 'options', y: cy + (hasSave ? 170 : 145) });

        for (const btn of buttons) {
            this._createButton(cx, btn.y, btn.label, btn.key, btn.color);
        }
    }

    _createButton(x, y, label, key, customColor) {
        const width  = 320;
        const height = 48;

        const bg = this.add.rectangle(x, y, width, height, 0x1a1a2e)
            .setInteractive({ useHandCursor: true });

        const border = this.add.graphics();
        border.lineStyle(1, 0x333355, 1);
        border.strokeRect(x - width / 2, y - height / 2, width, height);

        const text = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '17px',
            color: customColor || '#aaaacc',
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x2a2a4e);
            text.setColor('#ffffff');
            border.clear();
            border.lineStyle(1, 0x6644aa, 1);
            border.strokeRect(x - width / 2, y - height / 2, width, height);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1a1a2e);
            text.setColor(customColor || '#aaaacc');
            border.clear();
            border.lineStyle(1, 0x333355, 1);
            border.strokeRect(x - width / 2, y - height / 2, width, height);
        });

        bg.on('pointerdown', () => {
            if (key === 'continue') {
                // Resume dari save
                const saveData = SaveSystem.loadRun();
                if (saveData) {
                    this.scene.start(SCENE.NODE_MAP, {
                        zone:          saveData.zone          || 1,
                        floor:         saveData.floor         || 1,
                        curseLevel:    saveData.curseLevel    || 1,
                        playerData:    saveData.playerData    || null,
                        mapData:       saveData.mapData       || null,
                        currentNodeId: saveData.currentNodeId || 'start',
                    });
                }
            } else if (key === 'start') {
                // Hapus save lama kalau ada, mulai baru
                SaveSystem.clearRun();
                this.scene.start(SCENE.NODE_MAP, {
                    zone: 1, floor: 1, curseLevel: 1,
                });
            }
        });
    }

    _createFooter() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'v0.2.0 — Phase 2', {
            fontFamily: 'monospace', fontSize: '11px', color: '#333344',
        }).setOrigin(0.5);
    }
}
