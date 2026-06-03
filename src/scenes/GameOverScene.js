// ============================================================
// GameOverScene.js — update dengan Magatama display
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { GameGuard }        from '../utils/GameGuard.js';
import { MetaSystem }       from '../systems/MetaSystem.js';
import { MagatamaSystem }   from '../systems/MagatamaSystem.js';
import { SaveSystem }       from '../storage/SaveSystem.js';
import { getRelic }         from '../data/relics/index.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.GAME_OVER });
    }

    init(data) {
        this.floor            = data.floor            || 1;
        this.zone             = data.zone             || 1;
        this.curseLevel       = data.curseLevel       || 1;
        this.kills            = data.kills            || 0;
        this.defeatedBoss     = data.defeatedBoss     || false;
        this.defeatedMiniBoss = data.defeatedMiniBoss || false;
        this.defeatedBossIds  = data.defeatedBossIds  || [];
        this.playerData       = data.playerData       || null;

        GameGuard.deactivate();
        // Earn Magatama bonus game over
        const magResult = MagatamaSystem.earnGameOver();
        this.magatamaEarned  = magResult.amount;
        this.magatamaBalance = magResult.newBalance;

        // Proses meta — relic unlock
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

        this.meta      = result.meta;
        this.newRelics = result.newRelics;
    }

    create() {
        this._buildBackground();
        this._buildTitle();
        this._buildRunStats();
        this._buildMagatamaEarn();

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

        const g = this.add.graphics();
        g.lineStyle(1, 0x0d0d18, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        const vign = this.add.graphics();
        vign.fillStyle(0x440000, 0.15);
        vign.fillRect(0, 0, GAME_WIDTH, 80);
        vign.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    }
    // ── Title ─────────────────────────────────────────────────
    _buildTitle() {
        const title = this.add.text(GAME_WIDTH / 2, 62, '— KAMU GUGUR —', {
            fontFamily: 'monospace', fontSize: '36px',
            color: '#882222', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: title, alpha: 1, duration: 600, ease: 'Power2' });
    }
    // ── Run Stats ─────────────────────────────────────────────
    _buildRunStats() {
        const stats = [
            { label: 'Lantai', value: `B${this.floor}` },
            { label: 'Zona',   value: `Zona ${this.zone}` },
            { label: 'Curse',  value: `☠ ${this.curseLevel}` },
        ];

        const startX = GAME_WIDTH / 2 - (stats.length - 1) * 150 / 2;

        stats.forEach((s, i) => {
            const x = startX + i * 150;
            this.add.rectangle(x, 130, 130, 44, 0x0d0d18).setStrokeStyle(1, 0x221122);
            this.add.text(x, 118, s.label, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#334455', letterSpacing: 1,
            }).setOrigin(0.5);
            this.add.text(x, 136, s.value, {
                fontFamily: 'monospace', fontSize: '15px',
                color: '#886688', fontStyle: 'bold',
            }).setOrigin(0.5);
        });
    }
    // ── Magatama Earn ─────────────────────────────────────────
    _buildMagatamaEarn() {
        const y = 192;
        // Panel
        this.add.rectangle(GAME_WIDTH / 2, y, 380, 48, 0x0f0a18)
            .setStrokeStyle(1, 0x4a2a6a);
        // Icon + jumlah yang didapat
        const earnTxt = this.add.text(GAME_WIDTH / 2 - 60, y, `+${this.magatamaEarned}`, {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#aa66cc', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);

        this.add.text(GAME_WIDTH / 2 - 60 - 28, y, '🪬', {
            fontFamily: 'monospace', fontSize: '20px',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2 + 60, y, `Magatama`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#664488',
        }).setOrigin(0.5);
        // Balance total
        this.add.text(GAME_WIDTH / 2 + 60, y + 14,
            `Total: ${this.magatamaBalance} 🪬`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#553366',
            }).setOrigin(0.5);
        // Animasi angka muncul
        this.tweens.add({
            targets: earnTxt,
            alpha: 1,
            y: y - 8,
            duration: 500,
            delay: 300,
            ease: 'Back.Out',
        });
    }
    // ── Relic Unlock ──────────────────────────────────────────
    _buildRelicUnlock() {
        this.add.text(GAME_WIDTH / 2, 252, '✦  JIMAT BARU TERBUKA  ✦', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#aa7722', letterSpacing: 3,
        }).setOrigin(0.5);

        const iconSize = 72;
        const gap      = 20;
        const count    = Math.min(this.newRelics.length, 5); // maks 5 ditampilkan
        const startX   = GAME_WIDTH / 2 - (count - 1) * (iconSize + gap) / 2;

        this.newRelics.slice(0, count).forEach((id, i) => {
            const relic      = getRelic(id);
            if (!relic) return;

            const x          = startX + i * (iconSize + gap);
            const y          = 326;
            const tierColor  = _tierColor(relic.tier);
            const tierHexStr = '#' + tierColor.toString(16).padStart(6, '0');

            // Glow
            const glow = this.add.circle(x, y, iconSize / 2 + 10, tierColor, 0.12);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.08, to: 0.28 },
                scale: { from: 1, to: 1.15 },
                duration: 900, yoyo: true, repeat: -1,
            });

            this.add.rectangle(x, y, iconSize, iconSize, 0x0f0f1e)
                .setStrokeStyle(2, tierColor);

            this.add.text(x, y - 6, relic.icon, {
                fontFamily: 'monospace', fontSize: '24px',
            }).setOrigin(0.5);

            this.add.text(x, y + 22, relic.name, {
                fontFamily: 'monospace', fontSize: '8px',
                color: '#aabbcc', align: 'center',
                wordWrap: { width: iconSize - 4 },
            }).setOrigin(0.5);

            this.add.text(x, y + iconSize / 2 + 12, relic.description, {
                fontFamily: 'monospace', fontSize: '8px',
                color: '#44aa66', align: 'center',
                wordWrap: { width: 150 },
            }).setOrigin(0.5);

            this.add.text(x + iconSize / 2 - 2, y - iconSize / 2 + 6,
                `T${relic.tier}`, {
                    fontFamily: 'monospace', fontSize: '8px', color: tierHexStr,
                }).setOrigin(1, 0.5);
        });
    }

    _buildNoUnlock() {
        const nextFloor = this._getNextUnlockFloor(this.meta);

        this.add.text(GAME_WIDTH / 2, 270, 'Belum ada pencapaian baru.', {
            fontFamily: 'monospace', fontSize: '12px', color: '#334455',
        }).setOrigin(0.5);

        if (nextFloor) {
            this.add.text(GAME_WIDTH / 2, 294,
                `Capai lantai B${nextFloor} untuk unlock relic berikutnya.`, {
                    fontFamily: 'monospace', fontSize: '10px', color: '#2a3a4a',
                }).setOrigin(0.5);
        }
    }
    // ── Meta Summary ──────────────────────────────────────────
    _buildMetaSummary() {
        const meta  = this.meta;
        const owned = (meta.ownedRelics || []).length;
        const best  = meta.bestFloor   || 0;
        const runs  = meta.totalRuns   || 0;

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 110,
            `Run #${runs}  ·  Best: B${best}  ·  Relic: ${owned}/14  ·  🪬 ${meta.magatama || 0}`, {
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