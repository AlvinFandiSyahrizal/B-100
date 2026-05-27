// Struktur per lantai:
//   Start → 3-5 node (combat/event/rest/treasure/shop) → Mini Boss → Selesai
//
// Struktur per zona (10 lantai):
//   B1(map) → B2(map) → ... → B9(map) → B10 BOSS BESAR
// ============================================================

import { NODE_TYPE, NODE_WEIGHTS } from '../config/constants.js';

// Jumlah node aktif per lantai (tidak termasuk start dan mini boss)
const MIN_NODES = 3;
const MAX_NODES = 5;

// Jumlah kolom layout di layar (visual)
// Kolom 0 = start, kolom 1..N = node, kolom N+1 = mini boss / boss
const LAYOUT_COLS = 5;

export class NodeMapGenerator {

    /**
     * Generate node map untuk satu lantai.
     *
     * @param {number} floor      
     * @param {number} zone      
     * @param {boolean} isBossFloor 
     * @returns {{ nodes, edges, floor, zone, isBossFloor }}
     */
    static generate(floor, zone, isBossFloor = false) {
        const nodes = [];
        const edges = [];

        // Lantai dalam zona (1-9 untuk kroco+miniboss, 10 untuk boss besar)
        const floorInZone = ((floor - 1) % 10) + 1;

        // ── Start node ────────────────────────────────────────
        nodes.push({
            id:      'start',
            col:     0,
            row:     1,
            type:    NODE_TYPE.START,
            floor,
            cleared: true,
        });

        if (isBossFloor) {
            // ── Boss besar: langsung 1 node boss ──────────────
            nodes.push({
                id:      'boss',
                col:     1,
                row:     1,
                type:    NODE_TYPE.BOSS,
                floor,
                cleared: false,
            });
            edges.push({ from: 'start', to: 'boss' });

        } else {
            // ── Lantai normal: 3-5 node + mini boss ───────────
            const nodeCount = this._randInt(MIN_NODES, MAX_NODES);
            this._generateFloorNodes(nodes, edges, floor, zone, floorInZone, nodeCount);
        }

        return { nodes, edges, floor, zone, isBossFloor };
    }

    // ── Floor Node Generation ─────────────────────────────────

    static _generateFloorNodes(
        nodes,
        edges,
        floor,
        zone,
        floorInZone,
        nodeCount
    ) {
        // tiap kolom bisa 1–3 row
        const ROWS = [0, 1, 2];

        for (let col = 1; col <= LAYOUT_COLS; col++) {
            let amount;

            // awal lantai: 2 jalur
            if (col === 1) {
                amount = 2;
            }

            // tengah bisa lebih rame
            else if (col === 2 || col === 3) {
                amount = this._randInt(2, 3);
            }

            // mendekati mini boss
            else {
                amount = this._randInt(1, 2);
            }

            // random pilih row unik
            const rows = [...ROWS]
                .sort(() => Math.random() - 0.5)
                .slice(0, amount)
                .sort();

            for (const row of rows) {
                nodes.push({
                    id: `n_${col}_${row}`,
                    col,
                    row,
                    type: this._pickNodeType(
                        zone,
                        col,
                        floorInZone
                    ),
                    floor,
                    cleared: false,
                });
            }
        }

        // mini boss
        const lastCol = LAYOUT_COLS + 1;

        nodes.push({
            id: 'mini_boss',
            col: lastCol,
            row: 1,
            type: NODE_TYPE.ELITE,
            isMini: true,
            floor,
            cleared: false,
        });

        // edges
        const byCol = this._groupByCol(nodes);

        for (let col = 0; col < lastCol; col++) {
            const current =
                byCol[col] || [];

            const next =
                byCol[col + 1] || [];

            for (const node of current) {
                const targets =
                    this._pickTargets(
                        node,
                        next
                    );

                for (const target of targets) {
                    edges.push({
                        from: node.id,
                        to: target.id,
                    });
                }
            }
        }

        // pastikan semua kebagian jalur
        this._ensureConnectivity(
            nodes,
            edges,
            byCol
        );

        // dedupe
        const seen = new Set();

        const deduped =
            edges.filter(e => {
                const key =
                    `${e.from}->${e.to}`;

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            });

        edges.length = 0;
        edges.push(...deduped);
    }

