// ============================================================
// RewardScene.js — layar pilih reward setelah menang combat
// Menampilkan 3 pilihan kartu, player pilih 1
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { getAllCardsArray }  from '../data/cards/index.js';
import { ScalingSystem }    from '../systems/ScalingSystem.js';
import { LootSystem }       from '../systems/LootSystem.js';
import { DeckViewerOverlay } from '../ui/DeckViewerOverlay.js';
import { DeckSystem }       from '../systems/DeckSystem.js';

const CHOICES = 3;  // jumlah kartu yang ditawarkan

export class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.REWARD });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';
        this.isTreasure    = data.isTreasure    || false;
        this.loot          = data.loot          || null;
    }

    create() {
        // Tambah gold ke playerData sebelum tampil UI
        if (this.loot?.gold && this.playerData) {
            this.playerData.gold = (this.playerData.gold || 0) + this.loot.gold;
        }

        this._buildBackground();
        this._buildTitle();
        this._buildGoldReward();
        this._buildCardChoices();
        this._buildSkipButton();
    }

    _buildGoldReward() {
        if (!this.loot?.gold) return;

        this.add.text(GAME_WIDTH / 2, 155, `💰  +${this.loot.gold} Gold`, {
            fontFamily: 'monospace',
            fontSize:   '18px',
            color:      '#ccaa44',
            fontStyle:  'bold',
        }).setOrigin(0.5);
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x08080f
        );
    }

    _buildTitle() {
        const title = this.isTreasure ? '💎  Treasure Room' : '✦  Victory  ✦';
        const sub   = this.isTreasure
            ? 'Pilih satu kartu sebagai hadiahmu.'
            : `B${this.floor} cleared! Pilih satu kartu untuk deckmu.`;

        this.add.text(GAME_WIDTH / 2, 80, title, {
            fontFamily: 'monospace',
            fontSize:   '28px',
            color:      '#cc8833',
            fontStyle:  'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 120, sub, {
            fontFamily: 'monospace',
            fontSize:   '14px',
            color:      '#556677',
        }).setOrigin(0.5);
    }

    _buildCardChoices() {
        // Pakai cardChoices dari loot kalau ada, fallback ke random
        const pool    = this.loot?.cardChoices || getAllCardsArray();
        const choices = this.loot?.cardChoices
            ? this.loot.cardChoices
            : this._pickRandom(pool, CHOICES);

        const spacing = 220;
        const startX  = GAME_WIDTH / 2 - (choices.length - 1) * spacing / 2;

        choices.forEach((card, i) => {
            const x = startX + i * spacing;
            this._createCardChoice(card, x, GAME_HEIGHT / 2 + 30, i);
        });
    }

    _createCardChoice(card, x, y, index) {
        const w = 160, h = 220;

        // Card background
        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setStrokeStyle(1, 0x333355)
            .setInteractive({ useHandCursor: true });

        // Card type color bar di atas
        const typeColors = {
            attack:  0xcc4444,
            defense: 0x4444cc,
            magic:   0xaa44cc,
            support: 0x44aa44,
        };
        this.add.rectangle(x, y - h / 2 + 12, w - 4, 20, typeColors[card.type] || 0x444466);

        // Cost
        this.add.text(x - w / 2 + 12, y - h / 2 + 5, `${card.cost}`, {
            fontFamily: 'monospace',
            fontSize:   '16px',
            color:      '#ffcc44',
            fontStyle:  'bold',
        }).setOrigin(0, 0.5);

        // Nama
        this.add.text(x, y - 60, card.name, {
            fontFamily: 'monospace',
            fontSize:   '13px',
            color:      '#ffffff',
            fontStyle:  'bold',
            align:      'center',
            wordWrap:   { width: w - 16 },
        }).setOrigin(0.5);

        // Tipe
        this.add.text(x, y - 35, `[${card.type}]`, {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      '#556677',
        }).setOrigin(0.5);

        // Deskripsi
        this.add.text(x, y + 10, card.description || '', {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      '#8899aa',
            align:      'center',
            wordWrap:   { width: w - 20 },
        }).setOrigin(0.5);

        // Flavor text
        if (card.flavorText) {
            this.add.text(x, y + 75, card.flavorText, {
                fontFamily: 'monospace',
                fontSize:   '9px',
                color:      '#445566',
                fontStyle:  'italic',
                align:      'center',
                wordWrap:   { width: w - 20 },
            }).setOrigin(0.5);
        }

        // Hover
        bg.on('pointerover', () => {
            bg.setFillStyle(0x1a1a33);
            bg.setStrokeStyle(2, 0x6644aa);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x111122);
            bg.setStrokeStyle(1, 0x333355);
        });

        // Pilih kartu
        bg.on('pointerdown', () => {
            this._pickCard(card);
        });
    }

    _buildSkipButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 70;

        // Tombol lihat deck
        const viewBg = this.add.rectangle(bx - 130, by, 160, 36, 0x0d1a0d)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const viewTxt = this.add.text(bx - 130, by, '📋 Lihat Deck', {
            fontFamily: 'monospace', fontSize: '12px', color: '#336633',
        }).setOrigin(0.5);

        viewBg.on('pointerover', () => { viewBg.setFillStyle(0x0d2a0d); viewTxt.setColor('#44cc44'); });
        viewBg.on('pointerout',  () => { viewBg.setFillStyle(0x0d1a0d); viewTxt.setColor('#336633'); });
        viewBg.on('pointerdown', () => {
            const all = [
                ...(this.playerData?.deck    || []),
                ...(this.playerData?.discard || []),
                ...(this.playerData?.hand    || []),
            ];
            DeckViewerOverlay.show(this, all);
        });

        // Tombol skip
        const skipBg = this.add.rectangle(bx + 80, by, 180, 36, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const skipTxt = this.add.text(bx + 80, by, 'Skip — tidak ambil kartu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#334455',
        }).setOrigin(0.5);

        skipBg.on('pointerover', () => skipTxt.setColor('#556677'));
        skipBg.on('pointerout',  () => skipTxt.setColor('#334455'));
        skipBg.on('pointerdown', () => this._goBack());
    }

    // ── Actions ───────────────────────────────────────────────

    _pickCard(card) {
        if (this.playerData) {
            const totalCards = (this.playerData.deck?.length || 0) +
                               (this.playerData.discard?.length || 0) +
                               (this.playerData.hand?.length || 0);

            if (totalCards >= 30) {
                // Tampilkan pesan deck penuh
                this._showFeedback('Deck sudah penuh! (max 30 kartu)', '#cc4444');
                return;
            }

            this.playerData.discard = this.playerData.discard || [];
            this.playerData.discard.push({ ...card });
        }
        this._goBack();
    }

    _showFeedback(msg, color = '#ffffff') {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, msg, {
            fontFamily: 'monospace', fontSize: '16px',
            color, fontStyle: 'bold',
        }).setOrigin(0.5);

        this.time.delayedCall(1500, () => txt.destroy());
    }

    create() {
        // Tambah gold ke playerData sebelum tampil UI
        if (this.loot?.gold && this.playerData) {
            this.playerData.gold = (this.playerData.gold || 0) + this.loot.gold;
        }

        this._buildBackground();
        this._buildTitle();
        this._buildGoldReward();
        this._buildCardChoices();
        this._buildSkipButton();
    }

    _goBack() {
        const nextFloor   = this.floor + 1;
        const nextZone    = Math.ceil(nextFloor / 10);
        const isBossFloor = this.floor % 10 === 0;

        // Tamat B100
        if (this.floor >= 100) {
            this.scene.start(SCENE.VICTORY, {
                floor:      this.floor,
                curseLevel: this.curseLevel,
                playerData: this.playerData,
            });
            return;
        }

        // Setelah boss besar (B10, B20, dst) → zona baru
        if (isBossFloor) {
            this.scene.start(SCENE.NODE_MAP, {
                zone:          nextZone,
                floor:         nextFloor,
                curseLevel:    this.curseLevel,
                playerData:    this.playerData,
                mapData:       null,
                currentNodeId: 'start',
            });
            return;
        }

        // Setelah mini boss → selalu naik ke lantai berikutnya dengan map baru
        if (this.currentNodeId === 'mini_boss') {
            this.scene.start(SCENE.NODE_MAP, {
                zone:          this.zone,
                floor:         nextFloor,
                curseLevel:    this.curseLevel,
                playerData:    this.playerData,
                mapData:       null,        // generate map baru untuk lantai berikutnya
                currentNodeId: 'start',
            });
            return;
        }

        // Combat biasa — kembali ke map lantai yang sama
        this.scene.start(SCENE.NODE_MAP, {
            zone:          this.zone,
            floor:         this.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
        });
    }

    // ── Helpers ───────────────────────────────────────────────

    _pickRandom(arr, count) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}