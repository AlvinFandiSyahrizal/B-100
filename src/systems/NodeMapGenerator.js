// ============================================================
// NodeMapGenerator.js — generate peta node bercabang per zona
// Struktur: B1 → B2 → ... → B9 → BOSS B10 (per zona)
// Tiap kolom = 1 lantai, tiap lantai bisa punya 1-3 node pilihan
// ============================================================

import { NODE_TYPE, NODE_WEIGHTS } from '../config/constants.js';

// 9 lantai kroco + 1 boss = 10 lantai per zona
// Kolom 0 = start, kolom 1-8 = lantai B1-B8, kolom 9 = pre-boss, kolom 10 = boss
const FLOOR_COLUMNS = 9;   // kolom lantai aktif (B1 - B9)
const MAX_ROWS      = 3;   // maksimal jalur paralel per kolom

export class NodeMapGenerator {

    /**
     * Generate peta satu zona.
     * @param {number} zone  - zona ke berapa (1-10)
     * @returns {{ nodes, edges, zone }}
     */
    static generate(zone) {
        const nodes = [];
        const edges = [];

        // ── Kolom 0: Start ────────────────────────────────────
        nodes.push({
            id:      'start',
            col:     0,
            row:     1,
            type:    NODE_TYPE.START,
            floor:   this._baseFloor(zone),
            cleared: true,
        });

        // ── Kolom 1 sampai FLOOR_COLUMNS-1: Lantai B1-B8 ─────
        // Tiap kolom punya 1-3 node (jalur bercabang)
        for (let col = 1; col < FLOOR_COLUMNS; col++) {
            const floor     = this._baseFloor(zone) + col - 1;
            const rowCount  = this._rowCountForCol(col);

            // Pilih baris mana saja yang aktif
            const activeRows = this._pickRows(rowCount);

            for (const row of activeRows) {
                const type = this._pickNodeType(zone, col);
                nodes.push({
                    id:      `n_${col}_${row}`,
                    col,
                    row,
                    type,
                    floor,
                    cleared: false,
                });
            }
        }

        // ── Kolom FLOOR_COLUMNS: Lantai B9 — pre-boss ─────────
        // Selalu rest atau shop biar player bisa prepare
        const preBossFloor = this._baseFloor(zone) + FLOOR_COLUMNS - 1;
        const preBossTypes = [
            NODE_TYPE.REST,
            NODE_TYPE.SHOP,
            NODE_TYPE.REST,
        ];
        const preBossRows = [0, 1, 2];
        for (const row of preBossRows) {
            nodes.push({
                id:      `n_${FLOOR_COLUMNS}_${row}`,
                col:     FLOOR_COLUMNS,
                row,
                type:    preBossTypes[row],
                floor:   preBossFloor,
                cleared: false,
            });
        }

        // ── Kolom terakhir: Boss ──────────────────────────────
        nodes.push({
            id:      'boss',
            col:     FLOOR_COLUMNS + 1,
            row:     1,
            type:    NODE_TYPE.BOSS,
            floor:   zone * 10,   // B10, B20, ... B100
            cleared: false,
        });

        // ── Generate edges ────────────────────────────────────
        const byCol = this._groupByCol(nodes);
        const maxCol = FLOOR_COLUMNS + 1;

        for (let col = 0; col <= maxCol; col++) {
            const current = byCol[col] || [];
            const next    = byCol[col + 1] || [];
            if (next.length === 0) continue;

            for (const node of current) {
                const targets = this._pickTargets(node, next);
                for (const target of targets) {
                    const exists = edges.some(
                        e => e.from === node.id && e.to === target.id
                    );
                    if (!exists) {
                        edges.push({ from: node.id, to: target.id });
                    }
                }
            }
        }

        // ── Pastikan semua node punya path ────────────────────
        this._ensureConnectivity(nodes, edges, byCol, maxCol);

        return { nodes, edges, zone };
    }

    // ── Helpers ───────────────────────────────────────────────

    /** Lantai pertama zona ini. Zona 1 = B1, zona 2 = B11, dst. */
    static _baseFloor(zone) {
        return (zone - 1) * 10 + 1;
    }

    /**
     * Berapa banyak row (jalur) di kolom ini.
     * Kolom awal dan akhir lebih sedikit, tengah lebih banyak.
     */
    static _rowCountForCol(col) {
        if (col <= 1 || col >= FLOOR_COLUMNS - 1) return 2;
        return MAX_ROWS;
    }

    /**
     * Pilih baris mana yang aktif dari total rows yang tersedia.
     * Selalu ada minimal 1 jalur di tengah (row 1).
     */
    static _pickRows(count) {
        if (count >= MAX_ROWS) return [0, 1, 2];
        if (count === 2) {
            // Pilih 2 dari 3 baris secara acak
            const options = [[0, 1], [1, 2], [0, 2]];
            return options[Math.floor(Math.random() * options.length)];
        }
        return [1]; // hanya tengah
    }

    /**
     * Pilih tipe node sesuai zona dan kolom.
     */
    static _pickNodeType(zone, col) {
        // Kolom 2-3: lebih banyak combat
        // Kolom 4-6: mulai variatif
        // Kolom 7-8: elite mulai muncul

        // Override: kolom 3 selalu ada 1 elite di salah satu row
        // (ditangani di _pickRows level, bukan di sini)

        // Build weighted pool
        const pool = [];
        const weights = { ...NODE_WEIGHTS };

        // Zona lebih dalam = elite lebih sering
        if (zone >= 3) weights.elite = Math.min(25, NODE_WEIGHTS.elite + zone * 2);

        // Kolom tengah = event lebih sering
        if (col >= 3 && col <= 6) weights.event += 5;

        for (const [type, weight] of Object.entries(weights)) {
            for (let i = 0; i < weight; i++) pool.push(type);
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

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

        // Urutkan berdasarkan kedekatan row
        const sorted = [...nextColNodes].sort(
            (a, b) => Math.abs(a.row - node.row) - Math.abs(b.row - node.row)
        );

        // Kolom pre-boss (semua jalur menuju boss): 1 koneksi saja
        if (nextColNodes[0]?.id === 'boss') return [nextColNodes[0]];

        // Normal: 50% dapat 2 koneksi
        const count = Math.random() < 0.5 ? 2 : 1;
        return sorted.slice(0, count);
    }

    static _ensureConnectivity(nodes, edges, byCol, maxCol) {
        for (const node of nodes) {
            if (node.id === 'start') continue;

            // Pastikan punya incoming edge
            const hasIncoming = edges.some(e => e.to === node.id);
            if (!hasIncoming) {
                const prevCol = byCol[node.col - 1];
                if (prevCol?.length > 0) {
                    const source = prevCol[Math.floor(Math.random() * prevCol.length)];
                    edges.push({ from: source.id, to: node.id });
                }
            }

            if (node.id === 'boss') continue;

            // Pastikan punya outgoing edge
            const hasOutgoing = edges.some(e => e.from === node.id);
            if (!hasOutgoing) {
                const nextCol = byCol[node.col + 1];
                if (nextCol?.length > 0) {
                    const target = nextCol[Math.floor(Math.random() * nextCol.length)];
                    edges.push({ from: node.id, to: target.id });
                }
            }
        }
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