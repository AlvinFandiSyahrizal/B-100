// ============================================================
// systems/MagatamaSystem.js — sistem currency Magatama
//
// Magatama = mata uang gacha permanen antar run
// Disimpan di meta (localStorage), tidak hilang saat game over
//
// Cara dapat:
//   - Kill monster biasa  → 1-3 Magatama
//   - Kill elite          → 5-8 Magatama
//   - Kill mini boss      → 15 Magatama
//   - Kill boss besar     → 30 Magatama
//   - Bonus game over     → 10 Magatama flat
//   - Bonus menang run    → 50 Magatama
//
// Dipakai untuk:
//   - Gacha companion     → 10 Magatama / pull
//   - Gacha pet           → 10 Magatama / pull
//   - Gacha weapon        → 10 Magatama / pull
//   - 10x pull            → 90 Magatama (diskon 10%)
// ============================================================

import { SaveSystem } from '../storage/SaveSystem.js';

// ── Konstanta ────────────────────────────────────────────────

export const MAGATAMA_EARN = {
    MONSTER_MIN:    1,
    MONSTER_MAX:    3,
    ELITE_MIN:      5,
    ELITE_MAX:      8,
    MINI_BOSS:      15,
    BOSS:           30,
    GAME_OVER:      10,
    WIN_RUN:        50,
};

export const MAGATAMA_COST = {
    PULL_SINGLE:    10,
    PULL_TEN:       90,
};

export class MagatamaSystem {

    // ── Getter / Setter ───────────────────────────────────────

    /**
     * Ambil jumlah Magatama yang dimiliki.
     */
    static getBalance() {
        const meta = SaveSystem.loadMeta();
        return meta.magatama || 0;
    }

    /**
     * Tambah Magatama ke balance.
     * @param {number} amount
     * @param {string} source — untuk logging
     * @returns {number} balance baru
     */
    static earn(amount, source = 'unknown') {
        if (amount <= 0) return this.getBalance();

        const meta = SaveSystem.loadMeta();
        meta.magatama = (meta.magatama || 0) + Math.floor(amount);
        meta.totalMagatamaEarned = (meta.totalMagatamaEarned || 0) + Math.floor(amount);
        SaveSystem.saveMeta(meta);

        console.log(`[Magatama] +${amount} dari ${source} → total: ${meta.magatama}`);
        return meta.magatama;
    }

    /**
     * Kurangi Magatama untuk gacha/beli.
     * @param {number} amount
     * @returns {{ success: boolean, balance: number }}
     */
    static spend(amount) {
        const meta = SaveSystem.loadMeta();
        const current = meta.magatama || 0;

        if (current < amount) {
            return { success: false, balance: current };
        }

        meta.magatama = current - amount;
        meta.totalMagatamaSpent = (meta.totalMagatamaSpent || 0) + amount;
        SaveSystem.saveMeta(meta);

        console.log(`[Magatama] -${amount} → sisa: ${meta.magatama}`);
        return { success: true, balance: meta.magatama };
    }

    /**
     * Cek apakah cukup untuk pull.
     */
    static canPull(isTen = false) {
        const cost    = isTen ? MAGATAMA_COST.PULL_TEN : MAGATAMA_COST.PULL_SINGLE;
        const balance = this.getBalance();
        return balance >= cost;
    }

    // ── Earn Helpers ──────────────────────────────────────────

    /**
     * Hitung Magatama yang didapat dari satu combat.
     * Dipanggil di CombatScene saat playerWon.
     *
     * @param {object} opts
     * @param {boolean} opts.isBoss
     * @param {boolean} opts.isElite
     * @param {boolean} opts.isMini
     * @param {number}  opts.monsterCount
     * @param {number}  opts.floor
     * @param {number}  opts.curseLevel
     * @returns {number} total Magatama yang didapat
     */
    static calcCombatEarn({ isBoss, isElite, isMini, monsterCount = 1, floor = 1, curseLevel = 1 }) {
        let total = 0;

        if (isBoss) {
            total = MAGATAMA_EARN.BOSS;
        } else if (isMini) {
            total = MAGATAMA_EARN.MINI_BOSS;
        } else if (isElite) {
            // Elite: per monster
            for (let i = 0; i < monsterCount; i++) {
                total += _randInt(MAGATAMA_EARN.ELITE_MIN, MAGATAMA_EARN.ELITE_MAX);
            }
        } else {
            // Combat biasa: per monster
            for (let i = 0; i < monsterCount; i++) {
                total += _randInt(MAGATAMA_EARN.MONSTER_MIN, MAGATAMA_EARN.MONSTER_MAX);
            }
        }

        // Bonus curse level (+20% per level di atas 1)
        const curseMultiplier = 1 + (curseLevel - 1) * 0.2;
        total = Math.round(total * curseMultiplier);

        // Bonus per zona (floor 1-10 = zona 1, dst)
        const zone       = Math.ceil(floor / 10);
        const zoneBonus  = 1 + (zone - 1) * 0.1;  // +10% per zona
        total = Math.round(total * zoneBonus);

        return Math.max(1, total);
    }

    /**
     * Earn Magatama dari hasil combat dan simpan ke meta.
     * Return jumlah yang didapat.
     */
    static earnFromCombat(opts) {
        const amount = this.calcCombatEarn(opts);
        const source = opts.isBoss  ? 'boss'
                     : opts.isMini  ? 'mini_boss'
                     : opts.isElite ? 'elite'
                     : 'combat';
        return { amount, newBalance: this.earn(amount, source) };
    }

    /**
     * Earn bonus Magatama saat game over.
     */
    static earnGameOver() {
        return {
            amount:     MAGATAMA_EARN.GAME_OVER,
            newBalance: this.earn(MAGATAMA_EARN.GAME_OVER, 'game_over'),
        };
    }

    /**
     * Earn bonus Magatama saat menyelesaikan run (B100).
     */
    static earnWinRun() {
        return {
            amount:     MAGATAMA_EARN.WIN_RUN,
            newBalance: this.earn(MAGATAMA_EARN.WIN_RUN, 'win_run'),
        };
    }

    // ── Stats ─────────────────────────────────────────────────

    static getStats() {
        const meta = SaveSystem.loadMeta();
        return {
            balance:      meta.magatama             || 0,
            totalEarned:  meta.totalMagatamaEarned  || 0,
            totalSpent:   meta.totalMagatamaSpent   || 0,
        };
    }
}

// ── Helpers ───────────────────────────────────────────────────
function _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}