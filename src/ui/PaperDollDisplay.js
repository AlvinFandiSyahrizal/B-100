// ============================================================
// ui/PaperDollDisplay.js — Paper Doll system untuk karakter
// Render karakter sebagai layer bertumpuk sesuai gear terpasang
//
// Placeholder mode: gunakan colored shapes sampai sprite siap
// Nanti kalau sprite sudah ada, cukup ganti LAYER_CONFIG saja
// ============================================================

import { EQUIP_SLOT } from '../config/constants.js';

// ── Layer Config ──────────────────────────────────────────────
// Urutan render: layer 0 paling bawah, layer teratas di atas semua
// Setiap entry = konfigurasi visual untuk satu bagian tubuh/gear

const LAYER_DEF = [
    // id           slot                  offsetX  offsetY  w    h    baseColor   spriteKey (nanti)
    { id: 'shadow',  slot: null,           ox: 0,   oy: 36,  w: 52, h: 10, color: 0x000000, alpha: 0.25, isOval: true },
    { id: 'body',    slot: null,           ox: 0,   oy: 0,   w: 28, h: 60, color: 0x3a2a1e, alpha: 1.0  },
    { id: 'do',      slot: EQUIP_SLOT.DO,  ox: 0,   oy:-4,   w: 34, h: 50, color: 0x2a3040, alpha: 1.0  },
    { id: 'kote',    slot: EQUIP_SLOT.KOTE,ox:0,    oy: 4,   w: 44, h: 22, color: 0x1e2838, alpha: 1.0  },
    { id: 'suneate', slot: EQUIP_SLOT.SUNEATE, ox:0,oy: 32,  w: 22, h: 20, color: 0x1e2030, alpha: 1.0  },
    { id: 'head',    slot: null,           ox: 0,   oy:-34,  w: 22, h: 22, color: 0x3a2a1e, alpha: 1.0  },
    { id: 'kabuto',  slot: EQUIP_SLOT.KABUTO, ox: 0,oy:-40,  w: 26, h: 18, color: 0x2a3040, alpha: 1.0  },
    { id: 'weapon',  slot: EQUIP_SLOT.WEAPON, ox: 20,oy: 4,  w: 8,  h: 58, color: 0x8a7a5e, alpha: 1.0  },
    { id: 'accessory', slot: EQUIP_SLOT.ACCESSORY, ox:-20, oy:-8, w: 10, h: 10, color: 0xccaa44, alpha: 0.9, isOval: true },
];

// Warna override per rarity item
const RARITY_TINT = {
    common:    null,          // pakai warna default layer
    uncommon:  0x44aa55,
    rare:      0x2266cc,
    epic:      0x8833bb,
    legendary: 0xcc7700,
};

// Warna berdasarkan element item
const ELEMENT_TINT = {
    kodama: 0x44aa44,
    oni:    0xcc4422,
    kasha:  0xff6600,
    raijin: 0x55aaff,
    ryuu:   0x3388cc,
    taiyo:  0xffcc33,
    tsuki:  0x8844cc,
};

// ── Class ─────────────────────────────────────────────────────

export class PaperDollDisplay {
    /**
     * @param {Phaser.Scene} scene  — scene tempat doll di-render
     * @param {number}       x      — center X
     * @param {number}       y      — center Y
     * @param {object}       player — instance Player
     * @param {object}       opts   — { scale: 1, depth: 0, interactive: false }
     */
    constructor(scene, x, y, player, opts = {}) {
        this.scene  = scene;
        this.x      = x;
        this.y      = y;
        this.player = player;
        this.scale  = opts.scale       ?? 1;
        this.depth  = opts.depth       ?? 0;
        this.interactive = opts.interactive ?? false;

        // Container untuk semua layer — memudahkan move/scale/destroy
        this.container = scene.add.container(x, y).setDepth(this.depth);

        // Map layer id → { graphics, label } untuk update partial
        this._layers = {};

        // Idle animation tween handle
        this._idleTween = null;

        this._buildAll();

        if (this.interactive) this._addHoverInteraction();
    }

    // ── Build ─────────────────────────────────────────────────

    _buildAll() {
        // Bersihkan kalau rebuild
        this.container.removeAll(true);
        this._layers = {};

        const s = this.scale;
        const eq = this.player.equipment || {};

        for (const def of LAYER_DEF) {
            const item     = def.slot ? eq[def.slot] : null;
            const layerObj = this._buildLayer(def, item, s);
            this._layers[def.id] = layerObj;
            this.container.add(layerObj.objects);
        }

        this._startIdleAnim();
    }

