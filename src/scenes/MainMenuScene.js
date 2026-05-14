// ============================================================
// MainMenuScene.js — layar menu utama
// Phase 1: simpel, hanya tombol Start Game dan logo
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

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
        // Background gelap dengan sedikit variasi
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x080810
        );

        // Garis-garis horizontal tipis buat efek atmosferik
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x1a1a2e, 0.6);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            lineGfx.moveTo(0, y);
            lineGfx.lineTo(GAME_WIDTH, y);
        }
        lineGfx.strokePath();
    }

    _createTitle(cx) {
        // Sub-judul kecil di atas
        this.add.text(cx, 160, '⛩  YOKAI ROGUELITE  ⛩', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#7755aa',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Judul utama
        this.add.text(cx, 220, 'DUNGEON', {
            fontFamily: 'monospace',
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#cc8833',
            stroke: '#441100',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(cx, 295, 'B  1  0  0', {
            fontFamily: 'monospace',
            fontSize: '42px',
            fontStyle: 'bold',
            color: '#884411',
            letterSpacing: 8,
        }).setOrigin(0.5);

        // Garis dekoratif
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x443322, 1);
        lineGfx.moveTo(cx - 200, 325);
        lineGfx.lineTo(cx + 200, 325);
        lineGfx.strokePath();
    }

    _createMenu(cx, cy) {
        const buttons = [
            { label: '▶  Mulai Petualangan', key: 'start',    y: cy + 30  },
            { label: '📖  Panduan',           key: 'guide',   y: cy + 90  },
            { label: '⚙  Pengaturan',         key: 'options', y: cy + 150 },
        ];

        for (const btn of buttons) {
            this._createButton(cx, btn.y, btn.label, btn.key);
        }
    }

    _createButton(x, y, label, key) {
        const width  = 320;
        const height = 48;

        // Background tombol
        const bg = this.add.rectangle(x, y, width, height, 0x1a1a2e)
            .setInteractive({ useHandCursor: true });

        // Border
        const border = this.add.graphics();
        border.lineStyle(1, 0x333355, 1);
        border.strokeRect(x - width / 2, y - height / 2, width, height);

        // Teks
        const text = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '17px',
            color: '#aaaacc',
        }).setOrigin(0.5);

        // Hover effects
        bg.on('pointerover', () => {
            bg.setFillStyle(0x2a2a4e);
            text.setColor('#ffffff');
            border.clear();
            border.lineStyle(1, 0x6644aa, 1);
            border.strokeRect(x - width / 2, y - height / 2, width, height);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1a1a2e);
            text.setColor('#aaaacc');
            border.clear();
            border.lineStyle(1, 0x333355, 1);
            border.strokeRect(x - width / 2, y - height / 2, width, height);
        });

        // Click action
        bg.on('pointerdown', () => {
            if (key === 'start') {
                this.scene.start(SCENE.NODE_MAP, {
                    zone:       1,
                    floor:      1,
                    curseLevel: 1,
                });
            }
            // guide dan options di-implement nanti
        });
    }

    _createFooter() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'v0.1.0 — Phase 1', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#333344',
        }).setOrigin(0.5);
    }
}