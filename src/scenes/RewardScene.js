// ============================================================
// RewardScene.js — layar pilih reward setelah menang combat
// Menampilkan gold + pilihan kartu + equipment drop (kalau ada)
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, RARITY_COLOR } from '../config/constants.js';
import { getAllCardsArray }   from '../data/cards/index.js';
import { DeckViewerOverlay } from '../ui/DeckViewerOverlay.js';

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
        this._buildEquipmentSection();
        this._buildCardChoices();
        this._buildSkipButton();
    }

    // ── Background & Title ────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x08080f
        );

        // Grid garis halus
        const g = this.add.graphics();
        g.lineStyle(1, 0x0d0d1a, 0.5);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();
    }

    _buildTitle() {
        const title = this.isTreasure ? '💎  Treasure Room' : '✦  Victory  ✦';
        const sub   = this.isTreasure
            ? 'Pilih satu kartu sebagai hadiahmu.'
            : `B${this.floor} cleared!  Pilih satu kartu untuk deckmu.`;

        this.add.text(GAME_WIDTH / 2, 48, title, {
            fontFamily: 'monospace', fontSize: '26px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 86, sub, {
            fontFamily: 'monospace', fontSize: '13px', color: '#445566',
        }).setOrigin(0.5);
    }

    _buildGoldReward() {
        if (!this.loot?.gold) return;
        this.add.text(GAME_WIDTH / 2, 118, `💰  +${this.loot.gold} Gold`, {
            fontFamily: 'monospace', fontSize: '17px',
            color: '#ccaa44', fontStyle: 'bold',
        }).setOrigin(0.5);
    }

    // ── Equipment Section ─────────────────────────────────────

    _buildEquipmentSection() {
        const items = this.loot?.equipment;
        if (!items || items.length === 0) return;

        // Label section
        this.add.text(GAME_WIDTH / 2, 148, '⚔  Equipment Drop', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 2,
        }).setOrigin(0.5);

        const spacing = Math.min(280, (GAME_WIDTH - 200) / items.length);
        const startX  = GAME_WIDTH / 2 - (items.length - 1) * spacing / 2;

        items.forEach((item, i) => {
            this._createEquipmentCard(item, startX + i * spacing, 238);
        });
    }

    /**
     * Buat satu kartu equipment di posisi x, y.
     * Desain lebih compact dari card kartu — lebar 200px, tinggi 88px.
     */
    _createEquipmentCard(item, x, y) {
        const w = 200, h = 88;

        // Warna border berdasarkan rarity
        const rarityHex = RARITY_COLOR[item.rarity] || 0x9e9e9e;

        const bg = this.add.rectangle(x, y, w, h, 0x0d0d18)
            .setStrokeStyle(1, rarityHex)
            .setInteractive({ useHandCursor: true });

        // Rarity bar di kiri — strip vertikal tipis
        this.add.rectangle(x - w / 2 + 3, y, 4, h - 4, rarityHex, 0.8)
            .setOrigin(0, 0.5)
            .setX(x - w / 2 + 2);

        // Slot icon
        const slotIcon = {
            weapon:    '⚔',
            kabuto:    '🪖',
            do:        '👘',
            kote:      '🥋',
            suneate:   '🥾',
            accessory: '💍',
        };
        this.add.text(x - w / 2 + 18, y - 28, slotIcon[item.slot] || '?', {
            fontFamily: 'monospace', fontSize: '16px',
        }).setOrigin(0.5);

        // Nama item
        this.add.text(x - w / 2 + 35, y - 26, item.name, {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#ccddee', fontStyle: 'bold',
        }).setOrigin(0, 0.5);

        // Rarity + element badge
        const rarityLabel = _rarityLabel(item.rarity);
        const elemLabel   = item.element ? ` · ${item.element}` : '';
        this.add.text(x - w / 2 + 35, y - 10, `${rarityLabel}${elemLabel}`, {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#' + rarityHex.toString(16).padStart(6, '0'),
        }).setOrigin(0, 0.5);

        // Stat bonus preview (maks 3 stat)
        if (item.statBonus) {
            const statStr = Object.entries(item.statBonus)
                .slice(0, 3)
                .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                .join('  ');
            this.add.text(x - w / 2 + 12, y + 10, statStr, {
                fontFamily: 'monospace', fontSize: '10px', color: '#44aa66',
            }).setOrigin(0, 0.5);
        }

        // Damage bonus (weapon)
        if (item.damageBonus) {
            this.add.text(x + w / 2 - 10, y + 10, `⚔ +${item.damageBonus}`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#cc6644',
            }).setOrigin(1, 0.5);
        }

        // Deskripsi singkat
        this.add.text(x - w / 2 + 12, y + 28, item.description || '', {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#445566',
            wordWrap: { width: w - 20 },
        }).setOrigin(0, 0.5);

        // Hover effect
        bg.on('pointerover', () => {
            bg.setFillStyle(0x111a22);
            bg.setStrokeStyle(2, rarityHex);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x0d0d18);
            bg.setStrokeStyle(1, rarityHex);
        });

        // Klik — equip item langsung ke playerData
        bg.on('pointerdown', () => this._pickEquipment(item, bg));
    }

    // ── Card Choices ──────────────────────────────────────────

    _buildCardChoices() {
        const hasEquip = (this.loot?.equipment?.length || 0) > 0;

        // Geser card choices ke bawah kalau ada equipment section
        const baseY = hasEquip ? GAME_HEIGHT / 2 + 68 : GAME_HEIGHT / 2 + 10;

        this.add.text(GAME_WIDTH / 2, baseY - 42, '📚  Pilih Kartu', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 2,
        }).setOrigin(0.5);

        const choices = this.loot?.cardChoices
            ? this.loot.cardChoices
            : this._pickRandom(getAllCardsArray(), 3);

        const spacing = Math.min(220, (GAME_WIDTH - 200) / Math.max(choices.length, 1));
        const startX  = GAME_WIDTH / 2 - (choices.length - 1) * spacing / 2;

        choices.forEach((card, i) => {
            this._createCardChoice(card, startX + i * spacing, baseY + 64);
        });
    }

    _createCardChoice(card, x, y) {
        const w = 155, h = 185;

        const typeColors = {
            attack:  0xcc4444,
            defense: 0x4444cc,
            magic:   0xaa44cc,
            support: 0x44aa44,
        };
        const bColor = typeColors[card.type] || 0x444466;

        const bg = this.add.rectangle(x, y, w, h, 0x111122)
            .setStrokeStyle(1, 0x333355)
            .setInteractive({ useHandCursor: true });

        // Type color bar
        this.add.rectangle(x, y - h / 2 + 11, w - 4, 18, bColor, 0.6);

        // Cost
        this.add.text(x - w / 2 + 11, y - h / 2 + 5, `${card.cost}`, {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0, 0.5);

        // Nama
        this.add.text(x, y - 55, card.name, {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: w - 16 },
        }).setOrigin(0.5);

        // Tipe
        this.add.text(x, y - 34, `[${card.type}]`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#445566',
        }).setOrigin(0.5);

        // Deskripsi
        this.add.text(x, y + 5, card.description || '', {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#8899aa', align: 'center',
            wordWrap: { width: w - 20 },
        }).setOrigin(0.5);

        // Flavor text
        if (card.flavorText) {
            this.add.text(x, y + 60, card.flavorText, {
                fontFamily: 'monospace', fontSize: '8px',
                color: '#334455', fontStyle: 'italic',
                align: 'center', wordWrap: { width: w - 20 },
            }).setOrigin(0.5);
        }

        // Rarity dot
        const rarityHex = RARITY_COLOR[card.rarity] || 0x9e9e9e;
        this.add.circle(x + w / 2 - 10, y - h / 2 + 11, 4, rarityHex);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x1a1a33);
            bg.setStrokeStyle(2, bColor);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x111122);
            bg.setStrokeStyle(1, 0x333355);
        });
        bg.on('pointerdown', () => this._pickCard(card));
    }

    // ── Bottom Buttons ────────────────────────────────────────

    _buildSkipButton() {
        const by = GAME_HEIGHT - 34;

        // Tombol lihat deck
        const viewBg = this.add.rectangle(GAME_WIDTH / 2 - 130, by, 160, 32, 0x0d1a0d)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const viewTxt = this.add.text(GAME_WIDTH / 2 - 130, by, '📋 Lihat Deck', {
            fontFamily: 'monospace', fontSize: '11px', color: '#336633',
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
        const skipBg = this.add.rectangle(GAME_WIDTH / 2 + 80, by, 200, 32, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const skipTxt = this.add.text(GAME_WIDTH / 2 + 80, by, 'Skip — tidak ambil kartu', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);

        skipBg.on('pointerover', () => skipTxt.setColor('#556677'));
        skipBg.on('pointerout',  () => skipTxt.setColor('#334455'));
        skipBg.on('pointerdown', () => this._goNext());
    }

    // ── Actions ───────────────────────────────────────────────

    /**
     * Player memilih equipment — langsung masuk ke slot yang sesuai.
     * Kalau slot sudah terisi, item lama masuk ke inventory (tidak dibuang).
     */
    _pickEquipment(item, cardBg) {
        if (!this.playerData) {
            this._goNext();
            return;
        }

        // Simpan di equipment playerData
        this.playerData.equipment = this.playerData.equipment || {};
        const oldItem = this.playerData.equipment[item.slot] || null;
        this.playerData.equipment[item.slot] = item;

        // Tandai visual card sudah diambil
        cardBg.setFillStyle(0x111a11);
        cardBg.setStrokeStyle(2, 0x44cc66);
        cardBg.disableInteractive();

        // Feedback
        const msg = oldItem
            ? `${item.name} terpasang! (${oldItem.name} dilepas)`
            : `${item.name} terpasang ke slot ${item.slot}!`;
        this._showFeedback(msg, '#44cc66');
    }

    _pickCard(card) {
        if (!this.playerData) {
            this._goNext();
            return;
        }

        const totalCards = (this.playerData.deck?.length    || 0) +
                           (this.playerData.discard?.length || 0) +
                           (this.playerData.hand?.length    || 0);

        if (totalCards >= 30) {
            this._showFeedback('Deck sudah penuh! (max 30 kartu)', '#cc4444');
            return;
        }

        this.playerData.discard = this.playerData.discard || [];
        this.playerData.discard.push({ ...card });

        this._goNext();
    }

    _showFeedback(msg, color = '#ffffff') {
        // Hapus feedback lama kalau ada
        if (this._feedbackTxt) {
            try { this._feedbackTxt.destroy(); } catch(e) {}
        }

        this._feedbackTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, msg, {
            fontFamily: 'monospace', fontSize: '14px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10);

        this.time.delayedCall(2000, () => {
            if (this._feedbackTxt?.active) this._feedbackTxt.destroy();
        });
    }

    _goNext() {
        const nextFloor   = this.floor + 1;
        const nextZone    = Math.ceil(nextFloor / 10);
        const isBossFloor = this.floor % 10 === 0;

        if (this.floor >= 100) {
            this.scene.start(SCENE.VICTORY, {
                floor:      this.floor,
                curseLevel: this.curseLevel,
                playerData: this.playerData,
            });
            return;
        }

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

        if (this.currentNodeId === 'mini_boss') {
            this.scene.start(SCENE.NODE_MAP, {
                zone:          this.zone,
                floor:         nextFloor,
                curseLevel:    this.curseLevel,
                playerData:    this.playerData,
                mapData:       null,
                currentNodeId: 'start',
            });
            return;
        }

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
        return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
    }
}

// ── Module helpers ────────────────────────────────────────────

function _rarityLabel(rarity) {
    const map = {
        common:    '○ Common',
        uncommon:  '◆ Uncommon',
        rare:      '★ Rare',
        epic:      '✦ Epic',
        legendary: '✸ Legendary',
    };
    return map[rarity] ?? rarity;
}