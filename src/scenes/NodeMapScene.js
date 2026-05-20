// ============================================================
// NodeMapScene.js — layar peta node per lantai
// Tiap lantai punya map kecil sendiri: 3-5 node + mini boss
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, NODE_TYPE } from '../config/constants.js';
import { NodeMapGenerator } from '../systems/NodeMapGenerator.js';
import { SaveSystem }       from '../storage/SaveSystem.js';
import { GameGuard }        from '../utils/GameGuard.js';
import { DeckViewerOverlay } from '../ui/DeckViewerOverlay.js';

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
        this.zone        = data.zone        || 1;
        this.floor       = data.floor       || 1;
        this.curseLevel  = data.curseLevel  || 1;
        this.playerData  = data.playerData  || null;

        // Tentukan apakah lantai ini adalah boss besar
        this.isBossFloor = (this.floor % 10 === 0);

        // Generate map baru kalau tidak ada atau reset
        if (data.mapData && data.mapData.floor === this.floor) {
            this.mapData = data.mapData;
        } else {
            this.mapData = NodeMapGenerator.generate(this.floor, this.zone, this.isBossFloor);
        }

        this.currentNodeId = data.currentNodeId || 'start';
    }

    create() {
        // Aktifkan proteksi refresh selama game berjalan
        GameGuard.activate();

        this._buildBackground();
        this._buildFloorInfo();
        this._buildMap();
        this._buildLegend();
        this._buildMenuButton();
        this._pauseOpen = false;

        // ESC toggle pause menu — pakai update loop bukan event listener
        this.input.keyboard.on('keydown-ESC', () => {
            if (this._pauseOpen) {
                this._closePauseMenu();
            } else {
                this._openPauseMenu();
            }
        });

        if (this.currentNodeId === 'start') {
            this._showFloorEntryNotif();
        }
    }

    // ── Background ────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x080810
        );
        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();
    }

    // ── Floor Info Header ─────────────────────────────────────

    _buildFloorInfo() {
        const zone  = this.zone;
        const floor = this.floor;

        const zoneNames = [
            '', 'Hutan Kappa', 'Hutan Tengu', 'Laut Umi-bozu',
            'Gunung Kasha', 'Lembah Kutukan', 'Medan Perang Oni',
            'Kota Mimikri', 'Langit Raijin', 'Kuil Kuno', 'Puncak Para Dewa',
        ];

        const floorInZone = ((floor - 1) % 10) + 1;
        const label = this.isBossFloor
            ? `B${floor}  —  BOSS BESAR  —  ${zoneNames[zone] || ''}`
            : `B${floor}  —  Zona ${zone}  —  ${zoneNames[zone] || ''}  (Lantai ${floorInZone}/9)`;

        this.add.text(GAME_WIDTH / 2, 28, label, {
            fontFamily: 'monospace', fontSize: '13px',
            color: this.isBossFloor ? '#cc4433' : '#cc8833',
            letterSpacing: 2,
        }).setOrigin(0.5);

        // HP player kalau ada
        if (this.playerData) {
            const hp    = this.playerData.hp || 0;
            const hpMax = this.playerData.stats?.hp_max || 100;
            const gold  = this.playerData.gold || 0;

            this.add.text(GAME_WIDTH - 20, 28,
                `❤ ${hp}/${hpMax}   💰 ${gold}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#446655',
            }).setOrigin(1, 0.5);
        }

        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e, 1);
        g.moveTo(60, 45); g.lineTo(GAME_WIDTH - 60, 45);
        g.strokePath();
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

        // Tentukan berapa baris yang dipakai
        const allRows   = [...new Set(nodes.map(n => n.row))].sort();
        const rowCount  = allRows.length;
        const totalH    = MAP_END_Y - MAP_START_Y;

        for (const node of nodes) {
            const x        = MAP_START_X + (node.col / Math.max(maxCol, 1)) * (MAP_END_X - MAP_START_X);
            const rowIndex = allRows.indexOf(node.row);
            const y        = MAP_START_Y + ((rowIndex + 1) / (rowCount + 1)) * totalH;
            positions[node.id] = { x, y };
        }

        return positions;
    }

    _drawEdges(edges, nodes) {
        const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
        const g       = this.add.graphics();

        for (const edge of edges) {
            const from     = this.nodePositions[edge.from];
            const to       = this.nodePositions[edge.to];
            if (!from || !to) continue;

            const fromNode = nodeMap[edge.from];
            const available = this._isAvailable(nodeMap[edge.to]);
            const cleared   = fromNode?.cleared;

            if (cleared && available) {
                g.lineStyle(2, 0x445566, 0.9);
            } else if (cleared) {
                g.lineStyle(1, 0x334455, 0.5);
            } else {
                g.lineStyle(1, 0x1a1a2e, 0.4);
            }

            g.beginPath();
            g.moveTo(from.x, from.y);
            g.lineTo(to.x, to.y);
            g.strokePath();
        }
    }

    _drawNodes(nodes) {
        const availableIds = this._getAvailableNodeIds();

        for (const node of nodes) {
            const pos         = this.nodePositions[node.id];
            if (!pos) continue;

            const isActive    = node.id === this.currentNodeId;
            const isAvailable = availableIds.includes(node.id);
            const isCleared   = node.cleared;

            this._drawOneNode(node, pos, isActive, isAvailable, isCleared);
        }
    }

    _drawOneNode(node, pos, isActive, isAvailable, isCleared) {
        const isMini   = node.isMini;
        const isBoss   = node.type === NODE_TYPE.BOSS;
        const radius   = isBoss ? 30 : isMini ? 26 : 22;
        const color    = NODE_COLORS[node.type] || 0x444466;
        const icon     = isMini ? '⚡' : (NODE_ICONS[node.type] || '?');

        const circle = this.add.circle(pos.x, pos.y, radius, 0x111122)
            .setStrokeStyle(
                isActive    ? 3 : isAvailable ? 2 : 1,
                isActive    ? 0xffcc44
                : isAvailable ? color
                : isCleared   ? 0x223333
                : 0x1a1a2e
            );

        this.add.text(pos.x, pos.y - 4, icon, {
            fontFamily: 'monospace',
            fontSize:   isBoss ? '22px' : '16px',
            color:      isCleared && !isActive ? '#222233' : '#ffffff',
        }).setOrigin(0.5);

        // Label tipe node
        const typeLabel = isMini ? 'Mini Boss'
            : isBoss ? 'BOSS'
            : node.type;

        this.add.text(pos.x, pos.y + radius + 8, typeLabel, {
            fontFamily: 'monospace', fontSize: '9px',
            color: isAvailable ? '#556677' : '#222233',
        }).setOrigin(0.5);

        if (isAvailable) {
            circle.setInteractive({ useHandCursor: true });

            circle.on('pointerover', () => {
                circle.setScale(1.15);
                this._showNodeTooltip(node, pos);
            });
            circle.on('pointerout', () => {
                circle.setScale(1);
                this._hideNodeTooltip();
            });
            circle.on('pointerdown', () => {
                this._enterNode(node);
            });
        }
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
        };
        const label = node.isMini
            ? 'Mini Boss — penjaga lantai ini'
            : (labels[node.type] || '');

        const tx = Math.min(pos.x + 30, GAME_WIDTH - 200);
        const ty = Math.max(pos.y - 40, 55);

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
        ];

        let lx = 80;
        for (const item of items) {
            this.add.circle(lx, GAME_HEIGHT - 22, 6, NODE_COLORS[item.type]);
            this.add.text(lx + 10, GAME_HEIGHT - 22, item.label, {
                fontFamily: 'monospace', fontSize: '10px', color: '#334455',
            }).setOrigin(0, 0.5);
            lx += 90;
        }

        // Mini boss indicator
        this.add.circle(lx, GAME_HEIGHT - 22, 6, 0xcc8833);
        this.add.text(lx + 10, GAME_HEIGHT - 22, 'Mini Boss', {
            fontFamily: 'monospace', fontSize: '10px', color: '#334455',
        }).setOrigin(0, 0.5);
    }

    // ── Menu Button ───────────────────────────────────────────

    _buildMenuButton() {
        // Tombol Menu (kanan atas)
        const menuBg = this.add.rectangle(GAME_WIDTH - 50, 28, 70, 26, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const menuTxt = this.add.text(GAME_WIDTH - 50, 28, '☰ Menu', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);

        menuBg.on('pointerover', () => { menuBg.setFillStyle(0x1a1a2e); menuTxt.setColor('#6677aa'); });
        menuBg.on('pointerout',  () => { menuBg.setFillStyle(0x0d0d1a); menuTxt.setColor('#334455'); });
        menuBg.on('pointerdown', () => {
            if (this._pauseOpen) this._closePauseMenu();
            else this._openPauseMenu();
        });

        // Tombol Deck (kiri atas, di sebelah kanan info HP)
        const deckBg = this.add.rectangle(130, 28, 90, 26, 0x0d1a0d)
            .setStrokeStyle(1, 0x1a3322)
            .setInteractive({ useHandCursor: true });
        const deckTxt = this.add.text(130, 28, '📋 Deck', {
            fontFamily: 'monospace', fontSize: '11px', color: '#336633',
        }).setOrigin(0.5);

        deckBg.on('pointerover', () => { deckBg.setFillStyle(0x0d2a0d); deckTxt.setColor('#44cc44'); });
        deckBg.on('pointerout',  () => { deckBg.setFillStyle(0x0d1a0d); deckTxt.setColor('#336633'); });
        deckBg.on('pointerdown', () => this._openDeckViewer());
    }

    _openDeckViewer() {
        const allCards = [
            ...(this.playerData?.deck    || []),
            ...(this.playerData?.discard || []),
            ...(this.playerData?.hand    || []),
        ];

        if (allCards.length === 0) return;

        DeckViewerOverlay.show(this, allCards, {
            canPurge:   false,
            canUpgrade: false,
        });
    }

    // ── Pause Menu ────────────────────────────────────────────

    // ── Pause Menu ────────────────────────────────────────────

    _openPauseMenu() {
        if (this._pauseOpen) return;
        this._pauseOpen = true;
        this._pauseObjects = [];

        const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75
        ).setDepth(20).setInteractive();
        this._pauseObjects.push(overlay);

        const panel = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 300, 0x0d0e18
        ).setStrokeStyle(1, 0x223344).setDepth(21);
        this._pauseObjects.push(panel);

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, 'PAUSED', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(22);
        this._pauseObjects.push(title);

        const menuItems = [
            {
                label:  '▶  Lanjutkan',
                action: () => this._closePauseMenu(),
            },
            {
                label:  '💾  Simpan & Keluar',
                action: () => {
                    SaveSystem.manualSave({
                        zone:          this.zone,
                        floor:         this.floor,
                        curseLevel:    this.curseLevel,
                        playerData:    this.playerData,
                        mapData:       this.mapData,
                        currentNodeId: this.currentNodeId,
                    });
                    GameGuard.deactivate();
                    this.scene.start(SCENE.MAIN_MENU);
                },
            },
            {
                label:  '🔄  Mulai Ulang',
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
                .setInteractive({ useHandCursor: true })
                .setDepth(22);
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
        if (this._pauseObjects) {
            this._pauseObjects.forEach(o => { try { o.destroy(); } catch(e){} });
            this._pauseObjects = [];
        }
    }

    // ── Floor Entry Notif ─────────────────────────────────────

    _showFloorEntryNotif() {
        const label = this.isBossFloor
            ? `⚠ BOSS — B${this.floor}`
            : `B${this.floor}`;

        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, label, {
            fontFamily: 'monospace', fontSize: '44px', fontStyle: 'bold',
            color: this.isBossFloor ? '#cc4433' : '#cc8833', alpha: 0,
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt, alpha: { from: 0, to: 1 },
            y: { from: GAME_HEIGHT / 2 + 20, to: GAME_HEIGHT / 2 },
            duration: 350,
            onComplete: () => {
                this.time.delayedCall(700, () => {
                    this.tweens.add({
                        targets: txt, alpha: 0, duration: 350,
                        onComplete: () => txt.destroy(),
                    });
                });
            },
        });
    }

    // ── Navigation ────────────────────────────────────────────

    _enterNode(node) {
        const prevNodeId = this.currentNodeId;
        const prevNode   = this.mapData.nodes.find(n => n.id === prevNodeId);
        if (prevNode) prevNode.cleared = true;
        this.currentNodeId = node.id;

        // Checkpoint: simpan posisi sebelum masuk node
        // Sehingga kalau refresh, player kembali ke peta di posisi sebelumnya
        SaveSystem.checkpointSave({
            zone:        this.zone,
            floor:       this.floor,
            curseLevel:  this.curseLevel,
            playerData:  this.playerData,
            mapData:     this.mapData,
            prevNodeId,          // posisi sebelum masuk node ini
        });

        const sceneData = {
            zone:          this.zone,
            floor:         this.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
        };

        switch (node.type) {
            case NODE_TYPE.COMBAT:
                this.scene.start(SCENE.COMBAT, { ...sceneData, isBoss: false, isElite: false });
                break;

            case NODE_TYPE.ELITE:
                // Elite biasa atau mini boss
                this.scene.start(SCENE.COMBAT, {
                    ...sceneData,
                    isBoss:   false,
                    isElite:  true,
                    isMini:   node.isMini || false,
                });
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

            default:
                console.warn(`[NodeMap] Tipe node tidak dikenal: ${node.type}`);
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    _getAvailableNodeIds() {
        return NodeMapGenerator
            .getAvailableNodes(this.currentNodeId, this.mapData.edges, this.mapData.nodes)
            .filter(n => !n.cleared)
            .map(n => n.id);
    }

    _isAvailable(node) {
        if (!node) return false;
        return this._getAvailableNodeIds().includes(node.id);
    }
}