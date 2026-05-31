// ============================================================
// ShopScene.js — layar merchant
// Beli kartu, jual kartu, purge kartu dari deck
// + Beli equipment, lihat gear terpasang
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, RARITY_COLOR } from '../config/constants.js';
import { getAllCardsArray }   from '../data/cards/index.js';
import { getAllWeapons }      from '../data/weapons/index.js';
import { getAllArmors }       from '../data/armors/index.js';
import { DeckViewerOverlay }  from '../ui/DeckViewerOverlay.js';
import { EquipmentPanel }     from '../ui/EquipmentPanel.js';

const SHOP_CARD_COUNT  = 4;
const SHOP_EQUIP_COUNT = 2;   // jumlah equipment yang dijual
const PURGE_COST       = 50;
const MAX_DECK         = 30;

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

        this.gold = this.playerData?.gold ?? 80;

        this.stock       = this._generateCardStock();
        this.equipStock  = this._generateEquipStock();
    }

    create() {
        this._buildBackground();
        this._buildHeader();
        this._buildCardStock();
        this._buildEquipmentStock();
        this._buildPurgeSection();
        this._buildLeaveButton();
    }

    // ── Background & Header ───────────────────────────────────

    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07080f);
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 60, GAME_HEIGHT - 60, 0x0d0e18)
            .setStrokeStyle(1, 0x222233);
    }

    _buildHeader() {
        this.add.text(GAME_WIDTH / 2, 48, '🏪  Merchant Misterius', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#44aacc', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 75, '"Aku punya apa yang kamu butuhkan... dengan harga yang tepat."', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#334455', fontStyle: 'italic',
        }).setOrigin(0.5);

        // Gold display
        this.goldText = this.add.text(GAME_WIDTH - 80, 48, `💰 ${this.gold}`, {
            fontFamily: 'monospace', fontSize: '16px', color: '#ccaa44',
        }).setOrigin(0.5);

        // Tombol lihat equipment (kanan atas, di bawah gold)
        const eqBg = this.add.rectangle(GAME_WIDTH - 80, 78, 140, 26, 0x111a11)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const eqTxt = this.add.text(GAME_WIDTH - 80, 78, '⚔ Lihat Equipment', {
            fontFamily: 'monospace', fontSize: '10px', color: '#336633',
        }).setOrigin(0.5);

        eqBg.on('pointerover', () => { eqBg.setFillStyle(0x0d2a0d); eqTxt.setColor('#44cc44'); });
        eqBg.on('pointerout',  () => { eqBg.setFillStyle(0x111a11); eqTxt.setColor('#336633'); });
        eqBg.on('pointerdown', () => this._openEquipmentPanel());

        // Garis
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, 96); g.lineTo(GAME_WIDTH - 60, 96);
        g.strokePath();
    }

    // ── Card Stock ────────────────────────────────────────────

    _buildCardStock() {
        this.add.text(80, 108, 'KARTU', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#334455', letterSpacing: 2,
        });

        const spacing = (GAME_WIDTH / 2 - 140) / SHOP_CARD_COUNT;
        const startX  = 80 + spacing / 2;

        this.stock.forEach((item, i) => {
            const x = startX + i * spacing;
            this._createShopCard(item, x, 240, i);
        });
    }

    _createShopCard(item, x, y, index) {
        const w = 140, h = 190;
        const sold = item.sold;

        const bg = this.add.rectangle(x, y, w, h, sold ? 0x0a0a10 : 0x111122)
            .setStrokeStyle(1, sold ? 0x1a1a22 : 0x333355);
        if (!sold) bg.setInteractive({ useHandCursor: true });

        this.add.text(x, y - 68, item.card.name, {
            fontFamily: 'monospace', fontSize: '11px',
            color: sold ? '#222233' : '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: w - 14 },
        }).setOrigin(0.5);

        this.add.text(x, y - 48, `[${item.card.type}]  cost ${item.card.cost}`, {
            fontFamily: 'monospace', fontSize: '9px',
            color: sold ? '#1a1a22' : '#445566',
        }).setOrigin(0.5);

        this.add.text(x, y, item.card.description || '', {
            fontFamily: 'monospace', fontSize: '8px',
            color: sold ? '#1a1a22' : '#667788',
            align: 'center', wordWrap: { width: w - 14 },
        }).setOrigin(0.5);

        // Rarity dot
        if (!sold) {
            const rarityHex = RARITY_COLOR[item.card.rarity] || 0x9e9e9e;
            this.add.circle(x + w / 2 - 10, y - h / 2 + 10, 4, rarityHex);
        }

        const priceColor = sold ? '#1a1a22'
            : this.gold >= item.price ? '#ccaa44' : '#cc4444';
        const priceTxt = this.add.text(x, y + 72, sold ? 'TERJUAL' : `💰 ${item.price}`, {
            fontFamily: 'monospace', fontSize: '12px',
            color: priceColor, fontStyle: 'bold',
        }).setOrigin(0.5);

        if (!sold) {
            bg.on('pointerover', () => { if (this.gold >= item.price) bg.setFillStyle(0x1a1a33); });
            bg.on('pointerout',  () => bg.setFillStyle(0x111122));
            bg.on('pointerdown', () => { if (this.gold >= item.price) this._buyCard(item, priceTxt, bg); });
        }
    }

    // ── Equipment Stock ───────────────────────────────────────

    _buildEquipmentStock() {
        // Garis pemisah vertikal tengah
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 0.6);
        g.moveTo(GAME_WIDTH / 2, 100);
        g.lineTo(GAME_WIDTH / 2, GAME_HEIGHT - 110);
        g.strokePath();

        this.add.text(GAME_WIDTH / 2 + 20, 108, 'EQUIPMENT', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#334455', letterSpacing: 2,
        });

        const startX  = GAME_WIDTH / 2 + 30;
        const spacing = (GAME_WIDTH / 2 - 80) / SHOP_EQUIP_COUNT;

        this.equipStock.forEach((item, i) => {
            const x = startX + i * spacing + spacing / 2;
            this._createShopEquipCard(item, x, 260, i);
        });
    }

    _createShopEquipCard(item, x, y, index) {
        const w = 240, h = 220;
        const sold = item.sold;
        const rarityHex = RARITY_COLOR[item.rarity] || 0x9e9e9e;

        const bg = this.add.rectangle(x, y, w, h, sold ? 0x0a0a10 : 0x0d0d18)
            .setStrokeStyle(1, sold ? 0x1a1a22 : rarityHex);
        if (!sold) bg.setInteractive({ useHandCursor: true });

        // Rarity strip kiri
        if (!sold) {
            this.add.rectangle(x - w / 2 + 2, y, 3, h - 4, rarityHex, 0.7);
        }

        // Slot + nama
        const slotIcons = { weapon:'⚔', kabuto:'🪖', do:'👘', kote:'🥋', suneate:'🥾', accessory:'💍' };
        this.add.text(x - w / 2 + 16, y - h / 2 + 20, slotIcons[item.slot] || '?', {
            fontFamily: 'monospace', fontSize: '18px',
        }).setOrigin(0.5);

        this.add.text(x - w / 2 + 30, y - h / 2 + 14, item.name, {
            fontFamily: 'monospace', fontSize: '12px',
            color: sold ? '#222233' : '#ccddee', fontStyle: 'bold',
            wordWrap: { width: w - 50 },
        }).setOrigin(0, 0.5);

        // Rarity + element
        const rarityHexStr = '#' + rarityHex.toString(16).padStart(6, '0');
        this.add.text(x - w / 2 + 30, y - h / 2 + 30,
            `${_raritySymbol(item.rarity)} ${item.rarity}${item.element ? '  ·  ' + item.element : ''}`, {
                fontFamily: 'monospace', fontSize: '9px',
                color: sold ? '#1a1a22' : rarityHexStr,
            }).setOrigin(0, 0.5);

        // Stat bonus (maks 4 stat)
        if (item.statBonus && !sold) {
            const stats = Object.entries(item.statBonus).slice(0, 4);
            stats.forEach(([k, v], si) => {
                const col = si % 2;
                const row = Math.floor(si / 2);
                this.add.text(
                    x - w / 2 + 12 + col * 110,
                    y - h / 2 + 54 + row * 16,
                    `+${v} ${k.toUpperCase()}`, {
                        fontFamily: 'monospace', fontSize: '9px', color: '#44aa66',
                    });
            });
        }

        // Damage bonus
        if (item.damageBonus && !sold) {
            this.add.text(x + w / 2 - 10, y - h / 2 + 54, `⚔ +${item.damageBonus}`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#cc6644',
            }).setOrigin(1, 0);
        }

        // Deskripsi
        this.add.text(x - w / 2 + 12, y + 20, item.description || '', {
            fontFamily: 'monospace', fontSize: '9px',
            color: sold ? '#1a1a22' : '#445566',
            wordWrap: { width: w - 20 },
        }).setOrigin(0, 0.5);

        // Harga
        const priceColor = sold ? '#1a1a22'
            : this.gold >= item.price ? '#ccaa44' : '#cc4444';
        const priceTxt = this.add.text(x, y + h / 2 - 18,
            sold ? 'TERJUAL' : `💰 ${item.price}`, {
                fontFamily: 'monospace', fontSize: '13px',
                color: priceColor, fontStyle: 'bold',
            }).setOrigin(0.5);

        if (!sold) {
            bg.on('pointerover', () => { if (this.gold >= item.price) { bg.setFillStyle(0x111a22); bg.setStrokeStyle(2, rarityHex); } });
            bg.on('pointerout',  () => { bg.setFillStyle(0x0d0d18); bg.setStrokeStyle(1, rarityHex); });
            bg.on('pointerdown', () => { if (this.gold >= item.price) this._buyEquipment(item, priceTxt, bg); });
        }
    }

    // ── Purge Section ─────────────────────────────────────────

    _buildPurgeSection() {
        const py = GAME_HEIGHT - 100;

        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, py - 16); g.lineTo(GAME_WIDTH - 60, py - 16);
        g.strokePath();

        this.add.text(80, py, 'KELOLA DECK', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#334455', letterSpacing: 2,
        });

        this.add.text(80, py + 20,
            `Total kartu: ${this._totalCards()} / 30    |    Purge: buang 1 kartu seharga 💰 ${PURGE_COST}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#2a3a4a',
            });

        // Tombol Lihat Deck
        const viewBg = this.add.rectangle(GAME_WIDTH - 260, py + 10, 150, 32, 0x0d1a0d)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const viewTxt = this.add.text(GAME_WIDTH - 260, py + 10, '📋 Lihat Deck', {
            fontFamily: 'monospace', fontSize: '11px', color: '#336633',
        }).setOrigin(0.5);

        viewBg.on('pointerover', () => { viewBg.setFillStyle(0x0d2a0d); viewTxt.setColor('#44cc44'); });
        viewBg.on('pointerout',  () => { viewBg.setFillStyle(0x0d1a0d); viewTxt.setColor('#336633'); });
        viewBg.on('pointerdown', () => this._openDeckViewer());

        // Tombol Purge
        const canPurge = this.gold >= PURGE_COST;
        const pbg = this.add.rectangle(GAME_WIDTH - 90, py + 10, 140, 32, 0x0d0d1a)
            .setStrokeStyle(1, canPurge ? 0x442233 : 0x1a1a22);
        if (canPurge) pbg.setInteractive({ useHandCursor: true });

        const ptxt = this.add.text(GAME_WIDTH - 90, py + 10, `Purge  💰 ${PURGE_COST}`, {
            fontFamily: 'monospace', fontSize: '11px',
            color: canPurge ? '#884466' : '#222233',
        }).setOrigin(0.5);

        if (canPurge) {
            pbg.on('pointerover', () => { pbg.setFillStyle(0x1a0d1a); ptxt.setColor('#cc6699'); });
            pbg.on('pointerout',  () => { pbg.setFillStyle(0x0d0d1a); ptxt.setColor('#884466'); });
            pbg.on('pointerdown', () => this._openPurgeViewer());
        }
    }

    // ── Bottom Button ─────────────────────────────────────────

    _buildLeaveButton() {
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 34, 180, 32, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, '← Kembali ke Peta', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#556677'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this._leave());
    }

    // ── Equipment Panel ───────────────────────────────────────

    _openEquipmentPanel() {
        EquipmentPanel.show(this.scene.scene, this.playerData, {
            canUnequip: true,
            onChange: (updatedData, action, slot, item) => {
                // Sync playerData lokal
                this.playerData = updatedData;
                this.gold       = updatedData.gold ?? this.gold;
                this.goldText?.setText(`💰 ${this.gold}`);
            },
        });
    }

    // ── Actions ───────────────────────────────────────────────

    _buyCard(item, priceTxt, bg) {
        const totalCards = this._totalCards();
        if (totalCards >= MAX_DECK) {
            this._showNotif('Deck sudah penuh! (max 30)', '#cc4444');
            return;
        }

        this.gold    -= item.price;
        item.sold     = true;

        if (this.playerData) {
            this.playerData.gold    = this.gold;
            this.playerData.discard = this.playerData.discard || [];
            this.playerData.discard.push({ ...item.card });
        }

        this.goldText.setText(`💰 ${this.gold}`);
        priceTxt.setText('TERJUAL').setColor('#222233');
        bg.setFillStyle(0x0a0a10).setStrokeStyle(1, 0x1a1a22).disableInteractive();
    }

    _buyEquipment(item, priceTxt, bg) {
        this.gold -= item.price;
        item.sold  = true;

        if (this.playerData) {
            this.playerData.gold      = this.gold;
            this.playerData.equipment = this.playerData.equipment || {};

            // Equip langsung ke slot
            const old = this.playerData.equipment[item.slot];
            this.playerData.equipment[item.slot] = item;

            const msg = old
                ? `${item.name} terpasang! (${old.name} dilepas)`
                : `${item.name} terpasang ke slot ${item.slot}!`;
            this._showNotif(msg, '#44cc88');
        }

        this.goldText.setText(`💰 ${this.gold}`);
        priceTxt.setText('TERJUAL').setColor('#222233');
        bg.setFillStyle(0x0a0a10).setStrokeStyle(1, 0x1a1a22).disableInteractive();
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
        if (this.gold < PURGE_COST) {
            this._showNotif(`Gold tidak cukup! Butuh 💰 ${PURGE_COST}`, '#cc4444');
            return;
        }

        const allCards = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
        ];

        if (!allCards.length) {
            this._showNotif('Deck kosong, tidak ada kartu untuk dipurge.', '#cc4444');
            return;
        }

        DeckViewerOverlay.show(this, allCards, {
            canPurge:   true,
            purgePrice: PURGE_COST,
            onPurge: (card) => {
                if (this.gold < PURGE_COST) {
                    this._showNotif(`Gold tidak cukup! Butuh 💰 ${PURGE_COST}`, '#cc4444');
                    return;
                }

                this.gold = Math.max(0, this.gold - PURGE_COST);
                if (this.playerData) this.playerData.gold = this.gold;
                this.goldText?.setText(`💰 ${this.gold}`);

                const deck = this.playerData?.deck    || [];
                const disc = this.playerData?.discard || [];
                let idx    = deck.findIndex(c => c.id === card.id);
                if (idx !== -1) deck.splice(idx, 1);
                else {
                    idx = disc.findIndex(c => c.id === card.id);
                    if (idx !== -1) disc.splice(idx, 1);
                }

                this._showNotif(`${card.name} dibuang dari deck.`, '#cc6666');

                if (this.gold >= PURGE_COST && (deck.length || disc.length)) {
                    this.time.delayedCall(300, () => this._openPurgeViewer());
                }
            },
        });
    }

    _showNotif(msg, color = '#ffffff') {
        if (this._notifTxt) { try { this._notifTxt.destroy(); } catch(e) {} }
        this._notifTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, msg, {
            fontFamily: 'monospace', fontSize: '14px',
            color, fontStyle: 'bold',
            backgroundColor: '#0a0a14', padding: { x: 10, y: 6 },
        }).setOrigin(0.5).setDepth(10);
        this.time.delayedCall(2000, () => { if (this._notifTxt?.active) this._notifTxt.destroy(); });
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

    _totalCards() {
        return (this.playerData?.deck?.length    || 0) +
               (this.playerData?.discard?.length || 0) +
               (this.playerData?.hand?.length    || 0);
    }

    _generateCardStock() {
        const all        = getAllCardsArray();
        const playerDeck = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
            ...(this.playerData?.hand    || []),
        ];
        const ownedUpgradeIds = new Set(
            playerDeck.filter(c => c.upgradedId).map(c => c.upgradedId)
        );
        const pool = all.filter(c => !c.isUpgraded && !ownedUpgradeIds.has(c.id));
        const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, SHOP_CARD_COUNT);
        return pick.map(card => ({ card, price: this._cardPrice(card), sold: false }));
    }

    _generateEquipStock() {
        const all  = [...getAllWeapons(), ...getAllArmors()];
        const pick = [...all].sort(() => Math.random() - 0.5).slice(0, SHOP_EQUIP_COUNT);
        return pick.map(item => ({ ...item, price: this._equipPrice(item), sold: false }));
    }

    _cardPrice(card) {
        const base = { common: 40, uncommon: 70, rare: 110, epic: 160, legendary: 220 };
        return base[card.rarity] || 40 + card.cost * 10;
    }

    _equipPrice(item) {
        const base = { common: 60, uncommon: 100, rare: 160, epic: 240, legendary: 360 };
        return base[item.rarity] || 80;
    }
}

// ── Module helpers ────────────────────────────────────────────

function _raritySymbol(rarity) {
    return { common:'○', uncommon:'◆', rare:'★', epic:'✦', legendary:'✸' }[rarity] ?? '○';
}