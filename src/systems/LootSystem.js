// ============================================================
// LootSystem.js — generate loot setelah combat selesai
// Dipanggil CombatScene saat player menang
// ============================================================

import {
    GOLD_BASE_COMBAT,
    GOLD_BASE_ELITE,
    GOLD_BASE_BOSS,
    RARITY,
} from '../config/constants.js';
import { ScalingSystem }   from './ScalingSystem.js';
import { getAllCardsArray } from '../data/cards/index.js';

export class LootSystem {

    /**
     * Generate semua loot setelah combat.
     * @param {object} options
     * @param {number} options.floor
     * @param {number} options.zone
     * @param {number} options.curseLevel
     * @param {boolean} options.isBoss
     * @param {boolean} options.isElite
     * @param {object[]} options.monsters   - monster yang dikalahkan
     * @returns {{ gold: number, cardChoices: object[] }}
     */
    static generate({ floor, zone, curseLevel = 1, isBoss = false, isElite = false, monsters = [], playerDeck = [] }) {
        const gold        = this._rollGold(floor, curseLevel, isBoss, isElite, monsters);
        const cardChoices = this._rollCardChoices(zone, curseLevel, isBoss, isElite, playerDeck);

        return { gold, cardChoices };
    }

    // ── Gold ──────────────────────────────────────────────────

    /**
     * Hitung total gold dari semua monster yang mati.
     */
    static _rollGold(floor, curseLevel, isBoss, isElite, monsters) {
        let total = 0;

        if (monsters.length > 0) {
            // Ambil dari lootTable tiap monster
            for (const monster of monsters) {
                const range = monster.lootTable?.gold || [5, 15];
                const base  = this._randInt(range[0], range[1]);
                total += ScalingSystem.scaleGold(base, floor, curseLevel, isBoss, isElite);
            }
        } else {
            // Fallback kalau tidak ada data monster
            const base = isBoss ? GOLD_BASE_BOSS : isElite ? GOLD_BASE_ELITE : GOLD_BASE_COMBAT;
            total = ScalingSystem.scaleGold(base, floor, curseLevel, isBoss, isElite);
        }

        return total;
    }

    // ── Card Choices ──────────────────────────────────────────

    /**
     * Pilihkan beberapa kartu untuk ditawarkan sebagai reward.
     * Rarity kartu disesuaikan zona + curse level.
     */
    static _rollCardChoices(zone, curseLevel, isBoss, isElite, playerDeck = []) {
        const count    = ScalingSystem.rewardCardCount(isBoss, isElite);
        const allCards = getAllCardsArray();

        // Kumpulkan ID kartu yang sudah dimiliki player (semua versi)
        const ownedIds = new Set(playerDeck.map(c => c.id));

        // Kumpulkan upgradedId dari kartu yang sudah dimiliki
        // Kalau player sudah punya 'tebas_tajam' (upgrade dari tebas_biasa),
        // jangan tawarkan 'tebas_biasa' lagi
        const ownedUpgradeIds = new Set(
            playerDeck
                .filter(c => c.upgradedId)
                .map(c => c.upgradedId)
        );

        // Filter pool:
        // 1. Kartu yang sudah di-upgrade (isUpgraded) tidak masuk pool
        // 2. Kartu yang versi upgrade-nya sudah dimiliki tidak masuk pool
        // 3. Kartu yang sudah dimiliki tetap bisa muncul (boleh double)
        const pool = allCards.filter(c => {
            if (c.isUpgraded) return false;           // jangan tawarkan versi upgrade
            if (ownedUpgradeIds.has(c.id)) return false; // versi upgrade-nya sudah ada
            return true;
        });

        const choices = [];
        const used    = new Set();

        let attempts = 0;
        while (choices.length < count && attempts < 100) {
            attempts++;
            const rarity  = ScalingSystem.rollRarity(zone, curseLevel);
            const matches = pool.filter(c =>
                (c.rarity || RARITY.COMMON) === rarity && !used.has(c.id)
            );

            const source = matches.length > 0
                ? matches
                : pool.filter(c => !used.has(c.id));

            if (source.length === 0) break;

            const picked = source[Math.floor(Math.random() * source.length)];
            choices.push(picked);
            used.add(picked.id);
        }

        return choices;
    }

    // ── Treasure Room ─────────────────────────────────────────

    /**
     * Generate loot untuk Treasure Room (tanpa combat).
     * Selalu dapat 1 kartu langsung, rarity lebih tinggi dari combat biasa.
     */
    static generateTreasure({ zone, curseLevel = 1 }) {
        const allCards = getAllCardsArray().filter(c => !c.isUpgraded);

        // Treasure selalu minimal Uncommon
        const rarities = [RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC];
        const weights  = [50, 35, 15];
        const pool     = [];
        weights.forEach((w, i) => {
            for (let j = 0; j < w; j++) pool.push(rarities[i]);
        });

        const rarity  = pool[Math.floor(Math.random() * pool.length)];
        const matches = allCards.filter(c => (c.rarity || RARITY.COMMON) === rarity);
        const source  = matches.length > 0 ? matches : allCards;
        const card    = source[Math.floor(Math.random() * source.length)];

        return { card, gold: 0 };
    }

    // ── Helpers ───────────────────────────────────────────────

    static _randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}