// ============================================================
// DeckViewerOverlay.js — overlay untuk lihat semua kartu di deck
// Bisa dipanggil dari CombatScene, ShopScene, RewardScene, dll
// ============================================================

import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const TYPE_COLORS = {
    attack:  0xcc4444,
    defense: 0x2244cc,
    magic:   0x8833cc,
    support: 0x33aa44,
    special: 0xcc8833,
};

const CARDS_PER_ROW = 6;
const CARD_W        = 110;
const CARD_H        = 140;
const CARD_GAP      = 12;

export class DeckViewerOverlay {

    /**
     * Tampilkan overlay deck viewer.
     * @param {Phaser.Scene} scene       - scene yang memanggilnya
     * @param {object[]}     allCards    - array semua kartu (deck + discard + hand)
     * @param {object}       options
     * @param {boolean}      options.canPurge    - apakah kartu bisa di-purge/jual
     * @param {number}       options.purgePrice  - harga purge (gold)
     * @param {boolean}      options.canUpgrade  - apakah kartu bisa di-upgrade
     * @param {Function}     options.onPurge     - callback saat purge (card) => void
     * @param {Function}     options.onUpgrade   - callback saat upgrade (card) => void
     * @param {Function}     options.onClose     - callback saat ditutup
     */
    static show(scene, allCards, options = {}) {
        const {
            canPurge   = false,
            canUpgrade = false,
            purgePrice = 50,
            onPurge    = null,
            onUpgrade  = null,
            onClose    = null,
        } = options;

        const objects = [];

        // ── Overlay background ────────────────────────────────
        const overlay = scene.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.88
        ).setDepth(40).setInteractive();
        objects.push(overlay);

        // ── Panel ─────────────────────────────────────────────
        const panelW = GAME_WIDTH - 80;
        const panelH = GAME_HEIGHT - 80;
        const panel  = scene.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            panelW, panelH, 0x0a0a14
        ).setStrokeStyle(1, 0x223344).setDepth(41);
        objects.push(panel);

        // ── Header ────────────────────────────────────────────
        const header = scene.add.text(GAME_WIDTH / 2, 60, `DECK  —  ${allCards.length} Kartu`, {
            fontFamily: 'monospace', fontSize: '18px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(42);
        objects.push(header);

        // ── Close button ──────────────────────────────────────
        const closeBg = scene.add.rectangle(GAME_WIDTH - 60, 60, 70, 28, 0x111122)
            .setStrokeStyle(1, 0x334455)
            .setInteractive({ useHandCursor: true })
            .setDepth(42);
        const closeTxt = scene.add.text(GAME_WIDTH - 60, 60, '✕ Tutup', {
            fontFamily: 'monospace', fontSize: '12px', color: '#556677',
        }).setOrigin(0.5).setDepth(43);

        closeBg.on('pointerover', () => { closeBg.setFillStyle(0x1a1a33); closeTxt.setColor('#aabbcc'); });
        closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x111122); closeTxt.setColor('#556677'); });
        closeBg.on('pointerdown', () => {
            objects.forEach(o => { try { o.destroy(); } catch(e){} });
            cardObjects.forEach(o => { try { o.destroy(); } catch(e){} });
            onClose?.();
        });
        objects.push(closeBg, closeTxt);

        // ESC juga tutup
        const escHandler = () => {
            objects.forEach(o => { try { o.destroy(); } catch(e){} });
            cardObjects.forEach(o => { try { o.destroy(); } catch(e){} });
            scene.input.keyboard.off('keydown-ESC', escHandler);
            onClose?.();
        };
        scene.input.keyboard.on('keydown-ESC', escHandler);

        // ── Scroll area ───────────────────────────────────────
        // Group kartu berdasarkan tipe
        const grouped = _groupCards(allCards);

        const cardObjects = [];
        let currentY = 95;

        for (const [typeName, cards] of Object.entries(grouped)) {
            if (cards.length === 0) continue;

            // Section label
            const label = scene.add.text(60, currentY, `${typeName.toUpperCase()}  (${cards.length})`, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#334455', letterSpacing: 2,
            }).setDepth(42);
            cardObjects.push(label);
            currentY += 20;

            // Render kartu
            let col = 0;
            let rowStartY = currentY;

            for (const card of cards) {
                const x = 60 + col * (CARD_W + CARD_GAP) + CARD_W / 2;
                const y = rowStartY + CARD_H / 2;

                const objs = _renderCard(scene, card, x, y, canPurge, canUpgrade, purgePrice, {
                    onPurge: onPurge ? () => {
                        onPurge(card);
                        // Tutup dan buka ulang dengan deck yang sudah diupdate
                        objects.forEach(o => { try { o.destroy(); } catch(e){} });
                        cardObjects.forEach(o => { try { o.destroy(); } catch(e){} });
                    } : null,
                    onUpgrade: onUpgrade ? () => {
                        onUpgrade(card);
                        objects.forEach(o => { try { o.destroy(); } catch(e){} });
                        cardObjects.forEach(o => { try { o.destroy(); } catch(e){} });
                    } : null,
                });
                cardObjects.push(...objs);

                col++;
                if (col >= CARDS_PER_ROW) {
                    col = 0;
                    rowStartY += CARD_H + CARD_GAP;
                }
            }

            const rowsUsed = Math.ceil(cards.length / CARDS_PER_ROW);
            currentY = rowStartY + rowsUsed * (CARD_H + CARD_GAP) + 16;
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────

