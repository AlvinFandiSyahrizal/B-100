// ============================================================
// NodeMapScene.js — layar peta node bercabang per zona
// Player pilih node mana yang mau dilalui sebelum masuk combat
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT,
    NODE_TYPE
} from '../config/constants.js';
import { NodeMapGenerator } from '../systems/NodeMapGenerator.js';

// Posisi canvas untuk area peta
const MAP_START_X = 120;
const MAP_END_X   = GAME_WIDTH - 120;
const MAP_START_Y = 120;
const MAP_END_Y   = GAME_HEIGHT - 100;

// Icon tiap tipe node
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

// Warna tiap tipe node
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

        // Kalau ada mapData yang dikirim (resume), pakai itu
        // Kalau tidak, generate baru
        this.mapData = data.mapData || NodeMapGenerator.generate(this.zone);

        // Node yang sedang aktif (posisi player sekarang)
        this.currentNodeId = data.currentNodeId || 'start';
    }

    create() {
        this._buildBackground();
        this._buildZoneInfo();
        this._buildMap();
        this._buildLegend();
    }

    // ── Background ────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x080810
        );

        // Grid tipis
        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        for (let x = 0; x < GAME_WIDTH; x += 40) {
            g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT);
        }
        g.strokePath();
    }

    // ── Zone Info Header ──────────────────────────────────────

    _buildZoneInfo() {
        const zoneNames = [
            '', // index 0 kosong
            'Hutan Kappa',
            'Hutan Tengu',
            'Laut Umi-bozu',
            'Gunung Api Kasha',
            'Lembah Kutukan',
            'Medan Perang Oni',
            'Kota Mimikri',
            'Langit Raijin',
            'Kuil Kuno',
            'Puncak Para Dewa',
        ];

        this.add.text(GAME_WIDTH / 2, 28, `ZONA ${this.zone}  —  ${zoneNames[this.zone] || ''}`, {
            fontFamily: 'monospace',
            fontSize:   '14px',
            color:      '#cc8833',
            letterSpacing: 3,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 52, `Curse Level ${this.curseLevel}  •  B${this.floor}`, {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      '#445566',
        }).setOrigin(0.5);

        // Garis pemisah
        const g = this.add.graphics();
        g.lineStyle(1, 0x222233, 1);
        g.moveTo(80, 68); g.lineTo(GAME_WIDTH - 80, 68);
        g.strokePath();
    }

    // ── Map Rendering ─────────────────────────────────────────

    _buildMap() {
        const { nodes, edges } = this.mapData;

        // Hitung posisi tiap node di layar
        this.nodePositions = this._calculatePositions(nodes);

        // Gambar edges dulu (di bawah node)
        this._drawEdges(edges, nodes);

        // Gambar nodes
        this._drawNodes(nodes);
    }

    /**
     * Hitung posisi pixel tiap node berdasarkan col & row.
     */
    _calculatePositions(nodes) {
        const positions = {};

        // Cari kolom max
        const maxCol = Math.max(...nodes.map(n => n.col));

        for (const node of nodes) {
            // Berapa node di kolom ini?
            const sameCol   = nodes.filter(n => n.col === node.col);
            const rowCount  = sameCol.length;

            // Distribusi vertikal merata
            const totalH    = MAP_END_Y - MAP_START_Y;
            const stepH     = totalH / (rowCount + 1);
            const sortedCol = [...sameCol].sort((a, b) => a.row - b.row);
            const rowIndex  = sortedCol.findIndex(n => n.id === node.id);

            const x = MAP_START_X + (node.col / maxCol) * (MAP_END_X - MAP_START_X);
            const y = MAP_START_Y + (rowIndex + 1) * stepH;

            positions[node.id] = { x, y };
        }

        return positions;
    }

    _drawEdges(edges, nodes) {
        const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
        const g       = this.add.graphics();

        for (const edge of edges) {
            const from = this.nodePositions[edge.from];
            const to   = this.nodePositions[edge.to];
            if (!from || !to) continue;

            const fromNode = nodeMap[edge.from];
            const toNode   = nodeMap[edge.to];

            // Warna edge: terang kalau dari node aktif, redup kalau sudah lewat / belum bisa
            const available = this._isAvailable(toNode);
            const cleared   = fromNode?.cleared;

            if (cleared && available) {
                g.lineStyle(2, 0x445566, 0.9);
            } else if (cleared) {
                g.lineStyle(1, 0x334455, 0.6);
            } else {
                g.lineStyle(1, 0x222233, 0.4);
            }

            g.beginPath();
            g.moveTo(from.x, from.y);

            // Garis melengkung sedikit biar tidak lurus kaku
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 10;
            g.lineTo(to.x, to.y);
            g.strokePath();
        }
    }

    _drawNodes(nodes) {
        const availableIds = this._getAvailableNodeIds();

        for (const node of nodes) {
            const pos       = this.nodePositions[node.id];
            if (!pos) continue;

            const isActive    = node.id === this.currentNodeId;
            const isAvailable = availableIds.includes(node.id);
            const isCleared   = node.cleared;

            this._drawOneNode(node, pos, isActive, isAvailable, isCleared);
        }
    }

    _drawOneNode(node, pos, isActive, isAvailable, isCleared) {
        const radius = node.type === NODE_TYPE.BOSS ? 28 : 22;
        const color  = NODE_COLORS[node.type] || 0x444466;
        const icon   = NODE_ICONS[node.type]  || '?';

        // Lingkaran background
        const circle = this.add.circle(pos.x, pos.y, radius, 0x111122)
            .setStrokeStyle(
                isActive    ? 3 : isAvailable ? 2 : 1,
                isActive    ? 0xffcc44
                : isAvailable ? color
                : isCleared   ? 0x334455
                : 0x222233
            );

        // Icon tipe node
        const iconTxt = this.add.text(pos.x, pos.y - 4, icon, {
            fontFamily: 'monospace',
            fontSize:   node.type === NODE_TYPE.BOSS ? '20px' : '16px',
            color:      isCleared && !isActive ? '#333344' : '#ffffff',
        }).setOrigin(0.5);

        // Label floor
        this.add.text(pos.x, pos.y + radius + 8, `B${node.floor}`, {
            fontFamily: 'monospace',
            fontSize:   '10px',
            color:      isAvailable ? '#667788' : '#333344',
        }).setOrigin(0.5);

        // Interaktif hanya kalau available
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
            [NODE_TYPE.COMBAT]:   'Pertarungan biasa',
            [NODE_TYPE.ELITE]:    'Elite — lebih kuat, loot lebih baik',
            [NODE_TYPE.SHOP]:     'Merchant — beli/jual item & kartu',
            [NODE_TYPE.REST]:     'Rest Site — heal HP atau upgrade kartu',
            [NODE_TYPE.EVENT]:    'Random Event — untung atau buntung',
            [NODE_TYPE.TREASURE]: 'Treasure Room — dapat item gratis',
            [NODE_TYPE.SHRINE]:   'Shrine — buff dengan risiko',
            [NODE_TYPE.BOSS]:     'BOSS — hadapi yokai penguasa zona',
        };

        const tx = Math.min(pos.x + 30, GAME_WIDTH - 160);
        const ty = Math.max(pos.y - 40, 80);

        this._tooltip = this.add.text(tx, ty, labels[node.type] || '', {
            fontFamily:  'monospace',
            fontSize:    '11px',
            color:       '#aabbcc',
            backgroundColor: '#0d0d1a',
            padding:     { x: 8, y: 5 },
        }).setDepth(10);
    }

    _hideNodeTooltip() {
        if (this._tooltip) {
            this._tooltip.destroy();
            this._tooltip = null;
        }
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
            this.add.circle(lx, GAME_HEIGHT - 30, 7, NODE_COLORS[item.type]);
            this.add.text(lx + 12, GAME_HEIGHT - 30, item.label, {
                fontFamily: 'monospace',
                fontSize:   '10px',
                color:      '#445566',
            }).setOrigin(0, 0.5);
            lx += 90;
        }
    }

    // ── Navigation ────────────────────────────────────────────

    _enterNode(node) {
        // Tandai node sebelumnya sebagai cleared
        const prevNode = this.mapData.nodes.find(n => n.id === this.currentNodeId);
        if (prevNode) prevNode.cleared = true;

        this.currentNodeId = node.id;

        const sceneData = {
            zone:          this.zone,
            floor:         node.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
            returnScene:   SCENE.NODE_MAP,
        };

        switch (node.type) {
            case NODE_TYPE.COMBAT:
            case NODE_TYPE.ELITE:
                this.scene.start(SCENE.COMBAT, sceneData);
                break;

            case NODE_TYPE.SHOP:
                this.scene.start(SCENE.SHOP, sceneData);
                break;

            case NODE_TYPE.REST:
                this.scene.start(SCENE.REST, sceneData);
                break;

            case NODE_TYPE.EVENT:
                // Phase 3+
                console.log('Event — belum diimplementasi');
                break;

            case NODE_TYPE.TREASURE:
                // Langsung ke RewardScene
                this.scene.start(SCENE.REWARD, { ...sceneData, isTreasure: true });
                break;

            case NODE_TYPE.BOSS:
                this.scene.start(SCENE.BOSS_INTRO, sceneData);
                break;

            default:
                console.log(`Node type ${node.type} belum diimplementasi.`);
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    _getAvailableNodeIds() {
        return NodeMapGenerator
            .getAvailableNodes(
                this.currentNodeId,
                this.mapData.edges,
                this.mapData.nodes
            )
            .filter(n => !n.cleared)
            .map(n => n.id);
    }

    _isAvailable(node) {
        return this._getAvailableNodeIds().includes(node.id);
    }
}