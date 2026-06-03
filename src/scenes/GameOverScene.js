// ============================================================
// GameOverScene.js — layar game over
// Phase 4: tampilkan relic baru yang unlock + stats run
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { GameGuard }    from '../utils/GameGuard.js';
import { MetaSystem }   from '../systems/MetaSystem.js';
import { SaveSystem }   from '../storage/SaveSystem.js';
import { getRelic }     from '../data/relics/index.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.GAME_OVER });
    }

    init(data) {
        this.floor          = data.floor          || 1;
        this.zone           = data.zone           || 1;
        this.curseLevel     = data.curseLevel     || 1;
        this.kills          = data.kills          || 0;
        this.defeatedBoss   = data.defeatedBoss   || false;
        this.defeatedMiniBoss = data.defeatedMiniBoss || false;
        this.defeatedBossIds  = data.defeatedBossIds  || [];
        this.playerData     = data.playerData     || null;

        GameGuard.deactivate();

        // Proses game over — rekam run, cek relic unlock
        const result = MetaSystem.processGameOver({
            floor:            this.floor,
            zone:             this.zone,
            curseLevel:       this.curseLevel,
            kills:            this.kills,
            won:              false,
            defeatedBoss:     this.defeatedBoss,
            defeatedMiniBoss: this.defeatedMiniBoss,
            defeatedBossIds:  this.defeatedBossIds,
            playerData:       this.playerData,
        });

        this.meta       = result.meta;
        this.newRelics  = result.newRelics;   // array id relic baru
    }

    create() {
        this._buildBackground();
        this._buildTitle();
        this._buildRunStats();

        if (this.newRelics.length > 0) {
            this._buildRelicUnlock();
        } else {
            this._buildNoUnlock();
        }

        this._buildMetaSummary();
        this._buildButtons();
    }

    // ── Background ────────────────────────────────────────────
    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050508);

        // Grid redup
        const g = this.add.graphics();
        g.lineStyle(1, 0x0d0d18, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        // Vignette merah di tepi
        const vign = this.add.graphics();
        vign.fillStyle(0x440000, 0.15);
        vign.fillRect(0, 0, GAME_WIDTH, 80);
        vign.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    }

    // ── Title ─────────────────────────────────────────────────
    _buildTitle() {
        const title = this.add.text(GAME_WIDTH / 2, 70, '— KAMU GUGUR —', {
            fontFamily: 'monospace', fontSize: '38px',
            color: '#882222', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: title, alpha: 1, duration: 600, ease: 'Power2' });
    }

    // ── Run Stats ─────────────────────────────────────────────
    _buildRunStats() {
        const stats = [
            { label: 'Lantai Dicapai',  value: `B${this.floor}` },
            { label: 'Zona',            value: `Zona ${this.zone}` },
            { label: 'Curse Level',     value: `☠ ${this.curseLevel}` },
        ];

        const startX = GAME_WIDTH / 2 - (stats.length - 1) * 160 / 2;

        stats.forEach((s, i) => {
            const x = startX + i * 160;

            this.add.rectangle(x, 148, 140, 48, 0x0d0d18)
                .setStrokeStyle(1, 0x221122);

            this.add.text(x, 136, s.label, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#334455', letterSpacing: 1,
            }).setOrigin(0.5);

            this.add.text(x, 156, s.value, {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#886688', fontStyle: 'bold',
            }).setOrigin(0.5);
        });
    }

    // ── Relic Unlock ──────────────────────────────────────────
    _buildRelicUnlock() {
        // Header
        this.add.text(GAME_WIDTH / 2, 210, '✦  JIMAT BARU TERBUKA  ✦', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#aa7722', letterSpacing: 3,
        }).setOrigin(0.5);

        const iconSize = 80;
        const gap      = 24;
        const count    = this.newRelics.length;
        const startX   = GAME_WIDTH / 2 - (count - 1) * (iconSize + gap) / 2;

        this.newRelics.forEach((id, i) => {
            const relic = getRelic(id);
            if (!relic) return;

            const x          = startX + i * (iconSize + gap);
            const y          = 310;
            const tierColor  = _tierColor(relic.tier);
            const tierHexStr = '#' + tierColor.toString(16).padStart(6, '0');

            // Glow
            const glow = this.add.circle(x, y, iconSize / 2 + 12, tierColor, 0.12);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.08, to: 0.28 },
                scale: { from: 1, to: 1.15 },
                duration: 900, yoyo: true, repeat: -1,
            });

            // Card relic
            this.add.rectangle(x, y, iconSize, iconSize, 0x0f0f1e)
                .setStrokeStyle(2, tierColor);

            this.add.text(x, y - 8, relic.icon, {
                fontFamily: 'monospace', fontSize: '28px',
            }).setOrigin(0.5);

            this.add.text(x, y + 24, relic.name, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#aabbcc', align: 'center',
                wordWrap: { width: iconSize - 4 },
            }).setOrigin(0.5);

            // Deskripsi di bawah card
            this.add.text(x, y + iconSize / 2 + 14, relic.description, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#44aa66', align: 'center',
                wordWrap: { width: 160 },
            }).setOrigin(0.5);

            // Tier badge
            this.add.text(x + iconSize / 2 - 2, y - iconSize / 2 + 6,
                `T${relic.tier}`, {
                    fontFamily: 'monospace', fontSize: '8px', color: tierHexStr,
                }).setOrigin(1, 0.5);

            // Animasi muncul
            this.add.rectangle(x, y, iconSize, iconSize, 0xffffff, 0)
                .setAlpha(0.4);
        });
    }

    _buildNoUnlock() {
        const meta = this.meta;
        const nextFloor = this._getNextUnlockFloor(meta);

        this.add.text(GAME_WIDTH / 2, 240, 'Belum ada jimat baru.', {
            fontFamily: 'monospace', fontSize: '13px', color: '#334455',
        }).setOrigin(0.5);

        if (nextFloor) {
            this.add.text(GAME_WIDTH / 2, 268,
                `Capai lantai B${nextFloor} untuk unlock jimat berikutnya.`, {
                    fontFamily: 'monospace', fontSize: '11px', color: '#2a3a4a',
                }).setOrigin(0.5);
        }
    }

    // ── Meta Summary ──────────────────────────────────────────
    _buildMetaSummary() {
        const meta    = this.meta;
        const owned   = (meta.ownedRelics || []).length;
        const total   = 14;  // total relic yang ada
        const best    = meta.bestFloor || 0;
        const runs    = meta.totalRuns || 0;

        const y = 460;
        this.add.text(GAME_WIDTH / 2, y,
            `Run #${runs}  ·  Best: B${best}  ·  Jimat: ${owned}/${total}`, {
                fontFamily: 'monospace', fontSize: '11px', color: '#223344',
            }).setOrigin(0.5);
    }

    // ── Buttons ───────────────────────────────────────────────
    _buildButtons() {
        const by = GAME_HEIGHT - 60;

        this._createButton(GAME_WIDTH / 2 - 130, by, '▶  Coba Lagi', () => {
            this.scene.start(SCENE.CHAR_SEL);
        });

        this._createButton(GAME_WIDTH / 2 + 130, by, '⌂  Menu Utama', () => {
            this.scene.start(SCENE.MAIN_MENU);
        });
    }

    _createButton(x, y, label, onClick) {
        const w = 220, h = 44;
        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setStrokeStyle(1, 0x331122)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace', fontSize: '15px', color: '#886688',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x221133); txt.setColor('#ccaacc'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x111122); txt.setColor('#886688'); });
        bg.on('pointerdown', onClick);
    }

    // ── Helpers ───────────────────────────────────────────────

    _getNextUnlockFloor(meta) {
        const floors = [3, 5, 7, 10, 20];
        const best   = meta.bestFloor || 0;
        return floors.find(f => f > best) || null;
    }
}

function _tierColor(tier) {
    const colors = { 1: 0x557755, 2: 0x336699, 3: 0x774499, 4: 0xaa7722 };
    return colors[tier] || 0x444455;
}