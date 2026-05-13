// ============================================================
// NodeMapGenerator.js — generate peta node bercabang per zona
// Dipanggil setiap masuk zona baru, hasilnya dikirim ke NodeMapScene
// ============================================================

import {
    NODE_TYPE, NODE_WEIGHTS,
    FLOORS_PER_ZONE
} from '../config/constants.js';

// Jumlah kolom node (kiri ke kanan = progress lantai)
const COLUMNS     = 6;
// Jumlah node per kolom (pilihan jalur)
const ROWS        = 3;

export class NodeMapGenerator {

    /**
     * Generate satu peta zona.
     * @param {number} zone       - zona ke berapa (1-10)
     * @param {number} seed       - opsional, untuk reproducible map
     * @returns {object} mapData  - { nodes, edges, zone }
     */
    static generate(zone, seed = null) {
        // nodes: array of { id, col, row, type, floor, cleared }
        // edges: array of { from, to } — koneksi antar node
        const nodes = [];
        const edges = [];

        // ── Kolom 0: Start node (selalu ada 1) ───────────────
        nodes.push({
            id:      'start',
            col:     0,
            row:     1,         // tengah
            type:    NODE_TYPE.START,
            floor:   this._floorFromCol(zone, 0),
            cleared: true,      // start sudah "dilalui"
        });

        // ── Kolom 1-5: Node acak ──────────────────────────────
        for (let col = 1; col < COLUMNS; col++) {
            for (let row = 0; row < ROWS; row++) {
                // Tidak semua slot diisi — ada chance kosong
                // biar peta tidak terlalu penuh
                if (col < COLUMNS - 1 && Math.random() < 0.25) continue;

                const type = this._pickNodeType(zone, col);
                nodes.push({
                    id:      `n_${col}_${row}`,
                    col,
                    row,
                    type,
                    floor:   this._floorFromCol(zone, col),
                    cleared: false,
                });
            }
        }

        // ── Kolom terakhir: Boss (selalu ada, selalu di tengah) ─
        // Boss sudah ada di kolom COLUMNS (di luar loop)
        nodes.push({
            id:      'boss',
            col:     COLUMNS,
            row:     1,
            type:    NODE_TYPE.BOSS,
            floor:   zone * 10,  // B10, B20, dst
            cleared: false,
        });

        // ── Generate edges ────────────────────────────────────
        // Setiap node terhubung ke 1-2 node di kolom berikutnya
        const byCol = this._groupByCol(nodes);

        for (let col = 0; col < COLUMNS; col++) {
            const current = byCol[col] || [];
            const next    = byCol[col + 1] || [];
            if (next.length === 0) continue;

            for (const node of current) {
                // Pilih 1-2 target di kolom berikutnya
                const targets = this._pickTargets(node, next);
                for (const target of targets) {
                    // Hindari duplikat edge
                    const exists = edges.some(
                        e => e.from === node.id && e.to === target.id
                    );
                    if (!exists) {
                        edges.push({ from: node.id, to: target.id });
                    }
                }
            }
        }

        // ── Pastikan semua node punya minimal 1 path ke boss ──
        this._ensureConnectivity(nodes, edges, byCol);

        return { nodes, edges, zone };
    }

    // ── Private Helpers ───────────────────────────────────────

    /**
     * Pilih tipe node sesuai zona dan posisi kolom.
     * Kolom awal lebih banyak combat, kolom tengah lebih variatif.
     */
    static _pickNodeType(zone, col) {
        // Kolom terakhir sebelum boss → lebih banyak rest/shop
        if (col === COLUMNS - 1) {
            const preBossPool = ['rest', 'shop', 'rest', 'treasure'];
            return preBossPool[Math.floor(Math.random() * preBossPool.length)];
        }

        // Build weighted pool
        const pool = [];
        for (const [type, weight] of Object.entries(NODE_WEIGHTS)) {
            for (let i = 0; i < weight; i++) pool.push(type);
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * Konversi kolom ke nomor lantai.
     * Kolom 0 = lantai pertama zona, kolom 5 = lantai terakhir sebelum boss.
     */
    static _floorFromCol(zone, col) {
        const baseFloor = (zone - 1) * 10 + 1;
        return baseFloor + col;
    }

    /** Kelompokkan nodes berdasarkan kolom. */
    static _groupByCol(nodes) {
        const byCol = {};
        for (const node of nodes) {
            if (!byCol[node.col]) byCol[node.col] = [];
            byCol[node.col].push(node);
        }
        return byCol;
    }

    /**
     * Pilih 1-2 node target di kolom berikutnya.
     * Preferensi ke row yang berdekatan.
     */
    static _pickTargets(node, nextColNodes) {
        if (nextColNodes.length === 0) return [];
        if (nextColNodes.length === 1) return [nextColNodes[0]];

        // Urutkan berdasarkan kedekatan row
        const sorted = [...nextColNodes].sort(
            (a, b) => Math.abs(a.row - node.row) - Math.abs(b.row - node.row)
        );

        // 60% chance dapat 2 koneksi, 40% hanya 1
        const count = Math.random() < 0.6 ? 2 : 1;
        return sorted.slice(0, count);
    }

    /**
     * Pastikan setiap node bisa dicapai dari start dan bisa sampai boss.
     * Kalau ada node terisolir, tambah edge ke node terdekat.
     */
    static _ensureConnectivity(nodes, edges, byCol) {
        // Cek tiap node punya minimal 1 incoming edge (kecuali start)
        for (const node of nodes) {
            if (node.id === 'start') continue;

            const hasIncoming = edges.some(e => e.to === node.id);
            if (!hasIncoming) {
                // Cari node di kolom sebelumnya dan sambung
                const prevCol = byCol[node.col - 1];
                if (prevCol && prevCol.length > 0) {
                    const source = prevCol[Math.floor(Math.random() * prevCol.length)];
                    edges.push({ from: source.id, to: node.id });
                }
            }

            // Cek punya outgoing edge (kecuali boss)
            if (node.id === 'boss') continue;
            const hasOutgoing = edges.some(e => e.from === node.id);
            if (!hasOutgoing) {
                const nextCol = byCol[node.col + 1];
                if (nextCol && nextCol.length > 0) {
                    const target = nextCol[Math.floor(Math.random() * nextCol.length)];
                    edges.push({ from: node.id, to: target.id });
                }
            }
        }
    }

    /**
     * Kembalikan node yang bisa dipilih dari posisi sekarang.
     * @param {string}   currentNodeId
     * @param {object[]} edges
     * @param {object[]} nodes
     */
    static getAvailableNodes(currentNodeId, edges, nodes) {
        const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
        const targets = edges
            .filter(e => e.from === currentNodeId)
            .map(e => nodeMap[e.to])
            .filter(Boolean);
        return targets;
    }
}
