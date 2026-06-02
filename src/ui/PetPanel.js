// ============================================================
// ui/PetPanel.js — overlay panel pet
// Tampilkan 1 slot pet, lihat passive, ganti pet
// Dipanggil dari NodeMapScene atau ShopScene
// ============================================================

import { RARITY_COLOR } from '../config/constants.js';
import { getAllPets, getPet } from '../data/pets/index.js';

const RARITY_ORDER = ['common', 'rare', 'ancient', 'mythic', 'divine'];

export class PetPanel {

    /**
     * @param {Phaser.Scene} scene
     * @param {object}       playerData
     * @param {object}       opts
     * @param {boolean}      opts.canSwap   — tampilkan daftar pet yang dimiliki? (default false)
     * @param {string[]}     opts.ownedPets — array id pet yang dimiliki player
     * @param {function}     opts.onClose
     * @param {function}     opts.onChange  — callback(playerData, action, petId)
     */
    static show(scene, playerData, opts = {}) {
        const panel = new PetPanel(scene, playerData, opts);
        panel._build();
        return panel;
    }

    constructor(scene, playerData, opts = {}) {
        this.scene      = scene;
        this.playerData = playerData;
        this.canSwap    = opts.canSwap    ?? false;
        this.ownedPets  = opts.ownedPets  || [];
        this.onClose    = opts.onClose    || null;
        this.onChange   = opts.onChange   || null;

        this._objects   = [];
    }

    // ── Build ─────────────────────────────────────────────────

    _build() {
        const W  = 700, H = 460;
        const cx = this.scene.cameras.main.width  / 2;
        const cy = this.scene.cameras.main.height / 2;

        // Backdrop
        const backdrop = this.scene.add.rectangle(cx, cy,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000, 0.75
        ).setDepth(40).setInteractive();
        this._objects.push(backdrop);

        // Panel
        const panel = this.scene.add.rectangle(cx, cy, W, H, 0x0d0e18)
            .setStrokeStyle(1, 0x223344).setDepth(41);
        this._objects.push(panel);

        // Header
        const header = this.scene.add.text(cx, cy - H / 2 + 26, '🐾  Pet', {
            fontFamily: 'monospace', fontSize: '18px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(42);
        this._objects.push(header);

        const sub = this.scene.add.text(cx, cy - H / 2 + 46,
            'Pet memberikan passive buff permanen selama run  ·  Maks 1 slot', {
                fontFamily: 'monospace', fontSize: '10px', color: '#334455',
            }).setOrigin(0.5).setDepth(42);
        this._objects.push(sub);

        // Garis
        const g = this.scene.add.graphics().setDepth(42);
        g.lineStyle(1, 0x1a1a2e);
        g.moveTo(cx - W / 2 + 24, cy - H / 2 + 58);
        g.lineTo(cx + W / 2 - 24, cy - H / 2 + 58);
        g.strokePath();
        this._objects.push(g);

        // Tutup
        const closeBg = this.scene.add.rectangle(cx + W / 2 - 20, cy - H / 2 + 20, 28, 28, 0x0d0d1a)
            .setStrokeStyle(1, 0x332233)
            .setInteractive({ useHandCursor: true }).setDepth(43);
        const closeTxt = this.scene.add.text(cx + W / 2 - 20, cy - H / 2 + 20, '✕', {
            fontFamily: 'monospace', fontSize: '14px', color: '#442233',
        }).setOrigin(0.5).setDepth(44);
        closeBg.on('pointerover', () => { closeBg.setFillStyle(0x1a0d1a); closeTxt.setColor('#cc4466'); });
        closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x0d0d1a); closeTxt.setColor('#442233'); });
        closeBg.on('pointerdown', () => this.close());
        this._objects.push(closeBg, closeTxt);

        // Layout: kiri = pet aktif, kanan = daftar pet
        const petActiveX = cx - 120;
        const listX      = cx + 100;
        const contentY   = cy - H / 2 + 80;

        this._buildActivePet(petActiveX, cy, W, H, contentY);

