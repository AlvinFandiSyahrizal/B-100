// ============================================================
// NodeMapScene.js — layar peta node per lantai
// Phase 4 Step 1 Polish:
//   - Tombol Equipment, Companion, Pet di header
//   - Fix maxHp display (pakai playerData.maxHp)
//   - Stat ringkas player (STR/INT/AGI/DEF)
//   - Fix DeckViewer dipanggil dua kali
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, NODE_TYPE } from '../config/constants.js';
import { NodeMapGenerator }  from '../systems/NodeMapGenerator.js';
import { SaveSystem }        from '../storage/SaveSystem.js';
import { GameGuard }         from '../utils/GameGuard.js';
import { DeckViewerOverlay } from '../ui/DeckViewerOverlay.js';
import { EquipmentPanel }    from '../ui/EquipmentPanel.js';
import { CompanionPanel }    from '../ui/CompanionPanel.js';
import { PetPanel }          from '../ui/PetPanel.js';

const MAP_START_X = 100;
const MAP_END_X   = GAME_WIDTH - 100;
const MAP_START_Y = 110;
const MAP_END_Y   = GAME_HEIGHT - 80;

const NODE_ICONS = {
    [NODE_TYPE.START]:    '⛩',
    [NODE_TYPE.COMBAT]:   '⚔️',
    [NODE_TYPE.ELITE]:    '💀',
    [NODE_TYPE.SHOP]:     '🏪',
    [NODE_TYPE.REST]:     '😴',
    [NODE_TYPE.EVENT]:    '❓',
    [NODE_TYPE.TREASURE]: '💎',
    [NODE_TYPE.SHRINE]:   '🔱',
    [NODE_TYPE.BOSS]:     '👹',
};

const NODE_COLORS = {
    [NODE_TYPE.START]:    0x4488cc,
    [NODE_TYPE.COMBAT]:   0xcc4444,
    [NODE_TYPE.ELITE]:    0xaa2222,
    [NODE_TYPE.SHOP]:     0x44aacc,
    [NODE_TYPE.REST]:     0x44cc88,
    [NODE_TYPE.EVENT]:    0xccaa44,
    [NODE_TYPE.TREASURE]: 0xcccc44,
    [NODE_TYPE.SHRINE]:   0xaa44cc,
    [NODE_TYPE.BOSS]:     0xff4400,
};

