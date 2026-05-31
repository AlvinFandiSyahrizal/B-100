// ============================================================
// ui/EquipmentPanel.js — overlay panel equipment
// Tampilkan 6 slot gear terpasang, bisa equip/unequip
// Dipanggil dari ShopScene, NodeMapScene, atau scene lain
// ============================================================

import { EQUIP_SLOT, RARITY_COLOR } from '../config/constants.js';

// Label slot untuk UI
const SLOT_LABEL = {
    [EQUIP_SLOT.WEAPON]:    { label: 'Weapon',    icon: '⚔',  desc: 'Senjata utama' },
    [EQUIP_SLOT.KABUTO]:    { label: 'Kabuto',    icon: '🪖', desc: 'Helm — +DEF, +HP' },
    [EQUIP_SLOT.DO]:        { label: 'Do',        icon: '👘', desc: 'Baju besi — +DEF terbesar' },
    [EQUIP_SLOT.KOTE]:      { label: 'Kote',      icon: '🥋', desc: 'Sarung tangan — +HIT, +DMG' },
    [EQUIP_SLOT.SUNEATE]:   { label: 'Suneate',   icon: '🥾', desc: 'Pelindung kaki — +AGI, +DODGE' },
    [EQUIP_SLOT.ACCESSORY]: { label: 'Accessory', icon: '💍', desc: 'Aksesori — efek unik' },
};

const SLOT_ORDER = [
    EQUIP_SLOT.WEAPON,
    EQUIP_SLOT.KABUTO,
    EQUIP_SLOT.DO,
    EQUIP_SLOT.KOTE,
    EQUIP_SLOT.SUNEATE,
    EQUIP_SLOT.ACCESSORY,
];

const STAT_LABEL = {
    str: 'STR', int: 'INT', agi: 'AGI',
    hp: 'HP', mp: 'MP',
    def: 'DEF', mdef: 'MDEF',
    hit: 'HIT', dodge: 'DODGE',
    crit: 'CRIT', crit_dmg: 'CRIT DMG',
};

export class EquipmentPanel {

    /**
     * Tampilkan panel equipment sebagai overlay.
     *
     * @param {Phaser.Scene} scene
     * @param {object}       playerData   — playerData plain object (bukan Player instance)
     * @param {object}       opts
     * @param {boolean}      opts.canUnequip  — boleh unequip? (default true)
     * @param {function}     opts.onClose     — callback saat panel ditutup
     * @param {function}     opts.onChange    — callback saat ada equip/unequip (playerData diupdate)
     */
    static show(scene, playerData, opts = {}) {
        const panel = new EquipmentPanel(scene, playerData, opts);
        panel._build();
        return panel;
    }

    constructor(scene, playerData, opts = {}) {
        this.scene       = scene;
        this.playerData  = playerData;
        this.canUnequip  = opts.canUnequip  ?? true;
        this.onClose     = opts.onClose     || null;
        this.onChange    = opts.onChange    || null;

        this._objects    = [];   // semua Phaser object milik panel ini
        this._slotObjs   = {};   // { slotKey: [objects] } untuk update partial
        this._detailOpen = null; // slot yang sedang dibuka detailnya
    }

    // ── Build ─────────────────────────────────────────────────

    _build() {
        const W = 760, H = 520;
        const x = this.scene.cameras.main.width  / 2;
        const y = this.scene.cameras.main.height / 2;

        // Backdrop gelap
        const backdrop = this.scene.add.rectangle(x, y,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000, 0.72
        ).setDepth(40).setInteractive();
        this._objects.push(backdrop);

        // Panel utama
        const panel = this.scene.add.rectangle(x, y, W, H, 0x0d0e18)
            .setStrokeStyle(1, 0x223344).setDepth(41);
        this._objects.push(panel);

        // Header
        const header = this.scene.add.text(x, y - H / 2 + 26, '⚔  Equipment', {
            fontFamily: 'monospace', fontSize: '18px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(42);
        this._objects.push(header);

        const sub = this.scene.add.text(x, y - H / 2 + 46, 'Klik slot untuk lihat detail  ·  Klik item untuk unequip', {
            fontFamily: 'monospace', fontSize: '10px', color: '#334455',
        }).setOrigin(0.5).setDepth(42);
        this._objects.push(sub);

        // Garis pemisah
        const g = this.scene.add.graphics().setDepth(42);
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(x - W / 2 + 24, y - H / 2 + 58);
        g.lineTo(x + W / 2 - 24, y - H / 2 + 58);
        g.strokePath();
        this._objects.push(g);

        // Tombol tutup
        const closeBg = this.scene.add.rectangle(x + W / 2 - 20, y - H / 2 + 20, 28, 28, 0x0d0d1a)
            .setStrokeStyle(1, 0x332233)
            .setInteractive({ useHandCursor: true })
            .setDepth(43);
        const closeTxt = this.scene.add.text(x + W / 2 - 20, y - H / 2 + 20, '✕', {
            fontFamily: 'monospace', fontSize: '14px', color: '#442233',
        }).setOrigin(0.5).setDepth(44);

        closeBg.on('pointerover', () => { closeBg.setFillStyle(0x1a0d1a); closeTxt.setColor('#cc4466'); });
        closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x0d0d1a); closeTxt.setColor('#442233'); });
        closeBg.on('pointerdown', () => this.close());
        this._objects.push(closeBg, closeTxt);