        if (this.canSwap && this.ownedPets.length > 0) {
            this._buildPetList(listX, cy, W, H, contentY);
        }
    }

    // ── Active Pet Card ───────────────────────────────────────

    _buildActivePet(x, cy, W, H, topY) {
        const petId = this.playerData?.pet || null;
        const pet   = petId ? getPet(petId) : null;
        const cardW = 260, cardH = 320;
        const cardY = topY + cardH / 2 + 10;

        const rarityHex = pet ? (RARITY_COLOR[pet.rarity] || 0x9e9e9e) : 0x1a1a2e;

        // Card
        const bg = this.scene.add.rectangle(x, cardY, cardW, cardH, pet ? 0x0f111e : 0x0a0a14)
            .setStrokeStyle(1, rarityHex).setDepth(42);
        this._objects.push(bg);

        // Label slot
        const slotLbl = this.scene.add.text(x, cardY - cardH / 2 + 14, 'PET AKTIF', {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#223344', letterSpacing: 2,
        }).setOrigin(0.5).setDepth(43);
        this._objects.push(slotLbl);

        if (pet) {
            // Rarity strip
            const strip = this.scene.add.rectangle(x - cardW / 2 + 2, cardY, 3, cardH - 4, rarityHex, 0.8)
                .setDepth(43);
            this._objects.push(strip);

            // Icon elemen
            const elemIcon = this.scene.add.text(x, cardY - cardH / 2 + 50, _elementIcon(pet.element), {
                fontFamily: 'monospace', fontSize: '36px',
            }).setOrigin(0.5).setDepth(43);
            this._objects.push(elemIcon);

            // Nama
            const nameTxt = this.scene.add.text(x, cardY - cardH / 2 + 96, pet.name, {
                fontFamily: 'monospace', fontSize: '14px',
                color: '#ccddee', fontStyle: 'bold',
            }).setOrigin(0.5).setDepth(43);
            this._objects.push(nameTxt);

            // Rarity badge
            const rarHexStr = '#' + rarityHex.toString(16).padStart(6, '0');
            const rarBadge = this.scene.add.text(x, cardY - cardH / 2 + 114,
                `${_raritySymbol(pet.rarity)} ${pet.rarity}  ·  ${pet.element}`, {
                    fontFamily: 'monospace', fontSize: '9px', color: rarHexStr,
                }).setOrigin(0.5).setDepth(43);
            this._objects.push(rarBadge);

            // Passive list
            const passiveHeader = this.scene.add.text(x - cardW / 2 + 16, cardY - cardH / 2 + 138,
                'PASSIVE:', {
                    fontFamily: 'monospace', fontSize: '9px', color: '#334455', letterSpacing: 1,
                }).setOrigin(0, 0.5).setDepth(43);
            this._objects.push(passiveHeader);

            const passTxt = this.scene.add.text(x - cardW / 2 + 16, cardY - cardH / 2 + 158,
                pet.description, {
                    fontFamily: 'monospace', fontSize: '10px', color: '#44aa66',
                    wordWrap: { width: cardW - 28 },
                }).setOrigin(0, 0).setDepth(43);
            this._objects.push(passTxt);

            // Flavor text
            if (pet.flavorText) {
                const flavor = this.scene.add.text(x, cardY + cardH / 2 - 54, pet.flavorText, {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: '#334455', fontStyle: 'italic',
                    align: 'center', wordWrap: { width: cardW - 24 },
                }).setOrigin(0.5).setDepth(43);
                this._objects.push(flavor);
            }

            // Tombol lepas
            const remBg = this.scene.add.rectangle(x, cardY + cardH / 2 - 20, cardW - 32, 22, 0x1a0d0d)
                .setStrokeStyle(1, 0x442222)
                .setInteractive({ useHandCursor: true }).setDepth(44);
            const remTxt = this.scene.add.text(x, cardY + cardH / 2 - 20, 'Lepas Pet', {
                fontFamily: 'monospace', fontSize: '9px', color: '#664444',
            }).setOrigin(0.5).setDepth(45);

            remBg.on('pointerover', () => { remBg.setFillStyle(0x2a1111); remTxt.setColor('#cc4444'); });
            remBg.on('pointerout',  () => { remBg.setFillStyle(0x1a0d0d); remTxt.setColor('#664444'); });
            remBg.on('pointerdown', () => this._removePet());
            this._objects.push(remBg, remTxt);

        } else {
            // Slot kosong
            const emptyTxt = this.scene.add.text(x, cardY, '— Slot Kosong —', {
                fontFamily: 'monospace', fontSize: '12px', color: '#1a1a2e',
            }).setOrigin(0.5).setDepth(43);
            this._objects.push(emptyTxt);

            const hintTxt = this.scene.add.text(x, cardY + 24,
                'Dapatkan pet dari\ngacha atau event', {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: '#151522', align: 'center',
                }).setOrigin(0.5).setDepth(43);
            this._objects.push(hintTxt);
        }
    }

    // ── Pet List (kanan) ──────────────────────────────────────

    _buildPetList(startX, cy, W, H, topY) {
        const listW = 240;

        const listHeader = this.scene.add.text(startX, topY + 10, 'PET DIMILIKI', {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#334455', letterSpacing: 2,
        }).setOrigin(0, 0.5).setDepth(42);
        this._objects.push(listHeader);

        // Sort berdasarkan rarity
        const sorted = [...this.ownedPets]
            .map(id => getPet(id))
            .filter(Boolean)
            .sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));

        const rowH    = 54;
        const maxShow = Math.floor((H - 100) / rowH);
        const shown   = sorted.slice(0, maxShow);

        shown.forEach((pet, i) => {
            const rowY      = topY + 30 + i * rowH + rowH / 2;
            const rarityHex = RARITY_COLOR[pet.rarity] || 0x9e9e9e;
            const isActive  = this.playerData?.pet === pet.id;

            const rowBg = this.scene.add.rectangle(startX + listW / 2, rowY, listW, rowH - 4,
                isActive ? 0x111a11 : 0x0a0a14
            ).setStrokeStyle(1, isActive ? 0x44aa55 : rarityHex)
             .setInteractive({ useHandCursor: true }).setDepth(42);

            const icon = this.scene.add.text(startX + 16, rowY, _elementIcon(pet.element), {
                fontFamily: 'monospace', fontSize: '16px',
            }).setOrigin(0.5).setDepth(43);

            const nameTxt = this.scene.add.text(startX + 30, rowY - 8, pet.name, {
                fontFamily: 'monospace', fontSize: '11px',
                color: isActive ? '#44cc66' : '#aabbcc', fontStyle: 'bold',
            }).setOrigin(0, 0.5).setDepth(43);

            const descTxt = this.scene.add.text(startX + 30, rowY + 10, pet.description, {
                fontFamily: 'monospace', fontSize: '8px', color: '#445566',
                wordWrap: { width: listW - 40 },
            }).setOrigin(0, 0.5).setDepth(43);

            const activeTag = isActive
                ? this.scene.add.text(startX + listW - 10, rowY, '✓', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#44cc66',
                }).setOrigin(1, 0.5).setDepth(43)
                : null;

            rowBg.on('pointerover', () => rowBg.setFillStyle(0x111a22));
            rowBg.on('pointerout',  () => rowBg.setFillStyle(isActive ? 0x111a11 : 0x0a0a14));
            rowBg.on('pointerdown', () => {
                if (!isActive) this._equipPet(pet.id);
            });

            this._objects.push(rowBg, icon, nameTxt, descTxt);
            if (activeTag) this._objects.push(activeTag);
        });
    }

    // ── Actions ───────────────────────────────────────────────

    _equipPet(petId) {
        this.playerData.pet = petId;
        this._rebuild();
        const pet = getPet(petId);
        if (this.onChange) this.onChange(this.playerData, 'equip', petId);
        this._showNotif(`${pet?.name || petId} dipasang sebagai pet!`, '#44cc88');
    }

    _removePet() {
        const old = this.playerData.pet;
        this.playerData.pet = null;
        this._rebuild();
        if (this.onChange) this.onChange(this.playerData, 'remove', old);
        this._showNotif('Pet dilepas.', '#cc8833');
    }

    /**
     * Public — equip pet dari luar (gacha/reward).
     */
    equipPetExternal(petId) {
        this._equipPet(petId);
    }

    // ── Rebuild ───────────────────────────────────────────────

    _rebuild() {
        this._objects.forEach(o => { try { o.destroy(); } catch(e){} });
        this._objects = [];
        this._build();
    }

    // ── Notif ─────────────────────────────────────────────────

    _showNotif(msg, color = '#ffffff') {
        const cx = this.scene.cameras.main.width  / 2;
        const cy = this.scene.cameras.main.height / 2;
        const t  = this.scene.add.text(cx, cy + 210, msg, {
            fontFamily: 'monospace', fontSize: '13px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(46);
        this._objects.push(t);
        this.scene.time.delayedCall(2000, () => { if (t?.active) t.destroy(); });
    }

    // ── Close ─────────────────────────────────────────────────

    close() {
        this._objects.forEach(o => { try { o.destroy(); } catch(e){} });
        this._objects = [];
        if (this.onClose) this.onClose(this.playerData);
    }
}

// ── Helpers ───────────────────────────────────────────────────

function _raritySymbol(rarity) {
    return { common:'○', uncommon:'◆', rare:'★', ancient:'✦', mythic:'✸', divine:'❋' }[rarity] ?? '○';
}

function _elementIcon(element) {
    return {
        kodama:'🌿', ryuu:'🐉', kasha:'🔥',
        oni:'👹', raijin:'⚡', taiyo:'☀', tsuki:'🌑',
    }[element] ?? '●';
}