// ============================================================
// ShopScene.js — layar merchant
// Beli kartu, jual kartu, purge kartu dari deck
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT
} from '../config/constants.js';
import { getAllCardsArray } from '../data/cards/index.js';

const SHOP_CARD_COUNT  = 4;   // kartu yang dijual di shop
const PURGE_COST       = 50;  // gold untuk hapus 1 kartu dari deck

export class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.SHOP });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    ? JSON.parse(JSON.stringify(data.playerData)) : null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        // Gold player dari playerData
        this.gold = this.playerData?.gold ?? 80;

        // Generate stock toko
        this.stock = this._generateStock();
    }

    create() {
        this._buildBackground();
        this._buildHeader();
        this._buildStock();
        this._buildPurgeSection();
        this._buildLeaveButton();
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x07080f
        );

        // Dekorasi panel toko
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 60, GAME_HEIGHT - 60, 0x0d0e18)
            .setStrokeStyle(1, 0x222233);
    }

    _buildHeader() {
        this.add.text(GAME_WIDTH / 2, 55, '🏪  Merchant Misterius', {
            fontFamily: 'monospace',
            fontSize:   '24px',
            color:      '#44aacc',
            fontStyle:  'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 85, '"Aku punya apa yang kamu butuhkan... dengan harga yang tepat."', {
            fontFamily: 'monospace',
            fontSize:   '11px',
            color:      '#334455',
            fontStyle:  'italic',
        }).setOrigin(0.5);

        // Gold display
        this.goldText = this.add.text(GAME_WIDTH - 80, 55, `💰 ${this.gold}`, {
            fontFamily: 'monospace',
            fontSize:   '16px',
            color:      '#ccaa44',
        }).setOrigin(0.5);

        // Garis
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, 100); g.lineTo(GAME_WIDTH - 60, 100);
        g.strokePath();
    }

    _buildStock() {
        this.add.text(80, 118, 'KARTU TERSEDIA', {
            fontFamily: 'monospace',
            fontSize:   '11px',
            color:      '#334455',
            letterSpacing: 2,
        });

        const spacing = (GAME_WIDTH - 160) / SHOP_CARD_COUNT;
        const startX  = 80 + spacing / 2;

        this.stock.forEach((item, i) => {
            const x = startX + i * spacing;
            this._createShopCard(item, x, 270, i);
        });
    }

    _createShopCard(item, x, y, index) {
        const w = 150, h = 200;
        const sold = item.sold;

        const bg = this.add.rectangle(x, y, w, h, sold ? 0x0a0a10 : 0x111122)
            .setStrokeStyle(1, sold ? 0x1a1a22 : 0x333355);

        if (!sold) bg.setInteractive({ useHandCursor: true });

        // Nama
        this.add.text(x, y - 70, item.card.name, {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      sold ? '#222233' : '#ffffff',
            fontStyle:  'bold',
            align:      'center',
            wordWrap:   { width: w - 16 },
        }).setOrigin(0.5);

        // Tipe
        this.add.text(x, y - 48, `[${item.card.type}]  cost ${item.card.cost}`, {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      sold ? '#1a1a22' : '#445566',
        }).setOrigin(0.5);

        // Deskripsi
        this.add.text(x, y, item.card.description || '', {
            fontFamily: 'monospace',
            fontSize:   '9px',
            color:      sold ? '#1a1a22' : '#667788',
            align:      'center',
            wordWrap:   { width: w - 16 },
        }).setOrigin(0.5);

        // Harga
        const priceColor = sold
            ? '#1a1a22'
            : this.gold >= item.price ? '#ccaa44' : '#cc4444';

        const priceTxt = this.add.text(x, y + 75, sold ? 'TERJUAL' : `💰 ${item.price}`, {
            fontFamily: 'monospace',
            fontSize:   '13px',
            color:      priceColor,
            fontStyle:  'bold',
        }).setOrigin(0.5);

        if (!sold) {
            bg.on('pointerover', () => {
                if (this.gold >= item.price) bg.setFillStyle(0x1a1a33);
            });
            bg.on('pointerout', () => bg.setFillStyle(0x111122));
            bg.on('pointerdown', () => {
                if (this.gold >= item.price) {
                    this._buyCard(item, index, priceTxt, bg);
                }
            });
        }
    }

    _buildPurgeSection() {
        const py = GAME_HEIGHT - 160;

        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, py - 20); g.lineTo(GAME_WIDTH - 60, py - 20);
        g.strokePath();

        this.add.text(80, py, 'PURGE KARTU', {
            fontFamily: 'monospace',
            fontSize:   '11px',
            color:      '#334455',
            letterSpacing: 2,
        });

        this.add.text(80, py + 22, `Hapus 1 kartu dari deckmu seharga 💰 ${PURGE_COST}. Deck yang ramping, deck yang kuat.`, {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      '#2a3a4a',
            wordWrap:   { width: GAME_WIDTH - 280 },
        });

        const canPurge = this.gold >= PURGE_COST;
        const pbg = this.add.rectangle(GAME_WIDTH - 120, py + 22, 140, 36, 0x0d0d1a)
            .setStrokeStyle(1, canPurge ? 0x442233 : 0x1a1a22);

        if (canPurge) pbg.setInteractive({ useHandCursor: true });

        const ptxt = this.add.text(GAME_WIDTH - 120, py + 22, `Purge  💰 ${PURGE_COST}`, {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      canPurge ? '#884466' : '#222233',
        }).setOrigin(0.5);

        if (canPurge) {
            pbg.on('pointerover', () => { pbg.setFillStyle(0x1a0d1a); ptxt.setColor('#cc6699'); });
            pbg.on('pointerout',  () => { pbg.setFillStyle(0x0d0d1a); ptxt.setColor('#884466'); });
            pbg.on('pointerdown', () => {
                // Phase 2 Step 6: koneksi ke deck player
                console.log('[Shop] Purge card — belum dikoneksi ke player');
            });
        }
    }

    _buildLeaveButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 50;

        const bg = this.add.rectangle(bx, by, 180, 36, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
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

    _buyCard(item, index, priceTxt, bg) {
        this.gold -= item.price;
        item.sold  = true;

        // Update gold di playerData
        if (this.playerData) {
            this.playerData.gold = this.gold;

            // Tambah kartu ke discard pile player
            this.playerData.discard = this.playerData.discard || [];
            this.playerData.discard.push({ ...item.card });
        }

        this.goldText.setText(`💰 ${this.gold}`);
        priceTxt.setText('TERJUAL').setColor('#222233');
        bg.setFillStyle(0x0a0a10).setStrokeStyle(1, 0x1a1a22).disableInteractive();

        console.log(`[Shop] Bought: ${item.card.name} for ${item.price} gold`);
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

    // ── Helpers ───────────────────────────────────────────────

    _generateStock() {
        const all  = getAllCardsArray();
        const pick = [...all].sort(() => Math.random() - 0.5).slice(0, SHOP_CARD_COUNT);
        return pick.map(card => ({
            card,
            price: this._cardPrice(card),
            sold:  false,
        }));
    }

    _cardPrice(card) {
        const base = { common: 40, uncommon: 70, rare: 110, epic: 160, legendary: 220 };
        return base[card.rarity] || 40 + card.cost * 10;
    }
}