    _buildLayer(def, item, s) {
        const objects = [];
        const ox = def.ox * s;
        const oy = def.oy * s;
        const w  = def.w  * s;
        const h  = def.h  * s;

        // Pilih warna — kalau ada item terpasang, pakai element/rarity color
        let fillColor = def.color;
        let alpha     = def.alpha ?? 1.0;

        if (item) {
            // Prioritas: element color dulu, fallback ke rarity
            const elColor = ELEMENT_TINT[item.element];
            const raColor = RARITY_TINT[item.rarity];
            fillColor = elColor ?? raColor ?? def.color;
        }

        // Kalau slot punya item → sedikit lebih terang
        const brightness = item ? 1.15 : 0.7;
        fillColor = _adjustBrightness(fillColor, brightness);

        // Shape utama
        let shape;
        if (def.isOval) {
            shape = this.scene.add.ellipse(ox, oy, w, h, fillColor, alpha);
        } else {
            // Pakai graphics supaya bisa rounded rect
            const g = this.scene.add.graphics();
            g.fillStyle(fillColor, alpha);
            g.fillRoundedRect(ox - w/2, oy - h/2, w, h, Math.round(w * 0.18));
            shape = g;
        }
        objects.push(shape);

        // Highlight sisi atas (inner glow efek)
        if (!def.isOval && def.slot !== null) {
            const hl = this.scene.add.graphics();
            hl.fillStyle(0xffffff, 0.07);
            hl.fillRoundedRect(ox - w/2 + 2, oy - h/2 + 2, w - 4, Math.floor(h * 0.3), 4);
            objects.push(hl);
        }

        // Label rarity di atas weapon (kecil, hanya jika item equipped)
        if (item && def.slot === EQUIP_SLOT.WEAPON) {
            const raritySymbol = _raritySymbol(item.rarity);
            const lbl = this.scene.add.text(ox + w/2 + 4, oy - h/2, raritySymbol, {
                fontFamily: 'monospace',
                fontSize: `${Math.round(8 * s)}px`,
                color: '#' + fillColor.toString(16).padStart(6, '0'),
            }).setOrigin(0, 0.5);
            objects.push(lbl);
        }

        // Accessory glow pulse (kalau ada item)
        if (item && def.id === 'accessory') {
            const glow = this.scene.add.ellipse(ox, oy, w + 8*s, h + 8*s, fillColor, 0.15);
            objects.push(glow);
            // Tween glow dilakukan terpisah setelah container selesai dibuild
            this._pendingGlow = glow;
        }

        return { objects, def, item };
    }

    _startIdleAnim() {
        // Stop tween lama dulu
        if (this._idleTween) this._idleTween.stop();

        // Body layer yang digerakkan (semua kecuali shadow)
        const moving = Object.values(this._layers)
            .filter(l => l.def.id !== 'shadow')
            .flatMap(l => l.objects);

        this._idleTween = this.scene.tweens.add({
            targets:  this.container,
            y:        { from: this.y, to: this.y - 4 * this.scale },
            duration: 1600,
            ease:     'Sine.easeInOut',
            yoyo:     true,
            repeat:   -1,
        });

        // Glow pulse kalau ada
        if (this._pendingGlow) {
            this.scene.tweens.add({
                targets:  this._pendingGlow,
                alpha:    { from: 0.1, to: 0.35 },
                scale:    { from: 1,   to: 1.4  },
                duration: 900,
                ease:     'Sine.easeInOut',
                yoyo:     true,
                repeat:   -1,
            });
            this._pendingGlow = null;
        }
    }

    // ── Public API ────────────────────────────────────────────

