// ============================================================
// ui/CompanionPanel.js — overlay panel companion
// Tampilkan 2 slot companion, ganti mode, lihat stat
// Dipanggil dari NodeMapScene atau ShopScene
// ============================================================

import { COMPANION_MODE, RARITY_COLOR } from '../config/constants.js';
import { getAllCompanions, getCompanion } from '../data/companions/index.js';
import { Companion } from '../entities/Companion.js';

const MODE_LABEL = {
    [COMPANION_MODE.AGGRESSIVE]: { label: 'Aggressive', icon: '⚔',  color: '#cc4433', desc: 'Prioritas serang musuh' },
    [COMPANION_MODE.DEFENSIVE]:  { label: 'Defensive',  icon: '🛡', color: '#4488cc', desc: 'Prioritas block + heal player' },
    [COMPANION_MODE.SUPPORT]:    { label: 'Support',    icon: '✨',  color: '#44aa55', desc: 'Prioritas buff + debuff' },
};

const MAX_COMPANIONS = 2;

export class CompanionPanel {

    /**
     * @param {Phaser.Scene} scene
     * @param {object}       playerData  — plain object playerData
     * @param {object}       opts
     * @param {boolean}      opts.canSwap    — boleh ganti companion? (default false)
     * @param {function}     opts.onClose    — callback saat tutup
     * @param {function}     opts.onChange   — callback saat ada perubahan
     */
    static show(scene, playerData, opts = {}) {
        const panel = new CompanionPanel(scene, playerData, opts);
        panel._build();
        return panel;
    }

    constructor(scene, playerData, opts = {}) {
        this.scene      = scene;
        this.playerData = playerData;
        this.canSwap    = opts.canSwap  ?? false;
        this.onClose    = opts.onClose  || null;
        this.onChange   = opts.onChange || null;

        this._objects  = [];
        this._slotObjs = {};   // { 0: [...], 1: [...] }
    }

    // ── Build ─────────────────────────────────────────────────

