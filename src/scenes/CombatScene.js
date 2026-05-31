// ============================================================
// CombatScene.js — layar pertarungan utama
// Flow baru: pilih kartu → queue → SERANG / END TURN
// Fix: kartu tidak muncul di elite, tooltip detail kartu (hold)
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT,
    ENERGY_PER_TURN, STAT
} from '../config/constants.js';
import { Player }                         from '../entities/Player.js';
import { Monster }                        from '../entities/Monster.js';
import { CombatSystem, COMBAT_STATE }     from '../systems/CombatSystem.js';
import { DeckSystem }                     from '../systems/DeckSystem.js';
import { getMonster, getZoneMonsterPool } from '../data/monsters/index.js';
import { getBossForZone }                 from '../data/bosses/index.js';
import { getMiniBoss }                    from '../data/bosses/mini_bosses.js';
import { STARTER_DECK }                   from '../data/cards/index.js';
import { LootSystem }                     from '../systems/LootSystem.js';
import { GameGuard }                      from '../utils/GameGuard.js';
import { DeckViewerOverlay }              from '../ui/DeckViewerOverlay.js';
import { DamageNumber }                   from '../ui/DamageNumber.js';
import { PaperDollDisplay }               from '../ui/PaperDollDisplay.js';

export class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.COMBAT });
    }

    init(data) {
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.zone          = data.zone          || Math.ceil(this.floor / 10);
        this.isBoss        = data.isBoss        || false;
        this.isElite       = data.isElite       || false;
        this.isMini        = data.isMini        || false;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        if (data.playerData) {
            this.player = Player.fromJSON(data.playerData);

            // Reset hand ke discard dulu (sisa kartu dari combat sebelumnya)
            if (this.player.hand.length > 0) {
                this.player.discard.push(...this.player.hand);
                this.player.hand = [];
            }

            // Gabungkan deck + discard jadi satu, lalu shuffle ulang
            // Ini memastikan semua kartu tersedia di awal combat baru
            const allCards = [...this.player.deck, ...this.player.discard];
            if (allCards.length > 0) {
                this.player.deck    = allCards;
                this.player.discard = [];
                DeckSystem.shuffle(this.player.deck);
            } else {
                // Fallback kalau benar-benar kosong
                console.warn('[CombatScene] Deck kosong total, rebuild dari starter.');
                this.player.initStarterDeck(DeckSystem.buildDeckFromIds(STARTER_DECK));
            }
        } else {
            this.player = new Player({ curseLevel: this.curseLevel });
            this.player.initStarterDeck(DeckSystem.buildDeckFromIds(STARTER_DECK));
        }

        this.selectedQueue   = [];
        this.queueEnergyCost = 0;
        this._pauseOpen      = false;
        this._pauseObjects   = [];
    }

    async create() {
        console.log(
    'companions:',
    companions
);
        // Spawn monster atau boss sesuai tipe combat
        if (this.isBoss) {
            const bossData = getBossForZone(this.zone);
            this.monsters  = [ new Monster(bossData, this.floor) ];
        } else if (this.isMini) {
            const floorInZone = ((this.floor - 1) % 10) + 1;
            const miniData    = getMiniBoss(floorInZone, this.zone);
            this.monsters     = [ new Monster(miniData, this.floor) ];
        } else {
            // Combat biasa: 1-3 monster, elite selalu 2
            const pool      = getZoneMonsterPool(this.zone);
            const count     = this.isElite ? 2 : Phaser.Math.Between(1, 3);
            this.monsters   = [];

            for (let i = 0; i < count; i++) {
                const id   = pool[Math.floor(Math.random() * pool.length)];
                const data = getMonster(id) || getMonster('kappa');
                this.monsters.push(new Monster(data, this.floor));
            }
        }

        const companions = await this._buildCompanions();
        this.combat = new CombatSystem(this.player, this.monsters, companions);
        this.combat.start();

        // Build UI
        this._buildBackground();
        this._buildMonsterArea();
        this._saveMonsterPositions();
        this._buildPlayerArea();
        this._buildQueueArea();
        this._buildHUD();
        this._buildActionButtons();
        this._buildTooltip();
        this._buildMenuButton();

        // ESC toggle pause
        this.input.keyboard.on('keydown-ESC', () => {
            if (this._pauseOpen) this._closePauseMenu();
            else this._openPauseMenu();
        });

        // Render hand SETELAH semua UI siap
        this.cardObjects = [];
        this._refreshUI();
        this._renderHand();
    }

    // ── Background ────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080810);

        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 32) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        const label = `B${this.floor}  —  Zona ${this.zone}` +
            (this.isBoss  ? '  ⚠ BOSS'  : '') +
            (this.isElite ? '  ⚡ ELITE' : '');

        this.add.text(GAME_WIDTH / 2, 20, label, {
            fontFamily: 'monospace', fontSize: '13px',
            color: this.isBoss ? '#cc4433' : this.isElite ? '#cc8833' : '#333355',
        }).setOrigin(0.5, 0);
    }

    // ── Monster Area ──────────────────────────────────────────

    _buildMonsterArea() {
        this.monsterSprites      = [];
        this.monsterHpBars       = [];
        this.monsterHpTexts      = [];
        this.monsterIntentIcons  = [];
        this.monsterIntentLabels = [];
        this.monsterStatusTexts  = [];  
        this.monsterTargetRings  = [];  
        this.selectedTarget      = 0;   

        const startX = GAME_WIDTH / 2;
        const spacing = Math.min(240, (GAME_WIDTH - 200) / Math.max(this.monsters.length, 1));

        this.monsters.forEach((monster, i) => {
            const x = startX + (i - (this.monsters.length - 1) / 2) * spacing;
            const y = 220;

            // Target ring — lingkaran kuning saat monster ini dipilih
            const ring = this.add.circle(x, y, 54, 0x000000, 0)
                .setStrokeStyle(i === 0 ? 3 : 0, 0xffcc44)
                .setInteractive({ useHandCursor: true })
                .setDepth(2);

            // glow target
            const glow = this.add.circle(x, y, 68, 0xffcc44, 0.08)
                .setVisible(i === 0)
                .setDepth(1);

            this.tweens.add({
                targets: glow,
                scale: { from: 1, to: 1.15 },
                alpha: { from: 0.08, to: 0.22 },
                duration: 700,
                yoyo: true,
                repeat: -1,
            });

            ring.targetGlow = glow;
            ring.on('pointerdown', () => this._selectTarget(i));
            ring.on('pointerover', () => {
                if (i !== this.selectedTarget && !this.monsters[i]?.isDead) {
                    ring.setStrokeStyle(1, 0x886600);
                }
            });
            ring.on('pointerout', () => {
                if (i !== this.selectedTarget) ring.setStrokeStyle(0, 0x000000);
            });
            this.monsterTargetRings.push(ring);

            const spr = this.add.image(x, y, 'monster_basic').setScale(3).setOrigin(0.5);
            this.monsterSprites.push(spr);

            // HP bar
            this.add.rectangle(x, y + 85, 130, 14, 0x1a0000).setOrigin(0.5);
            const bar = this.add.rectangle(x - 64, y + 85, 128, 12, 0xcc2222).setOrigin(0, 0.5);
            this.monsterHpBars.push(bar);

            const hpTxt = this.add.text(x, y + 85, '', {
                fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
            }).setOrigin(0.5);
            this.monsterHpTexts.push(hpTxt);

            this.add.text(x, y + 100, monster.name, {
                fontFamily: 'monospace', fontSize: '12px', color: '#cc8833',
            }).setOrigin(0.5);

            // Status effect icons (di bawah nama)
            const statusTxt = this.add.text(x, y + 116, '', {
                fontFamily: 'monospace', fontSize: '9px', color: '#aabbcc',
                align: 'center', wordWrap: { width: 140 },
            }).setOrigin(0.5);
            this.monsterStatusTexts.push(statusTxt);

            // Intent
            const intentIcon = this.add.text(x, y - 90, '', {
                fontFamily: 'monospace', fontSize: '22px',
            }).setOrigin(0.5);
            this.monsterIntentIcons.push(intentIcon);

            const intentLabel = this.add.text(x, y - 65, '', {
                fontFamily: 'monospace', fontSize: '10px', color: '#556677',
            }).setOrigin(0.5);
            this.monsterIntentLabels.push(intentLabel);

            const targetArrow = this.add.text(
                x,
                y - 120,
                '▼ TARGET',
                {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#ffcc44',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 3,
                }
            )
            .setOrigin(0.5)
            .setVisible(i === 0)
            .setDepth(10);

            this.monsterTargetLabels ??= [];
            this.monsterTargetLabels.push(targetArrow);
        });
    }

    async _buildCompanions() {
        const { Companion } =
            await import('../entities/Companion.js');

        const { getCompanion } =
            await import('../data/companions/index.js');

        return (this.player.companions || [])
            .filter(Boolean)
            .map(saved => {
                const template = getCompanion(saved.id);
                if (!template) return null;

                return Companion.fromJSON(saved, template);
            })
            .filter(Boolean);
    }

    _selectTarget(index) {
        if (this.monsters[index]?.isDead) return;

        this.selectedTarget = index;

        this.monsterTargetRings.forEach((ring, i) => {
            const selected = i === index;

            ring.setStrokeStyle(
                selected ? 3 : 0,
                0xffcc44
            );

            ring.targetGlow?.setVisible(selected);

            this.monsterTargetLabels?.[i]
                ?.setVisible(selected);

            const spr = this.monsterSprites?.[i];

            if (!spr) return;

            this.tweens.add({
                targets: spr,
                y: selected
                    ? this.nodePositions[i].y - 6
                    : this.nodePositions[i].y,
                scale: selected ? 3.15 : 3,
                duration: 140,
            });
        });
    }

    // ── Player Area ───────────────────────────────────────────
    _saveMonsterPositions() {
        this.nodePositions = {};
        this.monsterSprites.forEach((spr, i) => {
            if (spr) this.nodePositions[i] = { x: spr.x, y: spr.y };
        });
    }

    _buildPlayerArea() {
        const px = 155, py = GAME_HEIGHT - 210;
    
        // ── Paper Doll ──────────────────────────────────────────
        // Ganti this.add.image(px, py - 95, 'player') dengan PaperDollDisplay
        this.paperDoll = new PaperDollDisplay(
            this,           // scene
            px,             // center X
            py - 95,        // center Y (sama dengan posisi image lama)
            this.player,    // player instance
            {
                scale:       2.4,   // scale up karena placeholder kecil
                depth:       2,
                interactive: false, // di combat tidak perlu klik
            }
        );
        // ────────────────────────────────────────────────────────
    
        this.add.text(px, py - 55, 'PLAYER', {
            fontFamily: 'monospace', fontSize: '10px', color: '#333355',
        }).setOrigin(0.5);
    
        this.add.rectangle(px, py - 38, 200, 14, 0x1a0000).setOrigin(0.5);
        this.playerHpBar  = this.add.rectangle(px - 99, py - 38, 198, 12, 0x44cc44).setOrigin(0, 0.5);
        this.playerHpText = this.add.text(px, py - 38, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
        }).setOrigin(0.5);
    
        this.playerBlockText = this.add.text(px, py - 18, '', {
            fontFamily: 'monospace', fontSize: '12px', color: '#4488cc',
        }).setOrigin(0.5);
    
        this.energyText = this.add.text(px, py, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#cc8833',
        }).setOrigin(0.5);
    
        this.playerStatusText = this.add.text(px, py + 18, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#aa6666',
        }).setOrigin(0.5);
    }

    updatePaperDoll(slot) {
        if (!this.paperDoll) return;
        if (slot) {
            // Update satu slot saja — lebih efisien
            this.paperDoll.updateSlot(slot);
        } else {
            // Rebuild total
            this.paperDoll.refresh();
        }
    }

    // ── Queue Area ────────────────────────────────────────────
    _buildQueueArea() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 195, 'ANTRIAN AKSI', {
            fontFamily: 'monospace', fontSize: '9px', color: '#222244', letterSpacing: 2,
        }).setOrigin(0.5);

        this.queueSlots = [];
        this.queueTexts = [];

        for (let i = 0; i < 3; i++) {
            const x = GAME_WIDTH / 2 - 120 + i * 120;

            const slot = this.add.rectangle(x, GAME_HEIGHT - 172, 110, 28, 0x0d0d1a)
                .setStrokeStyle(1, 0x1a1a2e);
            this.queueSlots.push(slot);

            const txt = this.add.text(x, GAME_HEIGHT - 172, '', {
                fontFamily: 'monospace', fontSize: '9px', color: '#445566',
                align: 'center', wordWrap: { width: 105 },
            }).setOrigin(0.5);
            this.queueTexts.push(txt);
        }

        this.queueCostText = this.add.text(GAME_WIDTH / 2 + 195, GAME_HEIGHT - 172, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#cc8833',
        }).setOrigin(0.5);
    }

    // ── HUD ───────────────────────────────────────────────────
    _buildHUD() {
        this.deckText = this.add.text(GAME_WIDTH - 50, GAME_HEIGHT - 50, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#2a3a4a',
        }).setOrigin(0.5);

        this.discardText = this.add.text(50, GAME_HEIGHT - 50, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#2a3a4a',
        }).setOrigin(0.5);

        this.turnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#1a1a33',
        }).setOrigin(0.5);

        // Tombol lihat deck
        const deckBtn = this.add.rectangle(GAME_WIDTH - 50, GAME_HEIGHT - 30, 80, 22, 0x0d0d1a)
            .setStrokeStyle(1, 0x1a2233)
            .setInteractive({ useHandCursor: true })
            .setDepth(5);
        const deckBtnTxt = this.add.text(GAME_WIDTH - 50, GAME_HEIGHT - 30, '📋 Deck', {
            fontFamily: 'monospace', fontSize: '10px', color: '#2a3a4a',
        }).setOrigin(0.5).setDepth(6);

        deckBtn.on('pointerover', () => { deckBtn.setFillStyle(0x111133); deckBtnTxt.setColor('#6677aa'); });
        deckBtn.on('pointerout',  () => { deckBtn.setFillStyle(0x0d0d1a); deckBtnTxt.setColor('#2a3a4a'); });
        deckBtn.on('pointerdown', () => this._openDeckViewer());
    }

    _openDeckViewer() {
        const allCards = [
            ...this.player.deck,
            ...this.player.hand,
            ...this.player.discard,
        ];
        DeckViewerOverlay.show(this, allCards, {
            canPurge:   false,
            canUpgrade: false,
        });
    }

    // ── Action Buttons ────────────────────────────────────────
    _buildActionButtons() {
        // ATTACK button
        const ax = GAME_WIDTH - 110, ay = GAME_HEIGHT - 135;
        const attackBg = this.add.rectangle(ax, ay, 200, 46, 0x0d0505)
            .setStrokeStyle(1, 0x441111)
            .setInteractive({ useHandCursor: true });
        this.attackTxt = this.add.text(ax, ay, '⚔  SERANG', {
            fontFamily: 'monospace', fontSize: '15px', color: '#331111',
        }).setOrigin(0.5);

        attackBg.on('pointerover', () => attackBg.setFillStyle(0x1a0808));
        attackBg.on('pointerout',  () => attackBg.setFillStyle(0x0d0505));
        attackBg.on('pointerdown', () => {
            if (this.combat.state === COMBAT_STATE.PLAYER_TURN) this._doAttack();
        });
        this.attackBg = attackBg;

        // END TURN button
        const ex = GAME_WIDTH - 110, ey = GAME_HEIGHT - 80;
        const endBg = this.add.rectangle(ex, ey, 200, 38, 0x0d0d1a)
            .setStrokeStyle(1, 0x1a2244)
            .setInteractive({ useHandCursor: true });
        const endTxt = this.add.text(ex, ey, 'END TURN  →', {
            fontFamily: 'monospace', fontSize: '13px', color: '#2a3a66',
        }).setOrigin(0.5);

        endBg.on('pointerover', () => { endBg.setFillStyle(0x111133); endTxt.setColor('#4466aa'); });
        endBg.on('pointerout',  () => { endBg.setFillStyle(0x0d0d1a); endTxt.setColor('#2a3a66'); });
        endBg.on('pointerdown', () => {
            if (this.combat.state === COMBAT_STATE.PLAYER_TURN) this._doEndTurn();
        });

        // CLEAR button
        const cx = GAME_WIDTH / 2 + 195, cy2 = GAME_HEIGHT - 140;
        const clearBg = this.add.rectangle(cx, cy2, 70, 24, 0x0d0d0d)
            .setStrokeStyle(1, 0x1a1122)
            .setInteractive({ useHandCursor: true });
        const clearTxt = this.add.text(cx, cy2, 'clear', {
            fontFamily: 'monospace', fontSize: '10px', color: '#2a1a33',
        }).setOrigin(0.5);

        clearBg.on('pointerover', () => clearTxt.setColor('#664477'));
        clearBg.on('pointerout',  () => clearTxt.setColor('#2a1a33'));
        clearBg.on('pointerdown', () => this._clearQueue());
    }

    // ── Tooltip ───────────────────────────────────────────────
    _buildTooltip() {
        this.tooltipBg = this.add.rectangle(0, 0, 230, 175, 0x080812)
            .setStrokeStyle(1, 0x223344)
            .setDepth(50)
            .setVisible(false);

        this.tooltipLines = [];
        for (let i = 0; i < 7; i++) {
            const t = this.add.text(0, 0, '', {
                fontFamily: 'monospace', fontSize: '10px', color: '#aabbcc',
                wordWrap: { width: 215 },
            }).setDepth(51).setVisible(false);
            this.tooltipLines.push(t);
        }
    }

    _showTooltip(card, cardX, cardY) {
        const tw = 230, th = 175;
        let tx = cardX + 55;
        let ty = cardY - th;
        if (tx + tw > GAME_WIDTH - 10) tx = cardX - tw - 10;
        if (ty < 10) ty = 10;

        this.tooltipBg.setPosition(tx + tw / 2, ty + th / 2).setSize(tw, th).setVisible(true);

        const dmgStr  = card.damage ? `Damage: ${card.damage}  (${card.damageType})` : '';
        const blkStr  = card.block  ? `Block: ${card.block}` : '';
        const effStr  = card.effects?.length
            ? card.effects.map(e => `${e.type} ${e.value} × ${e.duration}t`).join(', ')
            : '';
        const upStr   = card.upgradedId
            ? `Upgrade → ${card.upgradedId.replace(/_/g,' ')}`
            : card.isUpgraded ? '★ Upgraded' : '';

        const lines = [
            { text: card.name,             color: '#ffffff',  size: '13px', dy: 14  },
            { text: `${card.type}  |  Cost ${card.cost}`, color: '#cc8833', size: '10px', dy: 32 },
            { text: dmgStr || blkStr,      color: '#cc6644',  size: '11px', dy: 50  },
            { text: effStr,                color: '#6699aa',  size: '10px', dy: 68  },
            { text: card.description || '', color: '#778899', size: '10px', dy: 88  },
            { text: card.flavorText  || '', color: '#334455', size: '9px',  dy: 130 },
            { text: upStr,                 color: '#44aa55',  size: '10px', dy: 158 },
        ];

        lines.forEach((line, i) => {
            this.tooltipLines[i]
                .setText(line.text)
                .setColor(line.color)
                .setFontSize(line.size)
                .setPosition(tx + 10, ty + line.dy)
                .setVisible(!!line.text);
        });
    }

    _hideTooltip() {
        this.tooltipBg.setVisible(false);
        this.tooltipLines.forEach(t => t.setVisible(false));
    }

    // ── Card Rendering ────────────────────────────────────────
    _renderHand() {
        // Destroy kartu lama dengan aman
        if (this.cardObjects) {
            this.cardObjects.forEach(objs => {
                if (Array.isArray(objs)) objs.forEach(o => { try { o?.destroy(); } catch(e){} });
            });
        }
        this.cardObjects = [];

        const hand = this.player?.hand;
        if (!hand || hand.length === 0) return;

        // Hitung posisi berdasarkan jumlah kartu yang ada di hand sekarang
        const count    = hand.length;
        const maxWidth = GAME_WIDTH - 300;
        const spacing  = Math.min(108, maxWidth / Math.max(count, 1));
        const startX   = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2;
        const baseY    = GAME_HEIGHT - 68;

        hand.forEach((card, i) => {
            // Kartu yang ada di queue ditampilkan berbeda (redup/highlight)
            const inQueue = this.selectedQueue.some(q => q.card === card);
            const objs    = this._createCardObject(card, startX + i * spacing, baseY, i, inQueue);
            this.cardObjects.push(objs);
        });
    }

    _createCardObject(card, x, y, handIndex, inQueue = false) {
        const w = 92, h = 112;

        const typeColors = {
            attack:  0xcc4444,
            defense: 0x2244cc,
            magic:   0x8833cc,
            support: 0x33aa44,
        };
        const bColor  = typeColors[card.type] || 0x444466;
        const cardCost   = this.combat ? this.combat.getEffectiveCost(card) : (card.cost ?? 1);
        const affordable = !inQueue && (cardCost <= this.player.energy - this.queueEnergyCost);

        // Card BG
        const bg = this.add.rectangle(x, y, w, h,
            inQueue ? 0x1a1800 : affordable ? 0x111122 : 0x0a0a0f
        ).setStrokeStyle(
            inQueue ? 2 : affordable ? 1 : 1,
            inQueue ? 0xffcc44 : affordable ? bColor : 0x1a1a22
        );

        if (!inQueue && affordable) bg.setInteractive({ useHandCursor: true });

        // Cost
        const costCircle = this.add.circle(x - w/2 + 13, y - h/2 + 13, 11, 0x080810)
            .setStrokeStyle(1, bColor);
        const costTxt = this.add.text(x - w/2 + 13, y - h/2 + 13, `${cardCost}`, {
            fontFamily: 'monospace', fontSize: '12px',
            color: affordable || inQueue ? '#ffcc44' : '#332211', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Type label
        const typeTxt = this.add.text(x, y - h/2 + 10, card.type.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '7px',
            color: affordable || inQueue ? '#334466' : '#1a1a22', letterSpacing: 1,
        }).setOrigin(0.5);

        // Name
        const nameTxt = this.add.text(x, y + 5, card.name, {
            fontFamily: 'monospace', fontSize: '10px',
            color: inQueue ? '#ffcc44' : affordable ? '#ccddee' : '#222233',
            wordWrap: { width: w - 12 }, align: 'center',
        }).setOrigin(0.5);

        // Stat
        const statStr = card.damage ? `⚔ ${card.damage}` : card.block ? `🛡 ${card.block}` : '';
        const statTxt = this.add.text(x, y + 32, statStr, {
            fontFamily: 'monospace', fontSize: '11px',
            color: inQueue ? '#cc8833' : affordable ? '#445566' : '#1a1a22',
        }).setOrigin(0.5);

        const allObjs = [bg, costCircle, costTxt, typeTxt, nameTxt, statTxt];

        if (!inQueue && affordable) {
            let holdTimer = null;
            let isHovered = false;

            bg.on('pointerover', () => {
                isHovered = true;
                // Angkat kartu
                allObjs.forEach(o => { if (o?.active) o.y -= 18; });
                // Hold 600ms untuk tooltip
                holdTimer = this.time.delayedCall(600, () => {
                    if (isHovered) this._showTooltip(card, x, y - 18);
                });
                if (card.damage) {
                    const ring =
                        this.monsterTargetRings?.[
                            this.selectedTarget
                        ];

                    if (ring) {
                        this.tweens.add({
                            targets: ring,
                            scale: 1.18,
                            duration: 120,
                            yoyo: true,
                            repeat: 1,
                        });
                    }
                }
            });

            bg.on('pointerout', () => {
                isHovered = false;
                allObjs.forEach(o => { if (o?.active) o.y += 18; });
                if (holdTimer) holdTimer.remove();
                this._hideTooltip();
            });

            bg.on('pointerdown', () => {
                if (this.combat.state !== COMBAT_STATE.PLAYER_TURN) return;
                if (this.selectedQueue.length >= 3) return;
                if (holdTimer) holdTimer.remove();
                this._hideTooltip();
                // Turunkan kartu dulu sebelum re-render
                allObjs.forEach(o => { if (o?.active) o.y += 18; });
                this._addToQueue(card, handIndex);
            });
        }

        return allObjs;
    }

    // ── Queue ─────────────────────────────────────────────────
    _addToQueue(card, handIndex) {
        const cost =
            this.combat.getEffectiveCost(card);
        this.selectedQueue.push({
            card,
            handIndex,
        });
        this.queueEnergyCost += cost;
        this._refreshQueue();
        this._refreshUI();
        this._renderHand();
    }

    _clearQueue() {
        this.selectedQueue   = [];
        this.queueEnergyCost = 0;
        this._refreshQueue();
        this._refreshUI();
        this._renderHand();
    }

    _refreshQueue() {
        this.queueTexts.forEach((txt, i) => {
            const item = this.selectedQueue[i];
            txt.setText(item ? item.card.name : '');
            this.queueSlots[i]
                .setFillStyle(item ? 0x111a11 : 0x0d0d1a)
                .setStrokeStyle(1, item ? 0x334433 : 0x1a1a2e);
        });

        const hasQueue = this.selectedQueue.length > 0;
        this.queueCostText?.setText(hasQueue ? `⚡${this.queueEnergyCost}` : '');

        // Warnai tombol attack sesuai state
        this.attackBg?.setFillStyle(hasQueue ? 0x1a0808 : 0x0d0505);
        this.attackBg?.setStrokeStyle(1, hasQueue ? 0x882222 : 0x441111);
        this.attackTxt?.setColor(hasQueue ? '#cc4433' : '#331111');
    }

    // ── Actions ───────────────────────────────────────────────
    _doAttack() {
        if (this.selectedQueue.length === 0) return;
        if (this.combat.state !== COMBAT_STATE.PLAYER_TURN) return;

        // Auto-select target yang masih hidup
        if (this.monsters[this.selectedTarget]?.isDead) {
            const alive = this.monsters.findIndex(m => !m.isDead);
            if (alive !== -1) this._selectTarget(alive);
        }

        for (const { card } of this.selectedQueue) {
            const actualIdx = this.player.hand.indexOf(card);
            if (actualIdx === -1) continue;
            const result = this.combat.playCard(actualIdx, this.selectedTarget);
            if (!result.success) break;

            this._handleCombatEvents(result.events);

            // Auto-switch target kalau target mati
            if (this.monsters[this.selectedTarget]?.isDead) {
                const alive = this.monsters.findIndex(m => !m.isDead);
                if (alive !== -1) this._selectTarget(alive);
            }
        }

        this.selectedQueue   = [];
        this.queueEnergyCost = 0;

        this._refreshQueue();
        this._refreshUI();
        this._renderHand();

        if (this.combat.isOver) this._handleCombatEnd();
    }

    _handleCombatEvents(events) {
        if (!events || events.length === 0) return;

        for (const evt of events) {
            switch (evt.type) {

                case 'damage': {
                    const pos = this._getTargetPos(evt.target);
                    if (pos) {
                        DamageNumber.show(this, pos.x, pos.y - 40,
                            evt.amount, evt.damageType || 'physical');
                    }
                    // Kalau player yang kena, getarkan paper doll
                    if (evt.target === 'player' && this.paperDoll) {
                        this.paperDoll.playHitAnim();
                    }
                    break;
                }

                case 'heal': {
                    const px = this._getPlayerPos();
                    DamageNumber.show(this, px.x, px.y - 40, evt.amount, 'heal');
                    break;
                }

                case 'block': {
                    const px = this._getPlayerPos();
                    DamageNumber.show(this, px.x, px.y - 20, evt.amount, 'block');
                    break;
                }

                case 'dodge': {
                    const pos = evt.target === 'player'
                        ? this._getPlayerPos()
                        : this._getTargetPos(evt.target);
                    if (pos) DamageNumber.show(this, pos.x, pos.y - 40, 0, 'miss');
                    break;
                }

                case 'execute': {
                    const pos = this._getTargetPos(evt.target);
                    if (pos) DamageNumber.show(this, pos.x, pos.y - 40, 0, 'execute');
                    break;
                }

                case 'echo_triggered': {
                    const px = this._getPlayerPos();
                    DamageNumber.show(this, px.x, px.y - 60, 0, 'echo');
                    break;
                }

                case 'phase_change': {
                    if (evt.announcement) this._showPhaseAnnouncement(evt.announcement);
                    const pos = this._getTargetPos(evt.monsterId);
                    if (pos) DamageNumber.show(this, pos.x, pos.y - 40,
                        evt.phaseIndex || 2, 'phase');
                    break;
                }

                case 'apply_status': {
                    const pos = evt.target === 'player'
                        ? this._getPlayerPos()
                        : this._getTargetPos(evt.target);
                    if (pos) DamageNumber.showStatus(
                        this, pos.x, pos.y - 20, evt.status, evt.value);
                    break;
                }

                case 'energy_gain': {
                    const px = this._getPlayerPos();
                    DamageNumber.show(this, px.x + 40, px.y, evt.amount, 'block');
                    break;
                }
            }
        }
    }

    _getTargetPos(targetId) {
        if (!targetId) return null;
        if (targetId === 'player') return this._getPlayerPos();
        const idx = this.monsters.findIndex(m => m.id === targetId);
        if (idx === -1) return null;
        return this.nodePositions?.[idx] || null;
    }

    _getPlayerPos() {
        return { x: 160, y: this.cameras.main.height - 240 };
    }
    
    _showPhaseAnnouncement(text) {
        // Overlay gelap sebentar
        const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0
        ).setDepth(15);

        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
            fontFamily: 'monospace',
            fontSize:   '18px',
            color:      '#ff4444',
            fontStyle:  'bold',
            align:      'center',
            wordWrap:   { width: GAME_WIDTH - 100 },
            stroke:     '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(16).setAlpha(0);

        // Animasi muncul dan hilang
        this.tweens.add({
            targets:  [overlay, txt],
            alpha:    { from: 0, to: 1 },
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets:  [overlay, txt],
                        alpha:    0,
                        duration: 400,
                        onComplete: () => {
                            overlay.destroy();
                            txt.destroy();
                        },
                    });
                });
            },
        });
    }

    _doEndTurn() {
        if (this.combat.state !== COMBAT_STATE.PLAYER_TURN) return;
        this._clearQueue();
        const events = this.combat.endPlayerTurn();
        this._handleCombatEvents(events);
        this._refreshUI();
        this._renderHand();
        if (this.combat.isOver) this._handleCombatEnd();
    }

    // ── UI Refresh ────────────────────────────────────────────
    _refreshUI() {
        const p = this.player;
        if (!p) return;

        const hpPct = p.hp / p.stats[STAT.HP_MAX];
        this.playerHpBar?.setScale(Math.max(0, hpPct), 1);
        this.playerHpText?.setText(`${p.hp} / ${p.stats[STAT.HP_MAX]}`);
        this.playerBlockText?.setText(p.block > 0 ? `🛡 ${p.block}` : '');

        const remainEnergy = p.energy - this.queueEnergyCost;
        this.energyText?.setText(`⚡ ${remainEnergy} / ${ENERGY_PER_TURN}`);

        // Status effects player dengan icon
        const visibleStatuses = ['burn','poison','bleed','stun','freeze','chill','wet','dodge','fortify'];
        const statuses = (p.statusEffects || [])
            .filter(s => visibleStatuses.includes(s.type))
            .map(s => `${_statusIcon(s.type)}${s.value}(${s.duration}t)`)
            .join(' ');
        this.playerStatusText?.setText(statuses);

        this.deckText?.setText(`📚 ${p.deck.length}`);
        this.discardText?.setText(`🗑 ${p.discard.length}`);
        this.turnText?.setText(
            this.combat.state === COMBAT_STATE.PLAYER_TURN
                ? `Turn ${this.combat.turn}  —  pilih kartu → SERANG, atau END TURN`
                : '— Giliran Musuh —'
        );

        this.monsters.forEach((monster, i) => {
            if (!this.monsterHpBars[i]) return;
            if (monster.isDead) {
                this.monsterSprites[i]?.setAlpha(0.15);
                this.monsterHpBars[i]?.setScale(0, 1);
                this.monsterHpTexts[i]?.setText('');
                this.monsterIntentIcons[i]?.setText('');
                this.monsterIntentLabels[i]?.setText('');
                this.monsterStatusTexts?.[i]?.setText('');
                this.monsterTargetRings?.[i]?.setStrokeStyle(0, 0x000000);
                return;
            }
            const hpPct = monster.hp / monster.maxHP;
            this.monsterHpBars[i].setScale(Math.max(0, hpPct), 1);
            this.monsterHpTexts[i].setText(`${monster.hp}/${monster.maxHP}`);

            const intentData = monster.currentIntent;
            const icons = { attack:'⚔️', attack_strong:'💥', defend:'🛡️', buff:'✨', stunned:'💫' };
            this.monsterIntentIcons[i].setText(icons[intentData?.intent] || '❓');
            this.monsterIntentLabels[i].setText(
                intentData?.damage ? `${intentData.damage} dmg` : intentData?.intent || ''
            );

            // Status effect icons di monster
            if (this.monsterStatusTexts?.[i]) {
                const statusStr = (monster.statusEffects || [])
                    .map(s => `${_statusIcon(s.type)}${s.value}(${s.duration}t)`)
                    .join(' ');
                this.monsterStatusTexts[i].setText(statusStr);
            }
        });
    }
    
    // ── Menu Button & Pause Menu ──────────────────────────────
    _buildMenuButton() {
        const bg = this.add.rectangle(GAME_WIDTH - 50, 28, 70, 26, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true })
            .setDepth(5);

        this.add.text(GAME_WIDTH - 50, 28, '☰ Menu', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5).setDepth(6);

        bg.on('pointerover', () => bg.setFillStyle(0x1a1a2e));
        bg.on('pointerout',  () => bg.setFillStyle(0x0d0d1a));
        bg.on('pointerdown', () => {
            if (this._pauseOpen) this._closePauseMenu();
            else this._openPauseMenu();
        });
    }

    _openPauseMenu() {
        if (this._pauseOpen || this.combat?.isOver) return;
        this._pauseOpen    = true;
        this._pauseObjects = [];

        // Disable combat input
        this.input.enabled = false;

        const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75
        ).setDepth(30).setInteractive();
        this._pauseObjects.push(overlay);

        const panel = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 300, 0x0d0e18
        ).setStrokeStyle(1, 0x223344).setDepth(31);
        this._pauseObjects.push(panel);

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, 'PAUSED', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(32);
        this._pauseObjects.push(title);

        const items = [
            {
                label:  '▶  Lanjutkan',
                action: () => this._closePauseMenu(),
            },
            {
                label:  '💾  Simpan & Keluar',
                action: () => {
                    // Simpan posisi sebelum node ini (currentNodeId sebelum masuk combat)
                    const { SaveSystem } = { SaveSystem: null };
                    import('../storage/SaveSystem.js').then(({ SaveSystem }) => {
                        SaveSystem.manualSave({
                            zone:          this.zone,
                            floor:         this.floor,
                            curseLevel:    this.curseLevel,
                            playerData:    this.player.toJSON(),
                            mapData:       this.mapData,
                            currentNodeId: 'start',  // kembali ke awal lantai saat resume
                        });
                        GameGuard.deactivate();
                        this.scene.start(SCENE.MAIN_MENU);
                    });
                },
            },
            {
                label:  '🔄  Mulai Ulang',
                action: () => {
                    import('../storage/SaveSystem.js').then(({ SaveSystem }) => {
                        SaveSystem.clearRun();
                        GameGuard.deactivate();
                        this.scene.start(SCENE.MAIN_MENU);
                    });
                },
            },
        ];

        items.forEach((item, i) => {
            const y  = GAME_HEIGHT / 2 - 50 + i * 65;
            const bg = this.add.rectangle(GAME_WIDTH / 2, y, 280, 48, 0x111122)
                .setStrokeStyle(1, 0x223344)
                .setInteractive({ useHandCursor: true })
                .setDepth(32);
            const t = this.add.text(GAME_WIDTH / 2, y, item.label, {
                fontFamily: 'monospace', fontSize: '15px', color: '#778899',
            }).setOrigin(0.5).setDepth(33);

            bg.on('pointerover', () => { bg.setFillStyle(0x1a1a33); t.setColor('#aabbcc'); });
            bg.on('pointerout',  () => { bg.setFillStyle(0x111122); t.setColor('#778899'); });
            bg.on('pointerdown', () => item.action());

            this._pauseObjects.push(bg, t);
        });
    }

    _closePauseMenu() {
        if (!this._pauseOpen) return;
        this._pauseOpen = false;

        if (this._pauseObjects) {
            this._pauseObjects.forEach(o => { try { o.destroy(); } catch(e){} });
            this._pauseObjects = [];
        }

        // Re-enable combat input
        if (!this.combat?.isOver) {
            this.input.enabled = true;
        }
    }

    // ── Combat End ────────────────────────────────────────────
    _handleCombatEnd() {
        this.input.enabled = false;
        this._hideTooltip();

        if (this.combat.playerWon) {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '✦ MENANG ✦', {
                fontFamily: 'monospace', fontSize: '36px', color: '#ffcc44',
            }).setOrigin(0.5).setDepth(10);

            this.time.delayedCall(1200, () => {
                if (this.mapData) {
                    const loot = LootSystem.generate({
                        floor:      this.floor,
                        zone:       this.zone,
                        curseLevel: this.curseLevel,
                        isBoss:     this.isBoss,
                        isElite:    this.isElite,
                        monsters:   this.monsters,
                        playerDeck: [
                            ...this.player.deck,
                            ...this.player.hand,
                            ...this.player.discard,
                        ],
                    });
                    this.scene.start(SCENE.REWARD, {
                        zone: this.zone, floor: this.floor,
                        curseLevel: this.curseLevel,
                        playerData: this.player.toJSON(),
                        mapData: this.mapData,
                        currentNodeId: this.currentNodeId,
                        loot,
                    });
                } else {
                    this.scene.start(SCENE.MAIN_MENU);
                }
            });

                } else {
                    // Play death anim paper doll dulu
                    if (this.paperDoll) {
                        this.paperDoll.playDeathAnim();
                    }
                
                    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '✦ GAME OVER ✦', {
                        fontFamily: 'monospace', fontSize: '36px', color: '#cc3333',
                    }).setOrigin(0.5).setDepth(10);
                
                    this.time.delayedCall(1500, () => {
                        this.scene.start(SCENE.GAME_OVER, { floor: this.floor });
                    });
                }
            }
        }

// ── Helper di luar class ──────────────────────────────────────
function _statusIcon(type) {
    const icons = {
        burn:    '🔥',
        poison:  '☠',
        bleed:   '🩸',
        stun:    '⚡',
        freeze:  '❄',
        chill:   '❄',
        wet:     '💧',
        dodge:   '💨',
        fortify: '🏰',
    };
    return icons[type] || '●';
}