export class NodeMapScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.NODE_MAP });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';
        this.isBossFloor   = (this.floor % 10 === 0);

        if (data.mapData && data.mapData.floor === this.floor) {
            this.mapData = data.mapData;
        } else {
            this.mapData = NodeMapGenerator.generate(this.floor, this.zone, this.isBossFloor);
        }

        this.visitedNodes = data.visitedNodes || ['start'];
        this.pathHistory  = data.pathHistory  || [];
        this.selectedPath = data.selectedPath || ['start'];

        this._pauseOpen = false;
    }

    create() {
        GameGuard.activate();
        this._buildBackground();
        this._buildFloorInfo();
        this._buildMap();
        this._buildLegend();
        this._buildTopButtons();
        this._buildCursePreview();

        this.input.keyboard.on('keydown-ESC', () => {
            if (this._pauseOpen) this._closePauseMenu();
            else this._openPauseMenu();
        });

        if (this.currentNodeId === 'start') {
            this._showFloorEntryNotif();
        }
    }

    // ── Background ────────────────────────────────────────────
    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080810);

        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        const glow = this.add.graphics();
        glow.fillStyle(0x3b1f52, 0.12);
        glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260);

        const fog = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 35, GAME_WIDTH, 120, 0x241633, 0.18);
        this.tweens.add({ targets: fog, alpha: 0.28, duration: 2600, yoyo: true, repeat: -1 });
    }

    // ── Floor Info Header ─────────────────────────────────────
    _buildFloorInfo() {
        const zoneNames = [
            '', 'Hutan Kappa', 'Hutan Tengu', 'Laut Umi-bozu',
            'Gunung Kasha', 'Lembah Kutukan', 'Medan Perang Oni',
            'Kota Mimikri', 'Langit Raijin', 'Kuil Kuno', 'Puncak Para Dewa',
        ];

        const floorInZone = ((this.floor - 1) % 10) + 1;
        const label = this.isBossFloor
            ? `B${this.floor}  —  BOSS BESAR  —  ${zoneNames[this.zone] || ''}`
            : `B${this.floor}  —  Zona ${this.zone}  —  ${zoneNames[this.zone] || ''}  (Lantai ${floorInZone}/9)`;

        this.add.text(GAME_WIDTH / 2, 28, label, {
            fontFamily: 'monospace', fontSize: '13px',
            color: this.isBossFloor ? '#cc4433' : '#cc8833',
            letterSpacing: 2,
        }).setOrigin(0.5);

        // ── FIX: pakai maxHp dari playerData.maxHp ───────────
        if (this.playerData) {
            const hp    = Number(this.playerData.hp   ?? 0);
            const hpMax = this._getPlayerMaxHp();         // fix di sini
            const gold  = Number(this.playerData.gold ?? 0);

            this.add.rectangle(GAME_WIDTH / 2, 28, 220, 28, 0x101425, 0.95)
                .setStrokeStyle(1, 0x2a3146);

            this.add.text(GAME_WIDTH / 2, 28, `❤ ${hp}/${hpMax}   💰 ${gold}`, {
                fontFamily: 'monospace', fontSize: '11px', color: '#dce6ff',
            }).setOrigin(0.5);

            // Stat ringkas di bawah HP bar
            const stats    = this.playerData.stats || {};
            const base     = this.playerData.baseStats || {};
            const str      = stats.str  ?? base.str  ?? 10;
            const intStat  = stats.int  ?? base.int  ?? 8;
            const agi      = stats.agi  ?? base.agi  ?? 9;
            const def      = stats.def  ?? 0;

            this.add.text(GAME_WIDTH / 2, 44,
                `STR ${str}  INT ${intStat}  AGI ${agi}  DEF ${def}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#445566',
            }).setOrigin(0.5);
        }

        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, 56); g.lineTo(GAME_WIDTH - 60, 56);
        g.strokePath();
    }

    // ── Top Buttons ───────────────────────────────────────────
    // Kiri: Deck | Equipment | Companion | Pet
    // Kanan: Menu
    _buildTopButtons() {
        const btnH   = 26;
        const btnY   = 28;

        // ── Menu (kanan atas) ─────────────────────────────────
        const menuBg = this.add.rectangle(GAME_WIDTH - 45, btnY, 70, btnH, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const menuTxt = this.add.text(GAME_WIDTH - 45, btnY, '☰ Menu', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);

        menuBg.on('pointerover', () => { menuBg.setFillStyle(0x1a1a2e); menuTxt.setColor('#6677aa'); });
        menuBg.on('pointerout',  () => { menuBg.setFillStyle(0x0d0d1a); menuTxt.setColor('#334455'); });
        menuBg.on('pointerdown', () => {
            if (this._pauseOpen) this._closePauseMenu();
            else this._openPauseMenu();
        });

        // ── Tombol kiri — definisi ────────────────────────────
        const leftBtns = [
            {
                label:  '📋 Deck',
                color:  '#336633',
                bg:     0x0d1a0d,
                border: 0x1a3322,
                hover:  { bg: 0x0d2a0d, txt: '#44cc44' },
                action: () => this._openDeckViewer(),
            },
            {
                label:  '⚔ Equip',
                color:  '#445566',
                bg:     0x0d0d1a,
                border: 0x1a2233,
                hover:  { bg: 0x111133, txt: '#88aabb' },
                action: () => this._openEquipmentPanel(),
            },
            {
                label:  '👥 Party',
                color:  '#446644',
                bg:     0x0d1a0d,
                border: 0x1a3322,
                hover:  { bg: 0x112211, txt: '#66cc88' },
                action: () => this._openCompanionPanel(),
            },
            {
                label:  '🐾 Pet',
                color:  '#664433',
                bg:     0x1a0d0d,
                border: 0x332211,
                hover:  { bg: 0x221108, txt: '#cc8844' },
                action: () => this._openPetPanel(),
            },
        ];

        const btnW   = 88;
        const startX = 48;
        const gap    = 6;

        leftBtns.forEach((def, i) => {
            const x  = startX + i * (btnW + gap) + btnW / 2;
            const bg = this.add.rectangle(x, btnY, btnW, btnH, def.bg)
                .setStrokeStyle(1, def.border)
                .setInteractive({ useHandCursor: true });
            const txt = this.add.text(x, btnY, def.label, {
                fontFamily: 'monospace', fontSize: '11px', color: def.color,
            }).setOrigin(0.5);

            bg.on('pointerover', () => { bg.setFillStyle(def.hover.bg); txt.setColor(def.hover.txt); });
            bg.on('pointerout',  () => { bg.setFillStyle(def.bg);       txt.setColor(def.color); });
            bg.on('pointerdown', () => def.action());
        });
    }

    // ── Panel Openers ─────────────────────────────────────────

    _openDeckViewer() {
        const allCards = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
            ...(this.playerData?.hand    || []),
        ];
        // FIX: hapus duplikat pemanggilan DeckViewerOverlay
        if (allCards.length === 0) return;
        DeckViewerOverlay.show(this, allCards, { canPurge: false, canUpgrade: false });
    }

    _openEquipmentPanel() {
        if (this._panelOpen) return;
        this._panelOpen = true;

        EquipmentPanel.show(this, this.playerData, {
            canUnequip: true,
            onClose: (updated) => {
                this.playerData = updated;
                this._panelOpen = false;
            },
            onChange: (updated) => {
                this.playerData = updated;
            },
        });
    }

    _openCompanionPanel() {
        if (this._panelOpen) return;
        this._panelOpen = true;

        CompanionPanel.show(this, this.playerData, {
            canSwap: false,
            onClose: (updated) => {
                this.playerData = updated;
                this._panelOpen = false;
            },
            onChange: (updated) => {
                this.playerData = updated;
            },
        });
    }

    _openPetPanel() {
        if (this._panelOpen) return;
        this._panelOpen = true;

        PetPanel.show(this, this.playerData, {
            canSwap:   true,
            ownedPets: this.playerData?.ownedPets || [],
            onClose: (updated) => {
                this.playerData = updated;
                this._panelOpen = false;
            },
            onChange: (updated) => {
                this.playerData = updated;
            },
        });
    }

    // ── Map ───────────────────────────────────────────────────
    _buildMap() {
        const { nodes, edges } = this.mapData;
        this.nodePositions = this._calculatePositions(nodes);
        this._drawEdges(edges, nodes);
        this._drawNodes(nodes);
    }

    _calculatePositions(nodes) {
        const positions = {};
        const maxCol    = Math.max(...nodes.map(n => n.col));
        const allRows   = [...new Set(nodes.map(n => n.row))].sort();
        const rowCount  = allRows.length;
        const totalH    = MAP_END_Y - MAP_START_Y;

        for (const node of nodes) {
            const x        = MAP_START_X + (node.col / Math.max(maxCol, 1)) * (MAP_END_X - MAP_START_X);
            const rowIndex = allRows.indexOf(node.row);
            const y        = MAP_START_Y + ((rowIndex + 1) / (rowCount + 1)) * totalH
                           + Phaser.Math.Between(-18, 18);
            positions[node.id] = { x, y };
        }

        return positions;
    }

    _drawEdges(edges) {
        const g = this.add.graphics();
        for (const edge of edges) {
            const from = this.nodePositions[edge.from];
            const to   = this.nodePositions[edge.to];
            if (!from || !to) continue;

            const wasTaken    = this.pathHistory.some(p => p.from === edge.from && p.to === edge.to);
            const fromCurrent = edge.from === this.currentNodeId;

            let width = 1, color = 0x1a1a2e, alpha = 0.35;
            if (wasTaken)      { width = 4; color = 0x8bb8ff; alpha = 1;    }
            else if (fromCurrent) { width = 2; color = 0x405070; alpha = 0.75; }

            g.lineStyle(width, color, alpha);
            g.beginPath();
            g.moveTo(from.x, from.y);
            g.lineTo(to.x, to.y);
            g.strokePath();
        }
    }

    _drawNodes(nodes) {
        const availableIds = this._getAvailableNodeIds();
        for (const node of nodes) {
            const pos = this.nodePositions[node.id];
            if (!pos) continue;
            this._drawOneNode(
                node, pos,
                node.id === this.currentNodeId,
                availableIds.includes(node.id),
                node.cleared
            );
        }
    }

    _drawOneNode(node, pos, isActive, isAvailable, isCleared) {
        const isMini  = node.isMini;
        const isBoss  = node.type === NODE_TYPE.BOSS;
        const radius  = isBoss ? 30 : isMini ? 26 : 22;
        const color   = NODE_COLORS[node.type] || 0x444466;
        const icon    = isMini ? '⚡' : (NODE_ICONS[node.type] || '?');

        const strokeColor = isActive    ? 0xffcc44
                          : isAvailable ? color
                          : isCleared   ? 0x223333
                          : 0x1a1a2e;

        if (isBoss) {
            this.cameras.main.shake(150, 0.002);
            for (let i = 0; i < 8; i++) {
                const ember = this.add.circle(pos.x, pos.y, 2, 0xff8b42, 0.8);
                this.tweens.add({
                    targets: ember,
                    x: pos.x + Phaser.Math.Between(-28, 28),
                    y: pos.y - Phaser.Math.Between(15, 40),
                    alpha: 0,
                    duration: Phaser.Math.Between(900, 1500),
                    repeat: -1,
                });
            }
        }

        if (isAvailable) {
            const glow = this.add.circle(pos.x, pos.y, radius + 18, color, 0.22);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.08, to: 0.35 },
                scale: { from: 1, to: 1.12 },
                duration: 1000, yoyo: true, repeat: -1,
            });
        }

        if (isActive) {
            const ring = this.add.circle(pos.x, pos.y, radius + 10, color, 0)
                .setStrokeStyle(2, 0xffcc44, 0.7);
            this.tweens.add({ targets: ring, scale: 1.15, alpha: 0, duration: 1000, repeat: -1 });
        }

        const circle = this.add.circle(pos.x, pos.y, radius, 0x111122, 0.95)
            .setStrokeStyle(isActive ? 3 : isAvailable ? 2 : 1, strokeColor);

        if (isActive) {
            circle.setFillStyle(0x1b2138, 1);
            this.tweens.add({ targets: circle, scale: 1.10, duration: 650, yoyo: true, repeat: -1 });
        }

        this.add.text(pos.x, pos.y - 4, icon, {
            fontFamily: 'monospace',
            fontSize: isBoss ? '22px' : '16px',
            color: isCleared && !isActive ? '#222233' : '#ffffff',
        }).setOrigin(0.5);

        const typeLabel = isMini ? 'Mini Boss' : isBoss ? 'BOSS' : node.type;
        this.add.text(pos.x, pos.y + radius + 8, typeLabel, {
            fontFamily: 'monospace', fontSize: '9px',
            color: isAvailable ? '#556677' : '#222233',
        }).setOrigin(0.5);

        if (isAvailable) {
            circle.setInteractive({ useHandCursor: true });

            circle.on('pointerover', () => {
                circle.setScale(1.15);
                this.tweens.add({ targets: circle, y: pos.y - 4, duration: 120 });
                this._showNodeTooltip(node, pos);
                const aura = this.add.circle(pos.x, pos.y, radius + 22, color, 0.18);
                this.tweens.add({ targets: aura, scale: 1.2, alpha: 0, duration: 450 });
            });

            circle.on('pointerout', () => {
                circle.setScale(1);
                this.tweens.add({ targets: circle, y: pos.y, duration: 120 });
                this._hideNodeTooltip();
            });

            circle.on('pointerdown', () => this._enterNode(node));
        }
    }

    // ── Curse Preview ─────────────────────────────────────────
    _buildCursePreview() {
        const box = this.add.rectangle(GAME_WIDTH - 95, GAME_HEIGHT - 48, 170, 54, 0x120b18, 0.95)
            .setStrokeStyle(1, 0x7a3cff);
        const title = this.add.text(GAME_WIDTH - 95, GAME_HEIGHT - 60, `☠ Curse ${this.curseLevel}`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#dcb7ff',
        }).setOrigin(0.5);
        this.add.text(GAME_WIDTH - 95, GAME_HEIGHT - 38, '+Enemy dmg / +Rare drop', {
            fontFamily: 'monospace', fontSize: '9px', color: '#9fa6d9',
        }).setOrigin(0.5);

        this.tweens.add({ targets: [box, title], alpha: { from: 0.85, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
    }

    // ── Tooltip ───────────────────────────────────────────────
    _showNodeTooltip(node, pos) {
        this._hideNodeTooltip();
        const labels = {
            [NODE_TYPE.COMBAT]:   'Pertarungan biasa melawan yokai',
            [NODE_TYPE.ELITE]:    'Elite — lebih kuat, loot lebih baik',
            [NODE_TYPE.SHOP]:     'Merchant — beli/jual kartu & item',
            [NODE_TYPE.REST]:     'Rest Site — heal HP atau upgrade kartu',
            [NODE_TYPE.EVENT]:    'Random Event — untung atau buntung',
            [NODE_TYPE.TREASURE]: 'Treasure Room — dapat item gratis',
            [NODE_TYPE.BOSS]:     'BOSS BESAR — penguasa zona ini',
            [NODE_TYPE.SHRINE]:   'Shrine — bayar HP/gold untuk buff',
        };
        const label = node.isMini ? 'Mini Boss — penjaga lantai ini' : (labels[node.type] || '');
        const tx    = Math.min(pos.x + 30, GAME_WIDTH - 200);
        const ty    = Math.max(pos.y - 40, 65);

        this._tooltip = this.add.text(tx, ty, label, {
            fontFamily: 'monospace', fontSize: '11px', color: '#aabbcc',
            backgroundColor: '#0d0d1a', padding: { x: 8, y: 5 },
        }).setDepth(10);
    }

    _hideNodeTooltip() {
        if (this._tooltip) { this._tooltip.destroy(); this._tooltip = null; }
    }

    // ── Legend ────────────────────────────────────────────────
    _buildLegend() {
        const items = [
            { type: NODE_TYPE.COMBAT,   label: 'Combat'   },
            { type: NODE_TYPE.ELITE,    label: 'Elite'    },
            { type: NODE_TYPE.SHOP,     label: 'Shop'     },
            { type: NODE_TYPE.REST,     label: 'Rest'     },
            { type: NODE_TYPE.EVENT,    label: 'Event'    },
            { type: NODE_TYPE.TREASURE, label: 'Treasure' },
            { type: NODE_TYPE.SHRINE,   label: 'Shrine'   },
        ];

        let lx = 80;
        for (const item of items) {
            this.add.circle(lx, GAME_HEIGHT - 22, 6, NODE_COLORS[item.type]);
            this.add.text(lx + 10, GAME_HEIGHT - 22, item.label, {
                fontFamily: 'monospace', fontSize: '10px', color: '#334455',
            }).setOrigin(0, 0.5);
            lx += 90;
        }

        this.add.circle(lx, GAME_HEIGHT - 22, 6, 0xcc8833);
        this.add.text(lx + 10, GAME_HEIGHT - 22, 'Mini Boss', {
            fontFamily: 'monospace', fontSize: '10px', color: '#334455',
        }).setOrigin(0, 0.5);
    }

    // ── Pause Menu ────────────────────────────────────────────
    _openPauseMenu() {
        if (this._pauseOpen) return;
        this._pauseOpen    = true;
        this._pauseObjects = [];

        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
            .setDepth(20).setInteractive();
        this._pauseObjects.push(overlay);

        const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 300, 0x0d0e18)
            .setStrokeStyle(1, 0x223344).setDepth(21);
        this._pauseObjects.push(panel);

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, 'PAUSED', {
            fontFamily: 'monospace', fontSize: '22px', color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(22);
        this._pauseObjects.push(title);

        const menuItems = [
            { label: '▶  Lanjutkan',       action: () => this._closePauseMenu() },
            {
                label: '💾  Simpan & Keluar',
                action: () => {
                    SaveSystem.manualSave({
                        zone: this.zone, floor: this.floor,
                        curseLevel: this.curseLevel,
                        playerData: this.playerData,
                        mapData: this.mapData,
                        currentNodeId: this.currentNodeId,
                    });
                    GameGuard.deactivate();
                    this.scene.start(SCENE.MAIN_MENU);
                },
            },
            {
                label: '🔄  Mulai Ulang',
                action: () => {
                    GameGuard.deactivate();
                    SaveSystem.clearRun();
                    this.scene.start(SCENE.MAIN_MENU);
                },
            },
        ];

        menuItems.forEach((item, i) => {
            const y  = GAME_HEIGHT / 2 - 50 + i * 65;
            const bg = this.add.rectangle(GAME_WIDTH / 2, y, 280, 48, 0x111122)
                .setStrokeStyle(1, 0x223344)
                .setInteractive({ useHandCursor: true }).setDepth(22);
            const t = this.add.text(GAME_WIDTH / 2, y, item.label, {
                fontFamily: 'monospace', fontSize: '15px', color: '#778899',
            }).setOrigin(0.5).setDepth(23);

            bg.on('pointerover', () => { bg.setFillStyle(0x1a1a33); t.setColor('#aabbcc'); });
            bg.on('pointerout',  () => { bg.setFillStyle(0x111122); t.setColor('#778899'); });
            bg.on('pointerdown', () => item.action());
            this._pauseObjects.push(bg, t);
        });
    }

    _closePauseMenu() {
        if (!this._pauseOpen) return;
        this._pauseOpen = false;
        this._pauseObjects?.forEach(o => { try { o.destroy(); } catch(e){} });
        this._pauseObjects = [];
    }

    // ── Floor Entry Notif ─────────────────────────────────────
    _showFloorEntryNotif() {
        const label = this.isBossFloor ? `⚠ BOSS — B${this.floor}` : `B${this.floor}`;

        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, label, {
            fontFamily: 'monospace', fontSize: '44px', fontStyle: 'bold',
            color: this.isBossFloor ? '#cc4433' : '#cc8833',
        }).setOrigin(0.5).setDepth(20).setAlpha(0);

        const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 42,
            this.isBossFloor ? 'Yokai Presence Detected' : 'Choose your next path', {
                fontFamily: 'monospace', fontSize: '12px', color: '#9fb3d9',
            }).setOrigin(0.5).setDepth(20).setAlpha(0);

        this.tweens.add({
            targets: [txt, sub],
            alpha: { from: 0, to: 1 },
            y: { from: GAME_HEIGHT / 2 + 20, to: GAME_HEIGHT / 2 },
            duration: 350,
            onComplete: () => {
                this.time.delayedCall(900, () => {
                    this.tweens.add({
                        targets: [txt, sub], alpha: 0, duration: 350,
                        onComplete: () => { txt.destroy(); sub.destroy(); },
                    });
                });
            },
        });

        if (this.isBossFloor) this.cameras.main.shake(300, 0.003);
    }

    // ── Navigation ────────────────────────────────────────────
    _enterNode(node) {
        const prevNode = this.mapData.nodes.find(n => n.id === this.currentNodeId);
        if (prevNode) prevNode.cleared = true;

        this.currentNodeId = node.id;

        if (!this.visitedNodes.includes(node.id)) this.visitedNodes.push(node.id);
        this.pathHistory.push({ from: this.currentNodeId, to: node.id });
        this.selectedPath.push(node.id);

        SaveSystem.checkpointSave({
            zone: this.zone, floor: this.floor,
            curseLevel: this.curseLevel,
            playerData: this.playerData,
            mapData: this.mapData,
            currentNodeId: this.currentNodeId,
            visitedNodes: this.visitedNodes,
            selectedPath: this.selectedPath,
            pathHistory: this.pathHistory,
        });

        const sceneData = {
            zone: this.zone, floor: this.floor,
            curseLevel: this.curseLevel,
            playerData: this.playerData,
            mapData: this.mapData,
            currentNodeId: this.currentNodeId,
            visitedNodes: this.visitedNodes,
            selectedPath: this.selectedPath,
            pathHistory: this.pathHistory,
        };

        switch (node.type) {
            case NODE_TYPE.COMBAT:
                this.scene.start(SCENE.COMBAT, { ...sceneData, isBoss: false, isElite: false });
                break;
            case NODE_TYPE.ELITE:
                this.scene.start(SCENE.COMBAT, { ...sceneData, isBoss: false, isElite: true, isMini: node.isMini || false });
                break;
            case NODE_TYPE.SHOP:
                this.scene.start(SCENE.SHOP, sceneData);
                break;
            case NODE_TYPE.REST:
                this.scene.start(SCENE.REST, sceneData);
                break;
            case NODE_TYPE.EVENT:
                this.scene.start(SCENE.EVENT, sceneData);
                break;
            case NODE_TYPE.SHRINE:
                this.scene.start(SCENE.SHRINE, sceneData);
                break;
            case NODE_TYPE.TREASURE:
                this.scene.start(SCENE.REWARD, { ...sceneData, isTreasure: true });
                break;
            case NODE_TYPE.BOSS:
                this.scene.start(SCENE.BOSS_INTRO, { ...sceneData, isBoss: true });
                break;
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    // FIX: prioritas playerData.maxHp (dari toJSON yang sudah difix)
    _getPlayerMaxHp() {
        return Number(
            this.playerData?.maxHp              ??
            this.playerData?.stats?.hp_max      ??
            this.playerData?.baseStats?.hp_max  ??
            100
        );
    }

    _getAvailableNodeIds() {
        return this.mapData.edges
            .filter(e => e.from === this.currentNodeId)
            .map(e => e.to);
    }
}