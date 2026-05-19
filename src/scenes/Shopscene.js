// ============================================================
// ShopScene.js — layar merchant
// Beli kartu, jual kartu, purge kartu dari deck
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { getAllCardsArray }   from '../data/cards/index.js';
import { DeckViewerOverlay }  from '../ui/DeckViewerOverlay.js';

const SHOP_CARD_COUNT = 4;
const PURGE_COST      = 50;
const MAX_DECK        = 30;

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

        this.add.text(80, py, 'KELOLA DECK', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 2,
        });

        this.add.text(80, py + 22,
            `Total kartu: ${this._totalCards()}  /  30    |    Purge: buang 1 kartu seharga 💰 ${PURGE_COST}`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#2a3a4a',
        });

        // Tombol Lihat Deck
        const viewBg = this.add.rectangle(GAME_WIDTH - 250, py + 22, 140, 36, 0x0d1a0d)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const viewTxt = this.add.text(GAME_WIDTH - 250, py + 22, '📋 Lihat Deck', {
            fontFamily: 'monospace', fontSize: '12px', color: '#336633',
        }).setOrigin(0.5);

        viewBg.on('pointerover', () => { viewBg.setFillStyle(0x0d2a0d); viewTxt.setColor('#44cc44'); });
        viewBg.on('pointerout',  () => { viewBg.setFillStyle(0x0d1a0d); viewTxt.setColor('#336633'); });
        viewBg.on('pointerdown', () => this._openDeckViewer());

        // Tombol Purge
        const canPurge = this.gold >= PURGE_COST;
        const pbg = this.add.rectangle(GAME_WIDTH - 90, py + 22, 140, 36, 0x0d0d1a)
            .setStrokeStyle(1, canPurge ? 0x442233 : 0x1a1a22);

        if (canPurge) pbg.setInteractive({ useHandCursor: true });

        const ptxt = this.add.text(GAME_WIDTH - 90, py + 22, `Purge  💰 ${PURGE_COST}`, {
            fontFamily: 'monospace', fontSize: '12px',
            color: canPurge ? '#884466' : '#222233',
        }).setOrigin(0.5);

        if (canPurge) {
            pbg.on('pointerover', () => { pbg.setFillStyle(0x1a0d1a); ptxt.setColor('#cc6699'); });
            pbg.on('pointerout',  () => { pbg.setFillStyle(0x0d0d1a); ptxt.setColor('#884466'); });
            pbg.on('pointerdown', () => this._openPurgeViewer());
        }
    }

    _totalCards() {
        return (this.playerData?.deck?.length    || 0) +
               (this.playerData?.discard?.length || 0) +
               (this.playerData?.hand?.length    || 0);
    }

    _openDeckViewer() {
        const allCards = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
            ...(this.playerData?.hand    || []),
        ];
        DeckViewerOverlay.show(this, allCards, { canPurge: false, canUpgrade: false });
    }

    _openPurgeViewer() {
        const allCards = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
        ];
        DeckViewerOverlay.show(this, allCards, {
            canPurge:   true,
            purgePrice: PURGE_COST,
            onPurge: (card) => {
                // Kurangi gold
                this.gold -= PURGE_COST;
                if (this.playerData) this.playerData.gold = this.gold;
                this.goldText?.setText(`💰 ${this.gold}`);

                // Hapus kartu dari deck/discard
                const deck = this.playerData?.deck || [];
                const disc = this.playerData?.discard || [];
                let idx = deck.findIndex(c => c.id === card.id);
                if (idx !== -1) { deck.splice(idx, 1); }
                else {
                    idx = disc.findIndex(c => c.id === card.id);
                    if (idx !== -1) disc.splice(idx, 1);
                }

                this._showNotif(`${card.name} dibuang dari deck.`, '#cc6666');

                // Buka ulang purge viewer dengan deck yang sudah diupdate
                this.time.delayedCall(300, () => this._openPurgeViewer());
            },
        });
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
        // Cek deck penuh
        const totalCards = (this.playerData?.deck?.length    || 0) +
                           (this.playerData?.discard?.length || 0) +
                           (this.playerData?.hand?.length    || 0);

        if (totalCards >= MAX_DECK) {
            this._showNotif('Deck sudah penuh! (max 30)', '#cc4444');
            return;
        }

        this.gold -= item.price;
        item.sold  = true;

        if (this.playerData) {
            this.playerData.gold = this.gold;
            this.playerData.discard = this.playerData.discard || [];
            this.playerData.discard.push({ ...item.card });
        }

        this.goldText.setText(`💰 ${this.gold}`);
        priceTxt.setText('TERJUAL').setColor('#222233');
        bg.setFillStyle(0x0a0a10).setStrokeStyle(1, 0x1a1a22).disableInteractive();
    }

    _showNotif(msg, color = '#ffffff') {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, msg, {
            fontFamily: 'monospace', fontSize: '16px',
            color, fontStyle: 'bold',
            backgroundColor: '#0a0a14', padding: { x: 10, y: 6 },
        }).setOrigin(0.5).setDepth(10);
        this.time.delayedCall(2000, () => txt.destroy());
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
        const all = getAllCardsArray();

        // Ambil semua kartu yang dimiliki player
        const playerDeck = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
            ...(this.playerData?.hand    || []),
        ];

        // ID kartu yang sudah dimiliki versi upgrade-nya
        const ownedUpgradeIds = new Set(
            playerDeck
                .filter(c => c.upgradedId)
                .map(c => c.upgradedId)
        );

        // Filter pool:
        // 1. Jangan jual kartu isUpgraded (versi upgrade tidak dijual)
        // 2. Jangan jual kartu yang versi upgrade-nya sudah dimiliki
        const pool = all.filter(c => {
            if (c.isUpgraded) return false;
            if (ownedUpgradeIds.has(c.id)) return false;
            return true;
        });

        const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, SHOP_CARD_COUNT);
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