// ============================================================
// RewardScene.js — layar pilih reward setelah menang combat
// Menampilkan 3 pilihan kartu, player pilih 1
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT
} from '../config/constants.js';
import { getAllCardsArray } from '../data/cards/index.js';
import { DeckSystem }       from '../systems/DeckSystem.js';

const CHOICES = 3;  // jumlah kartu yang ditawarkan

export class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.REWARD });
    }

    init(data) {
        this.zone          = data.zone         || 1;
        this.floor         = data.floor        || 1;
        this.curseLevel    = data.curseLevel   || 1;
        this.playerData    = data.playerData   || null;
        this.mapData       = data.mapData      || null;
        this.currentNodeId = data.currentNodeId|| 'start';
        this.isTreasure    = data.isTreasure   || false;
    }

    create() {
        this._buildBackground();
        this._buildTitle();
        this._buildCardChoices();
        this._buildSkipButton();
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
        // Ambil 3 kartu random dari pool
        const pool    = getAllCardsArray();
        const choices = this._pickRandom(pool, CHOICES);

        const spacing = 220;
        const startX  = GAME_WIDTH / 2 - (CHOICES - 1) * spacing / 2;

        choices.forEach((card, i) => {
            const x = startX + i * spacing;
            this._createCardChoice(card, x, GAME_HEIGHT / 2, i);
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

        const bg = this.add.rectangle(bx, by, 180, 40, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(bx, by, 'Skip — tidak ambil kartu', {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#556677'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this._goBack());
    }

    // ── Actions ───────────────────────────────────────────────

    _pickCard(card) {
        // Tambah ke deck player
        // Phase 2: playerData masih null, nanti dikoneksi di Step 6
        console.log(`[Reward] Picked card: ${card.name}`);
        this._goBack();
    }

    _goBack() {
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