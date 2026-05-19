// ============================================================
// DeckViewerOverlay.js — overlay visual semua kartu di deck
// Fix: masking supaya kartu tidak keluar container saat scroll
// Fix: info kartu lengkap (damage, block, efek, deskripsi)
// ============================================================

import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const TYPE_COLORS = {
    attack:  0xcc4444,
    defense: 0x2244cc,
    magic:   0x8833cc,
    support: 0x33aa44,
    special: 0xcc8833,
};

const TYPE_LABELS = {
    attack:  'SERANGAN',
    defense: 'BERTAHAN',
    magic:   'SIHIR',
    support: 'DUKUNGAN',
    special: 'SPESIAL',
};

// Layout kartu
const CARD_W       = 155;
const CARD_H       = 200;
const CARD_GAP_X   = 10;
const CARD_GAP_Y   = 14;
const CARDS_PER_ROW = 7;

// Panel area
const PX = 50;   // panel left
const PY = 50;   // panel top
const PW = GAME_WIDTH  - 100;
const PH = GAME_HEIGHT - 100;

// Content area (dalam panel, di bawah header)
const CX  = PX + 10;          // content left
const CY  = PY + 48;          // content top (di bawah header)
const CW  = PW - 20;          // content width
const CH  = PH - 58;          // content height (dikurangi header)

export class DeckViewerOverlay {

    static show(scene, allCards, options = {}) {
        const v = new _Viewer(scene, allCards, options);
        v.build();
        return v;
    }
}

class _Viewer {
    constructor(scene, allCards, options) {
        this.scene    = scene;
        this.allCards = allCards;
        this.options  = {
            canPurge:   false,
            canUpgrade: false,
            purgePrice: 50,
            onPurge:    null,
            onUpgrade:  null,
            onClose:    null,
            ...options,
        };
        this.bgObjs      = [];  // overlay + panel + header (tidak discroll)
        this.cardObjs    = [];  // kartu (discroll)
        this._scrollY    = 0;
        this._maxScroll  = 0;
        this._active     = false;

        // Posisi Y dasar tiap kartu (sebelum scroll)
        this._cardBaseYs = [];
    }

    build() {
        const s = this.scene;

        // ── Background overlay ────────────────────────────────
        const bgOverlay = s.add.rectangle(
            GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.88
        ).setDepth(40).setInteractive();
        this.bgObjs.push(bgOverlay);

        // ── Panel background ──────────────────────────────────
        const panel = s.add.rectangle(
            PX + PW/2, PY + PH/2, PW, PH, 0x0a0a14
        ).setStrokeStyle(1, 0x334455).setDepth(41);
        this.bgObjs.push(panel);

        // ── Header ────────────────────────────────────────────
        const title = s.add.text(PX + PW/2, PY + 22,
            `DECK  —  ${this.allCards.length} / 30 Kartu`, {
            fontFamily: 'monospace', fontSize: '15px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(42);
        this.bgObjs.push(title);

        // Tombol tutup
        const closeBg = s.add.rectangle(PX + PW - 45, PY + 22, 72, 24, 0x111122)
            .setStrokeStyle(1, 0x334455).setInteractive({ useHandCursor: true }).setDepth(42);
        const closeTxt = s.add.text(PX + PW - 45, PY + 22, '✕ Tutup', {
            fontFamily: 'monospace', fontSize: '11px', color: '#556677',
        }).setOrigin(0.5).setDepth(43);
        closeBg.on('pointerover', () => { closeBg.setFillStyle(0x1a1a33); closeTxt.setColor('#aabbcc'); });
        closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x111122); closeTxt.setColor('#556677'); });
        closeBg.on('pointerdown', () => this.destroy());
        this.bgObjs.push(closeBg, closeTxt);

        // Garis pemisah header
        const line = s.add.graphics().setDepth(42);
        line.lineStyle(1, 0x1a1a2e, 1);
        line.moveTo(PX + 10, PY + 42).lineTo(PX + PW - 10, PY + 42).strokePath();
        this.bgObjs.push(line);

        // Hint scroll
        const hint = s.add.text(PX + PW/2, PY + PH - 14,
            '▲▼ Scroll untuk lihat lebih', {
            fontFamily: 'monospace', fontSize: '9px', color: '#1a1a33',
        }).setOrigin(0.5).setDepth(42);
        this.bgObjs.push(hint);

