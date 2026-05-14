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
     * @param {number} baseStat
     * @param {number} floor
     * @param {number} curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {number}
     */
    static scaleMonsterStat(baseStat, floor, curseLevel = 1, isBoss = false, isElite = false) {
        const multiplier = this.getMonsterMultiplier(floor, curseLevel, isBoss, isElite);
        return Math.round(baseStat * multiplier);
    }

    /**
     * Hitung gold reward setelah combat.
     * @param {number} baseGold
     * @param {number} floor
     * @param {number} curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {number}
     */
    static scaleGold(baseGold, floor, curseLevel = 1, isBoss = false, isElite = false) {
        const floorBonus  = 1 + (floor - 1) * 0.05;  // +5% per lantai
        const curseBonus  = CURSE_REWARD_MULTIPLIER[curseLevel] || 1;
        const typeBonus   = isBoss ? 4 : isElite ? 2 : 1;

        return Math.round(baseGold * floorBonus * curseBonus * typeBonus);
    }

    /**
     * Tentukan rarity item drop berdasarkan zona + curse level.
     * @param {number} zone       - 1-10
     * @param {number} curseLevel - 1-5
     * @returns {string} rarity string
     */
    static rollRarity(zone, curseLevel = 1) {
        // Curse level tinggi geser weight ke rarity lebih tinggi
        const zoneIdx   = Math.min(zone - 1, 9);
        const weights   = [...RARITY_WEIGHTS_BY_ZONE[zoneIdx]];

        // Curse level bonus: geser 5% dari common ke rare+ per level di atas 1
        const bonus = (curseLevel - 1) * 5;
        weights[0] = Math.max(0, weights[0] - bonus);   // kurangi common
        weights[2] = weights[2] + Math.floor(bonus * 0.6); // tambah rare
        weights[3] = weights[3] + Math.floor(bonus * 0.4); // tambah epic

        // Build pool
        const rarities = [RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC, RARITY.LEGENDARY];
        const pool = [];
        weights.forEach((w, i) => {
            for (let j = 0; j < w; j++) pool.push(rarities[i]);
        });

        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * Berapa kartu yang ditawarkan sebagai reward setelah combat.
     * Boss selalu kasih lebih banyak pilihan.
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
     * @param {number} hpMax
     * @returns {number}
     */
    static restHealAmount(hpMax) {
        return Math.floor(hpMax * 0.30);  // 30% HP max
    }
}