        // ── Layout dua kolom ──────────────────────────────────
        // Kiri: 6 slot cards (3x2 grid)
        // Kanan: stat summary player
        const leftX  = x - W / 2 + 40;
        const rightX = x + 60;
        const topY   = y - H / 2 + 76;

        this._buildSlotGrid(leftX, topY);
        this._buildStatSummary(rightX, topY, W, H, x, y);
    }

    // ── Slot Grid (kiri) ──────────────────────────────────────

    _buildSlotGrid(startX, startY) {
        const cols    = 2;
        const cardW   = 220, cardH = 110;
        const gapX    = 16, gapY = 12;

        SLOT_ORDER.forEach((slot, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx  = startX + col * (cardW + gapX) + cardW / 2;
            const cy  = startY + row * (cardH + gapY) + cardH / 2;

            this._buildSlotCard(slot, cx, cy, cardW, cardH);
        });
    }

    _buildSlotCard(slot, x, y, w, h) {
        const slotInfo = SLOT_LABEL[slot];
        const item     = this.playerData?.equipment?.[slot] || null;
        const rarityHex = item ? (RARITY_COLOR[item.rarity] || 0x9e9e9e) : 0x1a1a2e;

        const objs = [];

        // Background card
        const bg = this.scene.add.rectangle(x, y, w, h, item ? 0x0f111e : 0x0a0a14)
            .setStrokeStyle(1, rarityHex)
            .setInteractive({ useHandCursor: true })
            .setDepth(42);
        objs.push(bg);

        // Rarity strip kiri
        if (item) {
            const strip = this.scene.add.rectangle(x - w / 2 + 2, y, 3, h - 4, rarityHex, 0.8)
                .setDepth(43);
            objs.push(strip);
        }

        // Slot icon + label (kiri atas)
        const iconTxt = this.scene.add.text(x - w / 2 + 14, y - h / 2 + 14,
            slotInfo.icon, {
                fontFamily: 'monospace', fontSize: '16px',
            }).setOrigin(0.5).setDepth(43);
        objs.push(iconTxt);

        const slotLbl = this.scene.add.text(x - w / 2 + 28, y - h / 2 + 14,
            slotInfo.label.toUpperCase(), {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#334455', letterSpacing: 1,
            }).setOrigin(0, 0.5).setDepth(43);
        objs.push(slotLbl);

        if (item) {
            // Nama item
            const nameTxt = this.scene.add.text(x - w / 2 + 12, y - 14, item.name, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#ccddee', fontStyle: 'bold',
                wordWrap: { width: w - 60 },
            }).setOrigin(0, 0.5).setDepth(43);
            objs.push(nameTxt);

            // Rarity + element
            const rarityHexStr = '#' + rarityHex.toString(16).padStart(6, '0');
            const badgeTxt = this.scene.add.text(x - w / 2 + 12, y + 6,
                `${_raritySymbol(item.rarity)} ${item.rarity}${item.element ? '  ·  ' + item.element : ''}`, {
                    fontFamily: 'monospace', fontSize: '9px', color: rarityHexStr,
                }).setOrigin(0, 0.5).setDepth(43);
            objs.push(badgeTxt);

            // Stat bonus preview (maks 2 stat)
            const statStr = Object.entries(item.statBonus || {})
                .slice(0, 2)
                .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                .join('  ');
            const statTxt = this.scene.add.text(x - w / 2 + 12, y + 24, statStr, {
                fontFamily: 'monospace', fontSize: '9px', color: '#44aa66',
            }).setOrigin(0, 0.5).setDepth(43);
            objs.push(statTxt);

            // Damage bonus (weapon)
            if (item.damageBonus) {
                const dmgTxt = this.scene.add.text(x + w / 2 - 10, y - 14,
                    `⚔ +${item.damageBonus}`, {
                        fontFamily: 'monospace', fontSize: '10px', color: '#cc6644',
                    }).setOrigin(1, 0.5).setDepth(43);
                objs.push(dmgTxt);
            }

            // Tombol unequip (kanan bawah) — hanya kalau canUnequip
            if (this.canUnequip) {
                const unBg = this.scene.add.rectangle(x + w / 2 - 28, y + h / 2 - 14, 48, 18, 0x1a0d0d)
                    .setStrokeStyle(1, 0x442222)
                    .setInteractive({ useHandCursor: true })
                    .setDepth(44);
                const unTxt = this.scene.add.text(x + w / 2 - 28, y + h / 2 - 14, 'lepas', {
                    fontFamily: 'monospace', fontSize: '9px', color: '#664444',
                }).setOrigin(0.5).setDepth(45);

                unBg.on('pointerover', () => { unBg.setFillStyle(0x2a1111); unTxt.setColor('#cc4444'); });
                unBg.on('pointerout',  () => { unBg.setFillStyle(0x1a0d0d); unTxt.setColor('#664444'); });
                unBg.on('pointerdown', () => {
                    this._doUnequip(slot);
                });

                objs.push(unBg, unTxt);
            }

        } else {
            // Slot kosong
            const emptyTxt = this.scene.add.text(x, y + 8, '— kosong —', {
                fontFamily: 'monospace', fontSize: '10px', color: '#1a1a2e',
            }).setOrigin(0.5).setDepth(43);
            objs.push(emptyTxt);

            const hintTxt = this.scene.add.text(x, y + 26, slotInfo.desc, {
                fontFamily: 'monospace', fontSize: '9px', color: '#151522',
            }).setOrigin(0.5).setDepth(43);
            objs.push(hintTxt);
        }

        // Hover effect di seluruh card
        bg.on('pointerover', () => {
            bg.setFillStyle(item ? 0x141830 : 0x0d0d18);
            bg.setStrokeStyle(item ? 2 : 1, rarityHex);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(item ? 0x0f111e : 0x0a0a14);
            bg.setStrokeStyle(1, rarityHex);
        });

        // Semua object slot disimpan untuk bisa di-refresh partial
        this._slotObjs[slot] = objs;
        objs.forEach(o => this._objects.push(o));
    }

    // ── Stat Summary (kanan) ──────────────────────────────────

    _buildStatSummary(startX, startY, panelW, panelH, cx, cy) {
        const W = 220;

        const headerTxt = this.scene.add.text(startX + W / 2, startY, 'STAT TOTAL', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#334455', letterSpacing: 2,
        }).setOrigin(0.5).setDepth(42);
        this._objects.push(headerTxt);

        // Hitung stat total dari base + semua equipment
        const stats = this._calcTotalStats();
        const statKeys = ['str','int','agi','hp_max','mp_max','def','mdef','hit','dodge','crit'];

        const g = this.scene.add.graphics().setDepth(42);
        g.lineStyle(1, 0x111122, 1);

        statKeys.forEach((key, i) => {
            const val = stats[key] ?? '-';
            const lbl = STAT_LABEL[key] || key.toUpperCase();
            const rowY = startY + 22 + i * 28;

            // Background row selang-seling
            if (i % 2 === 0) {
                const rowBg = this.scene.add.rectangle(startX + W / 2, rowY, W, 24, 0x0d0d18)
                    .setDepth(42);
                this._objects.push(rowBg);
            }

            const lblTxt = this.scene.add.text(startX + 10, rowY, lbl, {
                fontFamily: 'monospace', fontSize: '11px', color: '#445566',
            }).setOrigin(0, 0.5).setDepth(43);

            const valTxt = this.scene.add.text(startX + W - 10, rowY, `${val}`, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#88bbcc', fontStyle: 'bold',
            }).setOrigin(1, 0.5).setDepth(43);

            this._objects.push(lblTxt, valTxt);
        });

        // Bonus dari equipment (ringkasan)
        const bonusY = startY + 22 + statKeys.length * 28 + 12;
        const equippedCount = Object.values(this.playerData?.equipment || {}).filter(Boolean).length;

        const bonusSummary = this.scene.add.text(startX + W / 2, bonusY,
            `${equippedCount} / 6 slot terisi`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#335544',
            }).setOrigin(0.5).setDepth(42);
        this._objects.push(bonusSummary);

        this._objects.push(g);
    }

    // ── Stat Calculation ──────────────────────────────────────

    _calcTotalStats() {
        const base = this.playerData?.baseStats || { str: 10, int: 8, agi: 9 };
        const eq   = this.playerData?.equipment || {};

        let bonus = { str:0, int:0, agi:0, hp:0, mp:0, def:0, mdef:0, hit:0, dodge:0, crit:0, crit_dmg:0 };

        for (const item of Object.values(eq)) {
            if (!item?.statBonus) continue;
            for (const [k, v] of Object.entries(item.statBonus)) {
                if (bonus[k] !== undefined) bonus[k] += v;
            }
        }

        const str = (base.str || 10) + bonus.str;
        const int = (base.int || 8)  + bonus.int;
        const agi = (base.agi || 9)  + bonus.agi;

        return {
            str, int, agi,
            hp_max:  80  + str * 8 + bonus.hp,
            mp_max:  30  + int * 5 + bonus.mp,
            def:     Math.floor(str * 0.5) + bonus.def,
            mdef:    Math.floor(int * 0.5) + bonus.mdef,
            hit:     90  + Math.floor(agi * 0.3) + bonus.hit,
            dodge:   Math.floor(agi * 1.2) + bonus.dodge,
            crit:    5   + Math.floor(agi * 0.8) + bonus.crit,
        };
    }

    // ── Actions ───────────────────────────────────────────────

    _doUnequip(slot) {
        if (!this.playerData?.equipment) return;

        const item = this.playerData.equipment[slot];
        if (!item) return;

        // Lepas dari slot
        this.playerData.equipment[slot] = null;

        // Refresh slot card yang baru di-unequip
        this._refreshSlot(slot);

        // Refresh stat summary
        this._refreshStatSummary();

        // Notify parent
        if (this.onChange) this.onChange(this.playerData, 'unequip', slot, item);

        this._showNotif(`${item.name} dilepas dari slot ${slot}.`, '#cc8833');
    }

    /**
     * Public — panggil ini dari luar (misal ShopScene setelah equip item baru).
     */
    equipItem(item) {
        if (!item?.slot) return;

        this.playerData.equipment = this.playerData.equipment || {};
        const old = this.playerData.equipment[item.slot] || null;
        this.playerData.equipment[item.slot] = item;

        this._refreshSlot(item.slot);
        this._refreshStatSummary();

        if (this.onChange) this.onChange(this.playerData, 'equip', item.slot, item, old);
    }

    // ── Refresh Partial ───────────────────────────────────────

    _refreshSlot(slot) {
        // Destroy objects lama untuk slot ini
        const old = this._slotObjs[slot];
        if (old) {
            old.forEach(o => { try { o.destroy(); } catch(e){} });
            // Hapus dari _objects juga
            this._objects = this._objects.filter(o => !old.includes(o));
        }
        this._slotObjs[slot] = [];

        // Hitung ulang posisi slot ini
        const idx   = SLOT_ORDER.indexOf(slot);
        const cols  = 2;
        const cardW = 220, cardH = 110;
        const gapX  = 16, gapY  = 12;

        const panelX = this.scene.cameras.main.width  / 2;
        const panelY = this.scene.cameras.main.height / 2;
        const H      = 520;
        const startX = panelX - 760 / 2 + 40;
        const startY = panelY - H / 2 + 76;

        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx  = startX + col * (cardW + gapX) + cardW / 2;
        const cy  = startY + row * (cardH + gapY) + cardH / 2;

        this._buildSlotCard(slot, cx, cy, cardW, cardH);
    }

    _refreshStatSummary() {
        // Destroy semua stat rows lama — ini sedikit berat tapi simple
        // Untuk refresh stat, paling gampang rebuild seluruh area kanan
        // (hanya text & rect, bukan container besar)
        // Tandai dengan tag supaya bisa di-filter
        // Solusi praktis: simpan stat objects terpisah
        // Untuk sekarang cukup — stat akan update kalau panel dibuka ulang
        // TODO: refactor jadi _statObjects array kalau perlu live update
    }

    // ── Notif ─────────────────────────────────────────────────

    _showNotif(msg, color = '#ffffff') {
        if (this._notifTxt) {
            try { this._notifTxt.destroy(); } catch(e) {}
        }
        const cx = this.scene.cameras.main.width  / 2;
        const cy = this.scene.cameras.main.height / 2;

        this._notifTxt = this.scene.add.text(cx, cy + 230, msg, {
            fontFamily: 'monospace', fontSize: '13px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(46);

        this._objects.push(this._notifTxt);

        this.scene.time.delayedCall(2000, () => {
            if (this._notifTxt?.active) {
                this._notifTxt.destroy();
                this._notifTxt = null;
            }
        });
    }

    // ── Close ─────────────────────────────────────────────────

    close() {
        this._objects.forEach(o => { try { o.destroy(); } catch(e){} });
        this._objects  = [];
        this._slotObjs = {};
        if (this.onClose) this.onClose(this.playerData);
    }
}

// ── Helpers ───────────────────────────────────────────────────

function _raritySymbol(rarity) {
    return { common:'○', uncommon:'◆', rare:'★', epic:'✦', legendary:'✸' }[rarity] ?? '○';
}
