// ============================================================
// ScalingSystem.js — hitung stat musuh sesuai lantai + curse level
// Dipanggil oleh LootSystem dan CombatScene saat spawn monster
// ============================================================

import {
    MONSTER_SCALE_PER_FLOOR,
    BOSS_STAT_MULTIPLIER,
    ELITE_STAT_MULTIPLIER,
    CURSE_STAT_MULTIPLIER,
    CURSE_REWARD_MULTIPLIER,
    RARITY_WEIGHTS_BY_ZONE,
    RARITY,
} from '../config/constants.js';

export class ScalingSystem {

    /**
     * Hitung multiplier stat monster berdasarkan lantai + curse level.
     * @param {number} floor
     * @param {number} curseLevel  - 1-5
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {number} multiplier
     */
    static getMonsterMultiplier(floor, curseLevel = 1, isBoss = false, isElite = false) {
        const floorScale  = 1 + (floor - 1) * MONSTER_SCALE_PER_FLOOR;
        const curseScale  = CURSE_STAT_MULTIPLIER[curseLevel] || 1;
        const typeScale   = isBoss  ? BOSS_STAT_MULTIPLIER
                          : isElite ? ELITE_STAT_MULTIPLIER
                          : 1;

        return floorScale * curseScale * typeScale;
    }

    /**
     * Scale satu stat monster.
     */
    static scaleMonsterStat(baseStat, floor, curseLevel = 1, isBoss = false, isElite = false) {
        const multiplier = this.getMonsterMultiplier(floor, curseLevel, isBoss, isElite);
        return Math.round(baseStat * multiplier);
    }

    /**
     * Hitung gold reward setelah combat.
     */
    static scaleGold(baseGold, floor, curseLevel = 1, isBoss = false, isElite = false) {
        const floorBonus = 1 + (floor - 1) * 0.05;
        const curseBonus = CURSE_REWARD_MULTIPLIER[curseLevel] || 1;
        const typeBonus  = isBoss ? 4 : isElite ? 2 : 1;

        return Math.round(baseGold * floorBonus * curseBonus * typeBonus);
    }

    /**
     * Tentukan rarity item drop berdasarkan zona + curse level.
     */
    static rollRarity(zone, curseLevel = 1) {
        const zoneIdx = Math.min(zone - 1, 9);
        const weights = [...RARITY_WEIGHTS_BY_ZONE[zoneIdx]];

        const bonus = (curseLevel - 1) * 5;
        weights[0] = Math.max(0, weights[0] - bonus);
        weights[2] = weights[2] + Math.floor(bonus * 0.6);
        weights[3] = weights[3] + Math.floor(bonus * 0.4);

        const rarities = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY];
        const pool = [];
        weights.forEach((w, i) => {
            for (let j = 0; j < w; j++) pool.push(rarities[i]);
        });

        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * Berapa kartu yang ditawarkan sebagai reward setelah combat.
     */
    static rewardCardCount(isBoss = false, isElite = false) {
        if (isBoss)  return 4;
        if (isElite) return 3;
        return 3;
    }

    /**
     * Hitung EXP yang didapat setelah combat.
     */
    static calcExp(floor, isBoss = false, isElite = false) {
        const base    = 10 + floor * 2;
        const typeExp = isBoss ? 5 : isElite ? 2 : 1;
        return Math.round(base * typeExp);
    }

    /**
     * Hitung berapa HP yang di-heal di Rest Site.
     */
    static restHealAmount(hpMax) {
        return Math.floor(hpMax * 0.30);
    }

    // ── Equipment Drop ────────────────────────────────────────

    /**
     * Hitung chance drop equipment (0.0 - 1.0).
     * Combat biasa: 20% | Elite: 55% | Boss: 100%
     * Naik ~2% per zona, +5% per curse level di atas 1.
     *
     * @param {number}  zone
     * @param {number}  curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {number} chance 0.0–1.0
     */
    static equipmentDropChance(zone, curseLevel = 1, isBoss = false, isElite = false) {
        if (isBoss) return 1.0;

        const base       = isElite ? 0.55 : 0.20;
        const zoneBonus  = (zone - 1) * 0.02;           // +2% per zona
        const curseBonus = (curseLevel - 1) * 0.05;     // +5% per curse level
        return Math.min(1.0, base + zoneBonus + curseBonus);
    }

    /**
     * Tentukan berapa item equipment yang di-drop.
     * Combat biasa: 1 | Elite: 1-2 | Boss: 2-3
     *
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {number}
     */
    static equipmentDropCount(isBoss = false, isElite = false) {
        if (isBoss)  return Math.random() < 0.5 ? 3 : 2;
        if (isElite) return Math.random() < 0.4 ? 2 : 1;
        return 1;
    }

    /**
     * Roll rarity khusus untuk equipment drop.
     * Sedikit lebih dermawan dari card rarity karena equipment lebih jarang drop.
     *
     * Tabel base per zona (index 0 = zona 1):
     *   Combat biasa → common/uncommon dominan
     *   Elite        → uncommon/rare naik
     *   Boss         → rare/epic dijamin naik
     *
     * @param {number}  zone
     * @param {number}  curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {string} rarity string
     */
    static rollEquipmentRarity(zone, curseLevel = 1, isBoss = false, isElite = false) {
        const zoneIdx = Math.min(zone - 1, 9);

        // Base weights dari zona (sama seperti card)
        let [c, u, r, e, l] = [...RARITY_WEIGHTS_BY_ZONE[zoneIdx]];

        // Boss: geser sangat ke atas
        if (isBoss) {
            c = 0; u = 10; r = 40; e = 35; l = 15;
        }
        // Elite: geser sedang ke atas
        else if (isElite) {
            c = Math.max(0, c - 20);
            u = u + 10;
            r = r + 8;
            e = e + 2;
        }

        // Curse level bonus (sama seperti rollRarity)
        const bonus = (curseLevel - 1) * 5;
        c = Math.max(0, c - bonus);
        r = r + Math.floor(bonus * 0.6);
        e = e + Math.floor(bonus * 0.4);

        const rarities = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY];
        const pool = [];
        [c, u, r, e, l].forEach((w, i) => {
            for (let j = 0; j < Math.max(0, w); j++) pool.push(rarities[i]);
        });

        if (pool.length === 0) return RARITY.COMMON;
        return pool[Math.floor(Math.random() * pool.length)];
    }
}