    _build() {
        const W  = 780, H = 500;
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
        const header = this.scene.add.text(cx, cy - H / 2 + 26, '👥  Companion', {
            fontFamily: 'monospace', fontSize: '18px',
            color: '#44aacc', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(42);
        this._objects.push(header);

        const sub = this.scene.add.text(cx, cy - H / 2 + 46,
            'Companion aksi otomatis setelah giliran musuh  ·  Maks 2 slot', {
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

        // Tombol tutup
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

        // Build dua slot
        const companions = this.playerData?.companions || [null, null];
        const slotW      = (W - 80) / 2;
        const slotX      = [cx - W / 2 + 30 + slotW / 2, cx + 10 + slotW / 2];
        const slotY      = cy;

        for (let i = 0; i < MAX_COMPANIONS; i++) {
            const compData = companions[i] || null;
            this._buildSlotCard(i, slotX[i], slotY, slotW, H - 90, compData);
        }
    }

    // ── Slot Card ─────────────────────────────────────────────

    _buildSlotCard(slotIdx, x, y, w, h, compData) {
        const objs = [];

        // Resolve companion — bisa null, plain object (saved), atau template id
        const comp = compData
            ? (compData.id ? getCompanion(compData.id) : null)
            : null;

        const rarityHex = comp ? (RARITY_COLOR[comp.rarity] || 0x9e9e9e) : 0x1a1a2e;

        // Card background
        const bg = this.scene.add.rectangle(x, y, w, h, comp ? 0x0f111e : 0x0a0a14)
            .setStrokeStyle(1, rarityHex).setDepth(42);
        objs.push(bg);

        // Rarity strip
        if (comp) {
            const strip = this.scene.add.rectangle(x - w / 2 + 2, y, 3, h - 4, rarityHex, 0.8)
                .setDepth(43);
            objs.push(strip);
        }

        // Slot label (kiri atas)
        const slotLbl = this.scene.add.text(x - w / 2 + 12, y - h / 2 + 14,
            `SLOT ${slotIdx + 1}`, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#223344', letterSpacing: 1,
            }).setOrigin(0, 0.5).setDepth(43);
        objs.push(slotLbl);

        if (comp) {
            this._buildFilledSlot(slotIdx, x, y, w, h, comp, compData, objs, rarityHex);
        } else {
            this._buildEmptySlot(slotIdx, x, y, w, h, objs);
        }

        this._slotObjs[slotIdx] = objs;
        objs.forEach(o => this._objects.push(o));
    }

    _buildFilledSlot(slotIdx, x, y, w, h, comp, savedData, objs, rarityHex) {
        const rarityHexStr = '#' + rarityHex.toString(16).padStart(6, '0');

        // Nama + element
        const nameTxt = this.scene.add.text(x, y - h / 2 + 38, comp.name, {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#ccddee', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(43);
        objs.push(nameTxt);

        // Rarity + element badge
        const badge = this.scene.add.text(x, y - h / 2 + 56,
            `${_raritySymbol(comp.rarity)} ${comp.rarity}  ·  ${comp.element}`, {
                fontFamily: 'monospace', fontSize: '9px', color: rarityHexStr,
            }).setOrigin(0.5).setDepth(43);
        objs.push(badge);

        // Stat dasar
        const statLines = [
            `ATK: ${comp.baseAtk}  (${comp.atkType})`,
            comp.baseDef  > 0 ? `DEF: +${comp.baseDef} block/turn` : null,
            comp.baseHeal > 0 ? `HEAL: ${comp.baseHeal} HP/turn`   : null,
            `HP: ${comp.maxHp}`,
        ].filter(Boolean);

        statLines.forEach((line, i) => {
            const t = this.scene.add.text(x - w / 2 + 16, y - h / 2 + 80 + i * 16, line, {
                fontFamily: 'monospace', fontSize: '10px', color: '#44aa66',
            }).setOrigin(0, 0.5).setDepth(43);
            objs.push(t);
        });

        // Passive desc
        if (comp.passiveDesc) {
            const passTxt = this.scene.add.text(x - w / 2 + 16, y - h / 2 + 160,
                `Passive: ${comp.passiveDesc}`, {
                    fontFamily: 'monospace', fontSize: '9px', color: '#556677',
                    wordWrap: { width: w - 28 },
                }).setOrigin(0, 0).setDepth(43);
            objs.push(passTxt);
        }

        // Ulti info
        if (comp.ulti) {
            const ultiTxt = this.scene.add.text(x - w / 2 + 16, y + 10,
                `Ulti [${comp.ultiCost} gauge]: ${comp.ulti.name}\n${comp.ulti.description || ''}`, {
                    fontFamily: 'monospace', fontSize: '9px', color: '#cc8833',
                    wordWrap: { width: w - 28 },
                }).setOrigin(0, 0).setDepth(43);
            objs.push(ultiTxt);
        }

        // ── Mode selector ──────────────────────────────────────
        const currentMode = savedData?.mode || comp.defaultMode;
        const modes = Object.keys(MODE_LABEL);
        const modeY = y + h / 2 - 60;

        const modeLbl = this.scene.add.text(x - w / 2 + 16, modeY - 18, 'MODE:', {
            fontFamily: 'monospace', fontSize: '9px', color: '#334455',
        }).setOrigin(0, 0.5).setDepth(43);
        objs.push(modeLbl);

        modes.forEach((mode, mi) => {
            const btnW  = (w - 32) / 3;
            const btnX  = x - w / 2 + 16 + mi * (btnW + 4) + btnW / 2;
            const info  = MODE_LABEL[mode];
            const isAct = mode === currentMode;

            const btnBg = this.scene.add.rectangle(btnX, modeY, btnW, 24,
                isAct ? 0x111a22 : 0x0a0a14
            ).setStrokeStyle(1, isAct ? _hexToNum(info.color) : 0x1a1a2e)
             .setInteractive({ useHandCursor: true }).setDepth(44);

            const btnTxt = this.scene.add.text(btnX, modeY,
                `${info.icon} ${info.label}`, {
                    fontFamily: 'monospace', fontSize: '8px',
                    color: isAct ? info.color : '#334455',
                }).setOrigin(0.5).setDepth(45);

            btnBg.on('pointerover', () => { btnBg.setFillStyle(0x111a22); btnTxt.setColor(info.color); });
            btnBg.on('pointerout',  () => {
                btnBg.setFillStyle(mode === this._getCurrentMode(slotIdx) ? 0x111a22 : 0x0a0a14);
                btnTxt.setColor(mode === this._getCurrentMode(slotIdx) ? info.color : '#334455');
            });
            btnBg.on('pointerdown', () => this._setMode(slotIdx, mode));

            objs.push(btnBg, btnTxt);
        });

        // Tombol lepas companion
        const removeBg = this.scene.add.rectangle(x, y + h / 2 - 18, w - 32, 22, 0x1a0d0d)
            .setStrokeStyle(1, 0x442222)
            .setInteractive({ useHandCursor: true }).setDepth(44);
        const removeTxt = this.scene.add.text(x, y + h / 2 - 18, 'Lepas Companion', {
            fontFamily: 'monospace', fontSize: '9px', color: '#664444',
        }).setOrigin(0.5).setDepth(45);

        removeBg.on('pointerover', () => { removeBg.setFillStyle(0x2a1111); removeTxt.setColor('#cc4444'); });
        removeBg.on('pointerout',  () => { removeBg.setFillStyle(0x1a0d0d); removeTxt.setColor('#664444'); });
        removeBg.on('pointerdown', () => this._removeCompanion(slotIdx));
        objs.push(removeBg, removeTxt);
    }

    _buildEmptySlot(slotIdx, x, y, w, h, objs) {
        const emptyTxt = this.scene.add.text(x, y, '— Slot Kosong —', {
            fontFamily: 'monospace', fontSize: '12px', color: '#1a1a2e',
        }).setOrigin(0.5).setDepth(43);
        objs.push(emptyTxt);

        const hintTxt = this.scene.add.text(x, y + 24,
            'Dapatkan companion\ndari gacha atau event', {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#151522', align: 'center',
            }).setOrigin(0.5).setDepth(43);
        objs.push(hintTxt);
    }

    // ── Actions ───────────────────────────────────────────────

    _getCurrentMode(slotIdx) {
        const companions = this.playerData?.companions || [];
        return companions[slotIdx]?.mode || COMPANION_MODE.AGGRESSIVE;
    }

    _setMode(slotIdx, mode) {
        if (!this.playerData.companions) this.playerData.companions = [null, null];
        if (!this.playerData.companions[slotIdx]) return;

        this.playerData.companions[slotIdx].mode = mode;
        this._refreshSlot(slotIdx);

        if (this.onChange) this.onChange(this.playerData, 'mode_change', slotIdx, mode);
    }

    _removeCompanion(slotIdx) {
        if (!this.playerData.companions) return;
        this.playerData.companions[slotIdx] = null;
        this._refreshSlot(slotIdx);

        if (this.onChange) this.onChange(this.playerData, 'remove', slotIdx, null);
        this._showNotif('Companion dilepas dari slot.', '#cc8833');
    }

    /**
     * Public — tambah companion ke slot kosong pertama.
     * Dipanggil dari luar (misal setelah gacha / reward).
     * @param {string} companionId
     */
    addCompanion(companionId) {
        const template = getCompanion(companionId);
        if (!template) return;

        if (!this.playerData.companions) this.playerData.companions = [null, null];

        const emptySlot = this.playerData.companions.findIndex(c => !c);
        if (emptySlot === -1) {
            this._showNotif('Semua slot companion sudah terisi!', '#cc4444');
            return;
        }

        // Simpan sebagai plain object (bukan Companion instance)
        this.playerData.companions[emptySlot] = {
            id:   companionId,
            mode: template.defaultMode,
        };

        this._refreshSlot(emptySlot);
        if (this.onChange) this.onChange(this.playerData, 'add', emptySlot, companionId);
        this._showNotif(`${template.name} bergabung ke slot ${emptySlot + 1}!`, '#44cc88');
    }

    // ── Refresh ───────────────────────────────────────────────

    _refreshSlot(slotIdx) {
        const old = this._slotObjs[slotIdx];
        if (old) {
            old.forEach(o => { try { o.destroy(); } catch(e){} });
            this._objects = this._objects.filter(o => !old.includes(o));
        }
        this._slotObjs[slotIdx] = [];

        const W  = 780, H = 500;
        const cx = this.scene.cameras.main.width  / 2;
        const cy = this.scene.cameras.main.height / 2;

        const slotW = (W - 80) / 2;
        const slotX = [cx - W / 2 + 30 + slotW / 2, cx + 10 + slotW / 2];

        const companions = this.playerData?.companions || [null, null];
        this._buildSlotCard(slotIdx, slotX[slotIdx], cy, slotW, H - 90, companions[slotIdx] || null);
    }

    // ── Notif ─────────────────────────────────────────────────

    _showNotif(msg, color = '#ffffff') {
        if (this._notifTxt) { try { this._notifTxt.destroy(); } catch(e){} }
        const cx = this.scene.cameras.main.width  / 2;
        const cy = this.scene.cameras.main.height / 2;

        this._notifTxt = this.scene.add.text(cx, cy + 220, msg, {
            fontFamily: 'monospace', fontSize: '13px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(46);
        this._objects.push(this._notifTxt);

        this.scene.time.delayedCall(2000, () => {
            if (this._notifTxt?.active) this._notifTxt.destroy();
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

function _hexToNum(hexStr) {
    return parseInt(hexStr.replace('#', ''), 16);
}