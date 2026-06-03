// ============================================================
// ui/RelicDisplay.js — tampilkan relic aktif player
// Dipakai di NodeMapScene (bar kecil bawah layar)
// dan sebagai overlay detail kalau diklik
// ============================================================

import { getRelic }    from '../data/relics/index.js';
import { SaveSystem }  from '../storage/SaveSystem.js';

// Warna per tier relic
const TIER_COLOR = {
    1: 0x557755,   // hijau redup — tier 1
    2: 0x336699,   // biru         — tier 2
    3: 0x774499,   // ungu         — tier 3
    4: 0xaa7722,   // emas         — tier 4
};

export class RelicDisplay {

    /**
     * Render bar relic kecil di bagian bawah layar.
     * Klik salah satu relic → buka tooltip detail.
     *
     * @param {Phaser.Scene} scene
     * @param {string[]}     relicIds  — dari player.activeRelics
     * @param {object}       opts
     * @param {number}       opts.x    — center X (default: GAME_WIDTH/2)
     * @param {number}       opts.y    — Y position (default: GAME_HEIGHT - 48)
     * @param {number}       opts.depth
     */
    static show(scene, relicIds = [], opts = {}) {
        const display = new RelicDisplay(scene, relicIds, opts);
        display._build();
        return display;
    }

    constructor(scene, relicIds, opts = {}) {
        this.scene    = scene;
        this.relicIds = relicIds.filter(id => getRelic(id));
        this.x        = opts.x     ?? scene.cameras.main.width  / 2;
        this.y        = opts.y     ?? scene.cameras.main.height - 48;
        this.depth    = opts.depth ?? 5;

        this._objects  = [];
        this._tooltip  = null;
    }

    _build() {
        if (this.relicIds.length === 0) return;

        const iconSize = 32;
        const gap      = 6;
        const total    = this.relicIds.length;
        const startX   = this.x - ((total - 1) * (iconSize + gap)) / 2;

        // Label kecil
        const lbl = this.scene.add.text(this.x, this.y - iconSize / 2 - 10, 'JIMAT AKTIF', {
            fontFamily: 'monospace', fontSize: '9px',
            color: '#334455', letterSpacing: 2,
        }).setOrigin(0.5).setDepth(this.depth);
        this._objects.push(lbl);

        this.relicIds.forEach((id, i) => {
            const relic = getRelic(id);
            if (!relic) return;

            const x         = startX + i * (iconSize + gap);
            const tierColor = TIER_COLOR[relic.tier] || 0x444455;

            // Background ikon
            const bg = this.scene.add.rectangle(x, this.y, iconSize, iconSize, 0x0d0d18)
                .setStrokeStyle(1, tierColor)
                .setInteractive({ useHandCursor: true })
                .setDepth(this.depth);
            this._objects.push(bg);

            // Icon emoji
            const icon = this.scene.add.text(x, this.y, relic.icon, {
                fontFamily: 'monospace', fontSize: '16px',
            }).setOrigin(0.5).setDepth(this.depth + 1);
            this._objects.push(icon);

            // Tier dot (pojok kanan bawah)
            const dot = this.scene.add.circle(
                x + iconSize / 2 - 4, this.y + iconSize / 2 - 4,
                4, tierColor
            ).setDepth(this.depth + 2);
            this._objects.push(dot);

            // Hover → tooltip
            bg.on('pointerover', () => {
                bg.setStrokeStyle(2, tierColor);
                this._showTooltip(relic, x, this.y - iconSize / 2 - 10);
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(1, tierColor);
                this._hideTooltip();
            });
        });
    }

    _showTooltip(relic, x, y) {
        this._hideTooltip();

        const w = 220, h = 100;
        const tx = Math.min(x, this.scene.cameras.main.width - w - 10);
        const ty = Math.max(y - h, 10);

        const objs = [];
        const tierColor = TIER_COLOR[relic.tier] || 0x444455;
        const tierHexStr = '#' + tierColor.toString(16).padStart(6, '0');

        const bg = this.scene.add.rectangle(tx + w / 2, ty + h / 2, w, h, 0x0d0d18)
            .setStrokeStyle(1, tierColor).setDepth(20);
        objs.push(bg);

        const title = this.scene.add.text(tx + 10, ty + 12, `${relic.icon}  ${relic.name}`, {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#ccddee', fontStyle: 'bold',
        }).setDepth(21);
        objs.push(title);

        const tierTxt = this.scene.add.text(tx + 10, ty + 28,
            `Tier ${relic.tier}`, {
                fontFamily: 'monospace', fontSize: '9px', color: tierHexStr,
            }).setDepth(21);
        objs.push(tierTxt);

        const desc = this.scene.add.text(tx + 10, ty + 44, relic.description, {
            fontFamily: 'monospace', fontSize: '10px', color: '#44aa66',
            wordWrap: { width: w - 16 },
        }).setDepth(21);
        objs.push(desc);

        if (relic.flavorText) {
            const flavor = this.scene.add.text(tx + 10, ty + 76, relic.flavorText, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#334455', fontStyle: 'italic',
                wordWrap: { width: w - 16 },
            }).setDepth(21);
            objs.push(flavor);
        }

        this._tooltip = objs;
    }

    _hideTooltip() {
        if (this._tooltip) {
            this._tooltip.forEach(o => { try { o.destroy(); } catch(e){} });
            this._tooltip = null;
        }
    }

    destroy() {
        this._hideTooltip();
        this._objects.forEach(o => { try { o.destroy(); } catch(e){} });
        this._objects = [];
    }
}