    /**
     * Pilih tipe node.
     * floorInZone = posisi lantai dalam zona (1-9)
     */
    static _pickNodeType(zone, col, floorInZone) {
        // Kolom 1: selalu combat (lantai awal)
        if (col === 1) return NODE_TYPE.COMBAT;

        // Kolom 4-5: lebih banyak rest/shop biar prepare mini boss
        if (col >= 4) {
            const preMiniPool = [
                NODE_TYPE.REST,
                NODE_TYPE.REST,
                NODE_TYPE.SHOP,
                NODE_TYPE.COMBAT,
                NODE_TYPE.TREASURE,
            ];
            return preMiniPool[Math.floor(Math.random() * preMiniPool.length)];
        }

        // Kolom tengah: weighted pool
        const pool = [];
        const weights = { ...NODE_WEIGHTS };

        // Lantai awal zona: lebih banyak combat
        if (floorInZone <= 3) {
            weights.combat += 15;
            weights.elite  -= 5;
        }

        // Lantai akhir zona: lebih banyak elite dan event
        if (floorInZone >= 7) {
            weights.elite  += 10;
            weights.event  += 5;
        }

        // Zona dalam: elite lebih sering
        if (zone >= 3) {
            weights.elite = Math.min(30, weights.elite + zone * 2);
        }

        for (const [type, weight] of Object.entries(weights)) {
            for (let i = 0; i < Math.max(0, weight); i++) pool.push(type);
        }

        return pool[Math.floor(Math.random() * pool.length)] || NODE_TYPE.COMBAT;
    }

    // ── Helpers ───────────────────────────────────────────────

    static _groupByCol(nodes) {
        const byCol = {};
        for (const node of nodes) {
            if (!byCol[node.col]) byCol[node.col] = [];
            byCol[node.col].push(node);
        }
        return byCol;
    }

    static _pickTargets(node, nextColNodes) {
        if (nextColNodes.length === 0) return [];
        if (nextColNodes.length === 1) return [nextColNodes[0]];

        // Ke mini boss / boss: semua jalur menuju satu node
        if (nextColNodes[0]?.id === 'mini_boss' ||
            nextColNodes[0]?.id === 'boss') {
            return [nextColNodes[0]];
        }

        const sorted = [...nextColNodes].sort(
            (a, b) => Math.abs(a.row - node.row) - Math.abs(b.row - node.row)
        );

        // 40% dapat 2 koneksi
        const count = Math.random() < 0.4 ? 2 : 1;
        return sorted.slice(0, count);
    }

    static _ensureConnectivity(nodes, edges, byCol) {
        const maxCol = Math.max(...nodes.map(n => n.col));

        for (const node of nodes) {
            if (node.id === 'start') continue;

            // Pastikan punya minimal 1 incoming edge
            const hasIncoming = edges.some(e => e.to === node.id);
            if (!hasIncoming) {
                // Cari node terdekat di kolom sebelumnya
                const prevColNodes = byCol[node.col - 1] || [];
                if (prevColNodes.length > 0) {
                    // Pilih yang row-nya paling dekat
                    const closest = prevColNodes.reduce((a, b) =>
                        Math.abs(a.row - node.row) <= Math.abs(b.row - node.row) ? a : b
                    );
                    edges.push({ from: closest.id, to: node.id });
                }
            }

            if (node.id === 'mini_boss' || node.id === 'boss') continue;
            if (node.col >= maxCol) continue;

            // Pastikan punya minimal 1 outgoing edge
            const hasOutgoing = edges.some(e => e.from === node.id);
            if (!hasOutgoing) {
                const nextColNodes = byCol[node.col + 1] || [];
                if (nextColNodes.length > 0) {
                    const closest = nextColNodes.reduce((a, b) =>
                        Math.abs(a.row - node.row) <= Math.abs(b.row - node.row) ? a : b
                    );
                    edges.push({ from: node.id, to: closest.id });
                }
            }
        }
    }

    static _randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Kembalikan node yang bisa dipilih dari posisi sekarang.
     */
    static getAvailableNodes(currentNodeId, edges, nodes) {
        const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
        return edges
            .filter(e => e.from === currentNodeId)
            .map(e => nodeMap[e.to])
            .filter(Boolean);
    }
}