function _groupCards(cards) {
    const groups = { attack: [], defense: [], magic: [], support: [], special: [] };
    for (const card of cards) {
        const t = card.type || 'attack';
        if (groups[t]) groups[t].push(card);
        else groups.special.push(card);
    }
    return groups;
}

function _renderCard(scene, card, x, y, canPurge, canUpgrade, purgePrice, callbacks) {
    const objs   = [];
    const w = CARD_W, h = CARD_H;
    const bColor = TYPE_COLORS[card.type] || 0x444466;

    // Background
    const bg = scene.add.rectangle(x, y, w, h, 0x111122)
        .setStrokeStyle(1, bColor).setDepth(42);
    objs.push(bg);

    // Type label
    const typeTxt = scene.add.text(x, y - h/2 + 10, (card.type || '').toUpperCase(), {
        fontFamily: 'monospace', fontSize: '7px', color: '#334455', letterSpacing: 1,
    }).setOrigin(0.5).setDepth(43);
    objs.push(typeTxt);

    // Cost
    const costCircle = scene.add.circle(x - w/2 + 12, y - h/2 + 12, 10, 0x080810)
        .setStrokeStyle(1, bColor).setDepth(43);
    const costTxt = scene.add.text(x - w/2 + 12, y - h/2 + 12, `${card.cost ?? 0}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffcc44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(44);
    objs.push(costCircle, costTxt);

    // Upgraded badge
    if (card.isUpgraded) {
        const badge = scene.add.text(x + w/2 - 4, y - h/2 + 4, '★', {
            fontFamily: 'monospace', fontSize: '10px', color: '#44cc44',
        }).setOrigin(1, 0).setDepth(44);
        objs.push(badge);
    }

    // Nama
    const nameTxt = scene.add.text(x, y - 18, card.name || '', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
        align: 'center', wordWrap: { width: w - 10 },
    }).setOrigin(0.5).setDepth(43);
    objs.push(nameTxt);

    // Stat singkat
    const statStr = card.damage ? `⚔ ${card.damage}` : card.block ? `🛡 ${card.block}` : card.heal ? `❤ ${card.heal}` : '';
    if (statStr) {
        const statTxt = scene.add.text(x, y + 5, statStr, {
            fontFamily: 'monospace', fontSize: '11px', color: '#667788',
        }).setOrigin(0.5).setDepth(43);
        objs.push(statTxt);
    }

    // Deskripsi singkat
    const desc = (card.description || '').substring(0, 40) + (card.description?.length > 40 ? '...' : '');
    const descTxt = scene.add.text(x, y + 25, desc, {
        fontFamily: 'monospace', fontSize: '8px', color: '#445566',
        align: 'center', wordWrap: { width: w - 12 },
    }).setOrigin(0.5).setDepth(43);
    objs.push(descTxt);

    // Tombol aksi
    if (canPurge && callbacks.onPurge) {
        const purgeBg = scene.add.rectangle(x, y + h/2 - 12, w - 4, 20, 0x1a0808)
            .setStrokeStyle(1, 0x441111)
            .setInteractive({ useHandCursor: true })
            .setDepth(43);
        const purgeTxt = scene.add.text(x, y + h/2 - 12, `Buang`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#884444',
        }).setOrigin(0.5).setDepth(44);

        purgeBg.on('pointerover', () => { purgeBg.setFillStyle(0x2a0808); purgeTxt.setColor('#cc6666'); });
        purgeBg.on('pointerout',  () => { purgeBg.setFillStyle(0x1a0808); purgeTxt.setColor('#884444'); });
        purgeBg.on('pointerdown', () => callbacks.onPurge());
        objs.push(purgeBg, purgeTxt);
    }

    if (canUpgrade && card.upgradedId && callbacks.onUpgrade) {
        const upgBg = scene.add.rectangle(x, y + h/2 - 12, w - 4, 20, 0x081a08)
            .setStrokeStyle(1, 0x114411)
            .setInteractive({ useHandCursor: true })
            .setDepth(43);
        const upgTxt = scene.add.text(x, y + h/2 - 12, '↑ Upgrade', {
            fontFamily: 'monospace', fontSize: '9px', color: '#448844',
        }).setOrigin(0.5).setDepth(44);

        upgBg.on('pointerover', () => { upgBg.setFillStyle(0x0a2a0a); upgTxt.setColor('#66cc66'); });
        upgBg.on('pointerout',  () => { upgBg.setFillStyle(0x081a08); upgTxt.setColor('#448844'); });
        upgBg.on('pointerdown', () => callbacks.onUpgrade());
        objs.push(upgBg, upgTxt);
    }

    return objs;
}