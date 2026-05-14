// ============================================================
// RestScene.js — layar rest site
// Player bisa pilih: heal HP atau upgrade 1 kartu di deck
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT, STAT
} from '../config/constants.js';
import { DeckSystem } from '../systems/DeckSystem.js';

const HEAL_PERCENT = 0.30;  // heal 30% dari HP max

export class RestScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.REST });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        this.actionTaken = false;
    }

    create() {
        this._buildBackground();
        this._buildHeader();
        this._buildOptions();
        this._buildLeaveButton();
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x07080d
        );

        // Panel tengah
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 700, 420, 0x0d0e18)
            .setStrokeStyle(1, 0x1e2030);

        // Api unggun dekoratif (placeholder teks)
        this.add.text(GAME_WIDTH / 2, 155, '🔥', {
            fontSize: '48px',
        }).setOrigin(0.5);
    }

    _buildHeader() {
        this.add.text(GAME_WIDTH / 2, 80, '😴  Rest Site', {
            fontFamily: 'monospace',
            fontSize:   '26px',
            color:      '#cc8833',
            fontStyle:  'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 112, 'Sejenak beristirahat di tengah kegelapan dungeon.', {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      '#445566',
            fontStyle:  'italic',
        }).setOrigin(0.5);
    }

    _buildOptions() {
        // ── Opsi 1: Heal ──────────────────────────────────────
        const healAmt = this.playerData
            ? Math.floor(this.playerData.stats?.[STAT.HP_MAX] * HEAL_PERCENT)
            : '30%';

        this._createOption(
            GAME_WIDTH / 2 - 175,
            GAME_HEIGHT / 2 + 20,
            '❤️  Beristirahat',
            `Pulihkan ${healAmt} HP.`,
            'Tidur sebentar, bangun lebih segar.',
            () => this._doHeal(healAmt)
        );

        // ── Opsi 2: Upgrade kartu ─────────────────────────────
        this._createOption(
            GAME_WIDTH / 2 + 175,
            GAME_HEIGHT / 2 + 20,
            '⬆️  Tempa Kartu',
            'Upgrade 1 kartu di deckmu.',
            'Asah kartu ke versi yang lebih kuat.',
            () => this._doUpgrade()
        );
    }

    _createOption(x, y, title, desc, flavor, onClick) {
        const w = 300, h = 200;

        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setStrokeStyle(1, 0x2a2a44)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, y - 65, title, {
            fontFamily: 'monospace',
            fontSize:   '16px',
            color:      '#aabbcc',
            fontStyle:  'bold',
        }).setOrigin(0.5);

        this.add.text(x, y - 10, desc, {
            fontFamily: 'monospace',
            fontSize:   '13px',
            color:      '#778899',
            align:      'center',
            wordWrap:   { width: w - 30 },
        }).setOrigin(0.5);

        this.add.text(x, y + 50, flavor, {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      '#334455',
            fontStyle:  'italic',
            align:      'center',
            wordWrap:   { width: w - 30 },
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            if (!this.actionTaken) bg.setFillStyle(0x1a1a33).setStrokeStyle(2, 0x4455aa);
        });
        bg.on('pointerout', () => {
            if (!this.actionTaken) bg.setFillStyle(0x111122).setStrokeStyle(1, 0x2a2a44);
        });
        bg.on('pointerdown', () => {
            if (!this.actionTaken) onClick();
        });
    }

    _buildLeaveButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 55;

        const bg = this.add.rectangle(bx, by, 200, 36, 0x0d0d1a)
            .setStrokeStyle(1, 0x1e1e2e)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(bx, by, '← Kembali ke Peta', {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#556677'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this._leave());
    }

    // ── Actions ───────────────────────────────────────────────

    _doHeal(amount) {
        this.actionTaken = true;

        if (this.playerData) {
            const hpMax     = this.playerData.stats?.hp_max || 100;
            const healAmt   = typeof amount === 'number' ? amount : Math.floor(hpMax * 0.3);
            this.playerData.hp = Math.min(hpMax, (this.playerData.hp || 0) + healAmt);
            console.log(`[Rest] Healed ${healAmt} HP. Now: ${this.playerData.hp}/${hpMax}`);
        }

        this._showFeedback('❤️  HP dipulihkan!', '#44cc44');
        this.time.delayedCall(1200, () => this._leave());
    }

    _doUpgrade() {
        this.actionTaken = true;

        // Tampilkan list kartu di deck untuk dipilih
        if (this.playerData) {
            const allCards = [
                ...(this.playerData.deck    || []),
                ...(this.playerData.discard || []),
            ].filter(c => c.upgradedId);  // hanya kartu yang punya versi upgrade

            if (allCards.length === 0) {
                this._showFeedback('Tidak ada kartu yang bisa diupgrade.', '#cc4444');
                this.time.delayedCall(1200, () => this._leave());
                return;
            }

            this._showUpgradePicker(allCards);
        } else {
            this._showFeedback('⬆️  Kartu diupgrade!', '#4488cc');
            this.time.delayedCall(1200, () => this._leave());
        }
    }

    _showUpgradePicker(cards) {
        // Panel pilih kartu
        const panelY = GAME_HEIGHT / 2 + 130;

        this.add.text(GAME_WIDTH / 2, panelY - 30, 'Pilih kartu yang mau di-upgrade:', {
            fontFamily: 'monospace', fontSize: '13px', color: '#667788',
        }).setOrigin(0.5);

        const maxShow = Math.min(cards.length, 5);
        const spacing = 160;
        const startX  = GAME_WIDTH / 2 - ((maxShow - 1) * spacing) / 2;

        cards.slice(0, maxShow).forEach((card, i) => {
            const x  = startX + i * spacing;
            const bg = this.add.rectangle(x, panelY + 30, 140, 50, 0x111122)
                .setStrokeStyle(1, 0x334455)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, panelY + 22, card.name, {
                fontFamily: 'monospace', fontSize: '10px', color: '#aabbcc',
                align: 'center', wordWrap: { width: 130 },
            }).setOrigin(0.5);

            this.add.text(x, panelY + 40, `→ ${card.upgradedId?.replace(/_/g, ' ')}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#44aa44',
            }).setOrigin(0.5);

            bg.on('pointerover', () => bg.setFillStyle(0x1a1a33));
            bg.on('pointerout',  () => bg.setFillStyle(0x111122));
            bg.on('pointerdown', () => {
                // Upgrade kartu di playerData
                const inDeck = this.playerData.deck?.findIndex(c => c.id === card.id);
                if (inDeck !== undefined && inDeck >= 0 && card.upgradedId) {
                    this.playerData.deck[inDeck] = { ...card, id: card.upgradedId };
                } else {
                    const inDiscard = this.playerData.discard?.findIndex(c => c.id === card.id);
                    if (inDiscard >= 0 && card.upgradedId) {
                        this.playerData.discard[inDiscard] = { ...card, id: card.upgradedId };
                    }
                }
                this._showFeedback(`⬆️  ${card.name} diupgrade!`, '#4488cc');
                this.time.delayedCall(1000, () => this._leave());
            });
        });
    }

    _showFeedback(msg, color) {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, msg, {
            fontFamily: 'monospace',
            fontSize:   '18px',
            color,
            fontStyle:  'bold',
        }).setOrigin(0.5);
    }

    _leave() {
        this.scene.start(SCENE.NODE_MAP, {
            zone:          this.zone,
            floor:         this.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
        });
    }
}