    /**
     * Update satu slot setelah equip/unequip.
     * Rebuild layer yang relevan saja — lebih efisien.
     * @param {string} slot — EQUIP_SLOT key
     */
    updateSlot(slot) {
        // Cari layer def yang match slot ini
        const def = LAYER_DEF.find(d => d.slot === slot);
        if (!def) return;

        const layerObj = this._layers[def.id];
        if (!layerObj) return;

        // Hapus objects lama dari container
        layerObj.objects.forEach(o => {
            this.container.remove(o, true);
        });

        // Build ulang layer ini
        const eq   = this.player.equipment || {};
        const item = def.slot ? eq[def.slot] : null;
        const newLayer = this._buildLayer(def, item, this.scale);
        this._layers[def.id] = newLayer;

        // Tambah ke container (di posisi yang sama dalam urutan)
        // Cari index urutan yang benar berdasarkan LAYER_DEF
        const defIndex = LAYER_DEF.indexOf(def);
        // Hitung offset: berapa object total sebelum layer ini
        let insertAt = 0;
        for (let i = 0; i < defIndex; i++) {
            const layId = LAYER_DEF[i].id;
            insertAt += (this._layers[layId]?.objects.length ?? 0);
        }

        newLayer.objects.forEach((obj, i) => {
            this.container.addAt(obj, insertAt + i);
        });

        // Re-init glow jika perlu
        if (this._pendingGlow) {
            this.scene.tweens.add({
                targets:  this._pendingGlow,
                alpha:    { from: 0.1, to: 0.35 },
                scale:    { from: 1,   to: 1.4  },
                duration: 900,
                ease:     'Sine.easeInOut',
                yoyo:     true,
                repeat:   -1,
            });
            this._pendingGlow = null;
        }
    }

    /**
     * Rebuild total (misalnya setelah load save / equip banyak item).
     */
    refresh() {
        if (this._idleTween) this._idleTween.stop();
        this._buildAll();
    }

    /**
     * Play animasi "hit" — flash merah + getaran sebentar.
     */
    playHitAnim() {
        if (this._hitTween) this._hitTween.stop();

        const origX = this.container.x;

        this._hitTween = this.scene.tweens.add({
            targets:  this.container,
            x:        { from: origX - 6, to: origX + 6 },
            duration: 60,
            repeat:   3,
            yoyo:     true,
            onComplete: () => {
                this.container.x = origX;
            },
        });

        // Flash putih sekilas
        this.scene.tweens.add({
            targets:  this.container,
            alpha:    { from: 0.3, to: 1 },
            duration: 80,
            yoyo:     true,
            repeat:   1,
        });
    }

    /**
     * Play animasi "death" — turun + fade out.
     * @param {function} onComplete
     */
    playDeathAnim(onComplete) {
        if (this._idleTween) this._idleTween.stop();

        this.scene.tweens.add({
            targets:  this.container,
            y:        this.container.y + 30,
            alpha:    0,
            duration: 600,
            ease:     'Power2',
            onComplete: () => {
                this.container.setVisible(false);
                if (onComplete) onComplete();
            },
        });
    }

    /**
     * Play animasi "level up" — scale naik turun + flash.
     */
    playLevelUpAnim() {
        this.scene.tweens.add({
            targets:  this.container,
            scaleY:   { from: 1, to: 1.1 },
            scaleX:   { from: 1, to: 1.05 },
            alpha:    { from: 1, to: 0.8 },
            duration: 200,
            yoyo:     true,
            repeat:   2,
        });
    }

    /**
     * Set posisi baru.
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.container.setPosition(x, y);
    }

    /**
     * Set depth.
     */
    setDepth(d) {
        this.depth = d;
        this.container.setDepth(d);
    }

    /**
     * Destroy semua object.
     */
    destroy() {
        if (this._idleTween)  this._idleTween.stop();
        if (this._hitTween)   this._hitTween.stop();
        this.container.destroy(true);
    }

    // ── Hover Interaction (opsional) ──────────────────────────

    _addHoverInteraction() {
        // Buat invisible hit area di tengah container
        const hitArea = this.scene.add.rectangle(
            0, 0, 60 * this.scale, 80 * this.scale,
            0x000000, 0
        ).setInteractive({ useHandCursor: true });

        this.container.add(hitArea);

        hitArea.on('pointerover', () => {
            this.scene.tweens.add({
                targets:  this.container,
                scaleX:   1.06,
                scaleY:   1.06,
                duration: 120,
            });
        });

        hitArea.on('pointerout', () => {
            this.scene.tweens.add({
                targets:  this.container,
                scaleX:   1,
                scaleY:   1,
                duration: 120,
            });
        });

        hitArea.on('pointerdown', () => {
            this.scene.events.emit('paperdoll:clicked', this.player);
        });
    }
}

// ── Helpers ───────────────────────────────────────────────────

function _adjustBrightness(hex, factor) {
    const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.floor(((hex >> 8)  & 0xff) * factor));
    const b = Math.min(255, Math.floor(( hex        & 0xff) * factor));
    return (r << 16) | (g << 8) | b;
}

function _raritySymbol(rarity) {
    const map = {
        common:    '○',
        uncommon:  '◆',
        rare:      '★',
        epic:      '✦',
        legendary: '✸',
    };
    return map[rarity] ?? '○';
}