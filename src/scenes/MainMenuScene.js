// ============================================================
// MainMenuScene.js — layar menu utama
// Update Phase 4: tambah tombol Gashapon + display Magatama
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { SaveSystem }        from '../storage/SaveSystem.js';
import { MagatamaSystem }    from '../systems/MagatamaSystem.js';

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
        this._createMagatamaDisplay();
        this._createFooter();
    }

    // ── Background ────────────────────────────────────────────
    _createBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080810);

        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, 0x1a1a2e, 0.6);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            lineGfx.moveTo(0, y); lineGfx.lineTo(GAME_WIDTH, y);
        }
        lineGfx.strokePath();

        // Glow background
        const glow = this.add.graphics();
        glow.fillStyle(0x2b1530, 0.12);
        glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 280);
    }

    // ── Title ─────────────────────────────────────────────────
    _createTitle(cx) {
        this.add.text(cx, 160, '⛩  YOKAI ROGUELITE  ⛩', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#7755aa', letterSpacing: 4,
        }).setOrigin(0.5);

        const titleTxt = this.add.text(cx, 220, 'DUNGEON', {
            fontFamily: 'monospace', fontSize: '72px', fontStyle: 'bold',
            color: '#cc8833', stroke: '#441100', strokeThickness: 6,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleTxt,
            alpha: { from: 1, to: 0.85 },
            duration: 1800, yoyo: true, repeat: -1,
        });

        this.add.text(cx, 295, 'B  1  0  0', {
            fontFamily: 'monospace', fontSize: '42px', fontStyle: 'bold',
            color: '#884411', letterSpacing: 8,
        }).setOrigin(0.5);

        const g = this.add.graphics();
        g.lineStyle(1, 0x443322, 1);
        g.moveTo(cx - 200, 325); g.lineTo(cx + 200, 325);
        g.strokePath();
    }

    // ── Menu ──────────────────────────────────────────────────
    _createMenu(cx, cy) {
        const hasSave  = SaveSystem.hasRun();
        const buttons  = [];
        let   baseY    = cy - 20;

        if (hasSave) {
            const saveData   = SaveSystem.loadRun();
            const floorLabel = saveData ? `  (B${saveData.floor || '?'})` : '';
            buttons.push({
                label: `▶  Lanjutkan${floorLabel}`,
                key:   'continue',
                color: '#44aa66',
            });
            buttons.push({ label: '✦  Mulai Baru', key: 'start' });
        } else {
            buttons.push({ label: '▶  Mulai Petualangan', key: 'start' });
        }

        // Tombol Gashapon
        buttons.push({
            label:  '🎰  Gashapon',
            key:    'gashapon',
            color:  '#aa66cc',
        });

        buttons.push({ label: '📖  Panduan',   key: 'guide'   });
        buttons.push({ label: '⚙  Pengaturan', key: 'options' });

        const spacing = 58;
        buttons.forEach((btn, i) => {
            this._createButton(cx, baseY + i * spacing, btn.label, btn.key, btn.color);
        });
    }

    _createButton(x, y, label, key, customColor) {
        const width = 320, height = 48;

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
            switch (key) {
                case 'continue': {
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
                    break;
                }
                case 'start':
                    SaveSystem.clearRun();
                    this.scene.start(SCENE.CHAR_SEL);
                    break;
                case 'gashapon':
                    this.scene.start(SCENE.GASHAPON);
                    break;
            }
        });
    }

    // ── Magatama Display ──────────────────────────────────────
    _createMagatamaDisplay() {
        const balance = MagatamaSystem.getBalance();

        const box = this.add.rectangle(GAME_WIDTH - 90, GAME_HEIGHT - 48, 160, 36, 0x0f0a18)
            .setStrokeStyle(1, 0x4a2a6a);

        this.add.text(GAME_WIDTH - 90, GAME_HEIGHT - 56, '🪬 MAGATAMA', {
            fontFamily: 'monospace', fontSize: '8px',
            color: '#553366', letterSpacing: 2,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH - 90, GAME_HEIGHT - 42, `${balance}`, {
            fontFamily: 'monospace', fontSize: '18px',
            color: '#aa66cc', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: box,
            alpha: { from: 0.85, to: 1 },
            duration: 1300, yoyo: true, repeat: -1,
        });
    }

    // ── Footer ────────────────────────────────────────────────
    _createFooter() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'v0.4.0 — Phase 4', {
            fontFamily: 'monospace', fontSize: '11px', color: '#333344',
        }).setOrigin(0.5);
    }
}