        // ── Mask — kartu tidak boleh keluar dari panel ────────
        // Buat graphics mask berbentuk rectangle area konten
        this._maskGfx = s.make.graphics({ x: 0, y: 0, add: false });
        this._maskGfx.fillRect(CX, CY, CW, CH);
        this._mask = this._maskGfx.createGeometryMask();

        // ── Render kartu ──────────────────────────────────────
        this._buildCards();

        // ── ESC & Scroll ──────────────────────────────────────
        this._active = true;
        this._escHandler = () => this.destroy();
        s.input.keyboard.on('keydown-ESC', this._escHandler);

        s.input.on('wheel', (_p, _go, _dx, deltaY) => {
            if (!this._active) return;
            this._scrollY = Math.max(0, Math.min(this._scrollY + deltaY * 0.6, this._maxScroll));
            this._applyScroll();
        });
    }

    _buildCards() {
        // Hapus kartu lama
        this.cardObjs.forEach(o => { try { o.destroy(); } catch(e){} });
        this.cardObjs    = [];
        this._cardBaseYs = [];

        const grouped = this._group();
        let offsetY   = 0;  // offset dari atas content area

        for (const [type, cards] of Object.entries(grouped)) {
            if (cards.length === 0) continue;

            // Section label
            const labelAbsY = CY + offsetY;
            const label = this.scene.add.text(CX + 4, labelAbsY,
                `${TYPE_LABELS[type] || type.toUpperCase()}  (${cards.length})`, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#445566', letterSpacing: 2,
            }).setDepth(44).setMask(this._mask);
            label._baseY   = offsetY;
            label._isLabel = true;
            this.cardObjs.push(label);
            offsetY += 26;

            // Kartu dalam section ini
            let col      = 0;
            let rowStart = offsetY;

            for (const card of cards) {
                const cardOffsetY = rowStart + (CARD_H + CARD_GAP_Y) * Math.floor(col / CARDS_PER_ROW);

                // Kalau col sudah melebihi baris, pindah ke baris baru
                const row = Math.floor(col / CARDS_PER_ROW);
                const c   = col % CARDS_PER_ROW;

                const absX = CX + c * (CARD_W + CARD_GAP_X) + CARD_W/2;
                const absY = CY + rowStart + row * (CARD_H + CARD_GAP_Y) + CARD_H/2;

                const objs = this._renderCard(card, absX, absY,
                    rowStart + row * (CARD_H + CARD_GAP_Y) + CARD_H/2);
                this.cardObjs.push(...objs);

                col++;
            }

            const rows = Math.ceil(cards.length / CARDS_PER_ROW);
            offsetY = rowStart + rows * (CARD_H + CARD_GAP_Y) + 18;
        }

        this._maxScroll = Math.max(0, offsetY - CH + 20);
    }

    _renderCard(card, absX, absY, baseY) {
        const s      = this.scene;
        const objs   = [];
        const w = CARD_W, h = CARD_H;
        const bColor = TYPE_COLORS[card.type] || 0x444466;
        const depth  = 44;
        const mask   = this._mask;

        const mk = (o) => { o._baseY = baseY; o.setMask(mask); objs.push(o); return o; };

        // Background kartu
        mk(s.add.rectangle(absX, absY, w, h, 0x111122)
            .setStrokeStyle(card.isUpgraded ? 2 : 1, card.isUpgraded ? 0x44cc44 : bColor)
            .setDepth(depth));

        // Color bar atas
        mk(s.add.rectangle(absX, absY - h/2 + 10, w - 2, 18,
            TYPE_COLORS[card.type] || 0x444466, 0.25)
            .setDepth(depth));

        // Tipe kartu
        mk(s.add.text(absX, absY - h/2 + 10,
            TYPE_LABELS[card.type] || card.type?.toUpperCase() || '', {
            fontFamily: 'monospace', fontSize: '7px',
            color: '#556677', letterSpacing: 1,
        }).setOrigin(0.5).setDepth(depth + 1));

        // Cost circle
        mk(s.add.circle(absX - w/2 + 14, absY - h/2 + 10, 11, 0x080810)
            .setStrokeStyle(1, bColor)
            .setDepth(depth + 1));
        mk(s.add.text(absX - w/2 + 14, absY - h/2 + 10, `${card.cost ?? 0}`, {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depth + 2));

        // Badge upgrade
        if (card.isUpgraded) {
            mk(s.add.text(absX + w/2 - 6, absY - h/2 + 4, '★ UP', {
                fontFamily: 'monospace', fontSize: '8px', color: '#44cc44',
            }).setOrigin(1, 0).setDepth(depth + 2));
        }

        // Nama kartu
        mk(s.add.text(absX, absY - h/2 + 32, card.name || '???', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: w - 10 },
        }).setOrigin(0.5).setDepth(depth + 1));

        // Garis pemisah
        const lineGfx = s.add.graphics().setDepth(depth + 1).setMask(mask);
        lineGfx.lineStyle(1, 0x1a1a2e, 1);
        lineGfx.moveTo(absX - w/2 + 8, absY - h/2 + 46);
        lineGfx.lineTo(absX + w/2 - 8, absY - h/2 + 46);
        lineGfx.strokePath();
        lineGfx._baseY = baseY;
        objs.push(lineGfx);

        // Stats (damage / block / heal)
        const stats = [];
        if (card.damage) stats.push(`⚔ ${card.damage} ${card.hits > 1 ? `(×${card.hits})` : ''}`);
        if (card.block)  stats.push(`🛡 ${card.block}`);
        if (card.heal)   stats.push(`❤ ${card.heal}`);
        if (stats.length > 0) {
            mk(s.add.text(absX, absY - h/2 + 60, stats.join('  '), {
                fontFamily: 'monospace', fontSize: '12px', color: '#cc8833',
            }).setOrigin(0.5).setDepth(depth + 1));
        }

        // Effects (burn, poison, dll)
        if (card.effects && card.effects.length > 0) {
            const effStr = card.effects
                .map(e => `${e.type} ${e.value}×${e.duration}t`)
                .join(', ');
            mk(s.add.text(absX, absY - h/2 + 78, effStr, {
                fontFamily: 'monospace', fontSize: '8px', color: '#6699aa',
                align: 'center', wordWrap: { width: w - 12 },
            }).setOrigin(0.5).setDepth(depth + 1));
        }

        // Deskripsi
        const descY = card.effects?.length > 0 ? absY - h/2 + 100 : absY - h/2 + 82;
        if (card.description) {
            mk(s.add.text(absX, descY, card.description, {
                fontFamily: 'monospace', fontSize: '9px', color: '#556677',
                align: 'center', wordWrap: { width: w - 14 },
            }).setOrigin(0.5).setDepth(depth + 1));
        }

        // Upgrade info
        if (card.upgradedId) {
            mk(s.add.text(absX, absY + h/2 - 32,
                `↑ ${card.upgradedId.replace(/_/g, ' ')}`, {
                fontFamily: 'monospace', fontSize: '8px', color: '#334433',
                align: 'center',
            }).setOrigin(0.5).setDepth(depth + 1));
        }

        // Tombol aksi
        if (this.options.canPurge && this.options.onPurge) {
            const pb = s.add.rectangle(absX, absY + h/2 - 14, w - 8, 20, 0x1a0808)
                .setStrokeStyle(1, 0x441111)
                .setInteractive({ useHandCursor: true })
                .setDepth(depth + 1).setMask(mask);
            pb._baseY = baseY;
            const pt = s.add.text(absX, absY + h/2 - 14, 'Buang dari Deck', {
                fontFamily: 'monospace', fontSize: '9px', color: '#884444',
            }).setOrigin(0.5).setDepth(depth + 2).setMask(mask);
            pt._baseY = baseY;
            pb.on('pointerover', () => { pb.setFillStyle(0x2a0808); pt.setColor('#cc6666'); });
            pb.on('pointerout',  () => { pb.setFillStyle(0x1a0808); pt.setColor('#884444'); });
            pb.on('pointerdown', () => { this.options.onPurge(card); this.destroy(); });
            objs.push(pb, pt);
        }

        if (this.options.canUpgrade && card.upgradedId && this.options.onUpgrade) {
            const ub = s.add.rectangle(absX, absY + h/2 - 14, w - 8, 20, 0x081a08)
                .setStrokeStyle(1, 0x114411)
                .setInteractive({ useHandCursor: true })
                .setDepth(depth + 1).setMask(mask);
            ub._baseY = baseY;
            const ut = s.add.text(absX, absY + h/2 - 14, '↑ Upgrade Kartu', {
                fontFamily: 'monospace', fontSize: '9px', color: '#448844',
            }).setOrigin(0.5).setDepth(depth + 2).setMask(mask);
            ut._baseY = baseY;
            ub.on('pointerover', () => { ub.setFillStyle(0x0a2a0a); ut.setColor('#66cc66'); });
            ub.on('pointerout',  () => { ub.setFillStyle(0x081a08); ut.setColor('#448844'); });
            ub.on('pointerdown', () => { this.options.onUpgrade(card); this.destroy(); });
            objs.push(ub, ut);
        }

        return objs;
    }

    _applyScroll() {
        for (const obj of this.cardObjs) {
            if (obj._baseY === undefined) continue;
            const newY = (obj._isLabel
                ? CY + obj._baseY - this._scrollY
                : obj.y - (this._scrollY - this._prevScrollY));

            // Untuk label (text), update y langsung
            if (obj._isLabel) {
                obj.y = newY;
            }
        }

        // Cara yang lebih efisien: set container offset
        // Karena kita tidak pakai container, re-render dengan scrollY baru
        this._prevScrollY = this._scrollY;
        this._rebuildCards();
    }

    _rebuildCards() {
        this.cardObjs.forEach(o => { try { o.destroy(); } catch(e){} });
        this.cardObjs = [];
        this._buildCardsWithScroll();
    }

    _buildCardsWithScroll() {
        const grouped = this._group();
        let offsetY   = -this._scrollY;

        for (const [type, cards] of Object.entries(grouped)) {
            if (cards.length === 0) continue;

            const labelAbsY = CY + offsetY;
            if (labelAbsY > PY + 42 && labelAbsY < PY + PH - 10) {
                const label = this.scene.add.text(CX + 4, labelAbsY,
                    `${TYPE_LABELS[type] || type.toUpperCase()}  (${cards.length})`, {
                    fontFamily: 'monospace', fontSize: '11px',
                    color: '#445566', letterSpacing: 2,
                }).setDepth(44).setMask(this._mask);
                label._baseY   = offsetY;
                label._isLabel = true;
                this.cardObjs.push(label);
            }
            offsetY += 26;

            let col      = 0;
            let rowStart = offsetY;

            for (const card of cards) {
                const row  = Math.floor(col / CARDS_PER_ROW);
                const c    = col % CARDS_PER_ROW;
                const absX = CX + c * (CARD_W + CARD_GAP_X) + CARD_W/2;
                const absY = CY + rowStart + row * (CARD_H + CARD_GAP_Y) + CARD_H/2;

                // Hanya render kartu yang visible
                const top    = absY - CARD_H/2;
                const bottom = absY + CARD_H/2;
                if (bottom > PY + 42 && top < PY + PH - 10) {
                    const objs = this._renderCard(card, absX, absY,
                        rowStart + row * (CARD_H + CARD_GAP_Y) + CARD_H/2);
                    this.cardObjs.push(...objs);
                }

                col++;
            }

            const rows = Math.ceil(cards.length / CARDS_PER_ROW);
            offsetY = rowStart + rows * (CARD_H + CARD_GAP_Y) + 18;
        }

        this._maxScroll = Math.max(0, offsetY + this._scrollY - CH + 20);
    }

    _buildCards() {
        this._scrollY = 0;
        this._prevScrollY = 0;
        this._buildCardsWithScroll();
    }

    _group() {
        const g = { attack: [], defense: [], magic: [], support: [], special: [] };
        for (const c of this.allCards) {
            const t = c.type || 'attack';
            (g[t] || g.special).push(c);
        }
        return g;
    }

    destroy() {
        this._active = false;
        this.scene.input.keyboard.off('keydown-ESC', this._escHandler);
        this.scene.input.off('wheel');
        this.bgObjs.forEach(o   => { try { o.destroy(); } catch(e){} });
        this.cardObjs.forEach(o => { try { o.destroy(); } catch(e){} });
        try { this._maskGfx.destroy(); } catch(e){}
        this.options.onClose?.();
    }
}