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
import { getAllWeapons }    from '../data/weapons/index.js';
import { getAllArmors }     from '../data/armors/index.js';

export class LootSystem {

    /**
     * Generate semua loot setelah combat.
     * @param {object} options
     * @param {number}   options.floor
     * @param {number}   options.zone
     * @param {number}   options.curseLevel
     * @param {boolean}  options.isBoss
     * @param {boolean}  options.isElite
     * @param {object[]} options.monsters
     * @param {object[]} options.playerDeck
     * @returns {{ gold: number, cardChoices: object[], equipment: object[] }}
     */
    static generate({
        floor,
        zone,
        curseLevel = 1,
        isBoss     = false,
        isElite    = false,
        monsters   = [],
        playerDeck = [],
    }) {
        const gold        = this._rollGold(floor, curseLevel, isBoss, isElite, monsters);
        const cardChoices = this._rollCardChoices(zone, curseLevel, isBoss, isElite, playerDeck);
        const equipment   = this._rollEquipment(zone, curseLevel, isBoss, isElite);

        return { gold, cardChoices, equipment };
    }

    // ── Gold ──────────────────────────────────────────────────

    static _rollGold(floor, curseLevel, isBoss, isElite, monsters) {
        let total = 0;

        if (monsters.length > 0) {
            for (const monster of monsters) {
                const range = monster.lootTable?.gold || [5, 15];
                const base  = this._randInt(range[0], range[1]);
                total += ScalingSystem.scaleGold(base, floor, curseLevel, isBoss, isElite);
            }
        } else {
            const base = isBoss ? GOLD_BASE_BOSS : isElite ? GOLD_BASE_ELITE : GOLD_BASE_COMBAT;
            total = ScalingSystem.scaleGold(base, floor, curseLevel, isBoss, isElite);
        }

        return total;
    }

    // ── Card Choices ──────────────────────────────────────────

    static _rollCardChoices(zone, curseLevel, isBoss, isElite, playerDeck = []) {
        const count    = ScalingSystem.rewardCardCount(isBoss, isElite);
        const allCards = getAllCardsArray();

        const ownedIds = new Set(playerDeck.map(c => c.id));

        const ownedUpgradeIds = new Set(
            playerDeck
                .filter(c => c.upgradedId)
                .map(c => c.upgradedId)
        );

        const pool = allCards.filter(c => {
            if (c.isUpgraded) return false;
            if (ownedUpgradeIds.has(c.id)) return false;
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

    // ── Equipment Drop ────────────────────────────────────────

    /**
     * Roll apakah ada equipment yang drop dan item apa.
     * Return array kosong kalau tidak drop.
     *
     * Logic:
     * 1. Cek chance drop — kalau tidak lolos, return []
     * 2. Tentukan berapa item yang drop (1/2/3 tergantung tipe combat)
     * 3. Tiap item: roll rarity → pilih weapon atau armor → pilih item sesuai rarity
     *
     * @param {number}  zone
     * @param {number}  curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @returns {object[]} array item equipment
     */
    static _rollEquipment(zone, curseLevel, isBoss, isElite) {
        const chance = ScalingSystem.equipmentDropChance(zone, curseLevel, isBoss, isElite);
        if (Math.random() > chance) return [];

        const count   = ScalingSystem.equipmentDropCount(isBoss, isElite);
        const results = [];
        const usedIds = new Set();

        for (let i = 0; i < count; i++) {
            const item = this._pickOneEquipment(zone, curseLevel, isBoss, isElite, usedIds);
            if (item) {
                results.push(item);
                usedIds.add(item.id);
            }
        }

        return results;
    }

    /**
     * Pilih satu item equipment.
     * 50% chance weapon, 50% chance armor — tapi kalau rarity tinggi
     * di zona awal, armor lebih sering (karena lebih banyak jenisnya).
     *
     * @param {number}  zone
     * @param {number}  curseLevel
     * @param {boolean} isBoss
     * @param {boolean} isElite
     * @param {Set}     usedIds   — item yang sudah dipilih di iterasi ini
     * @returns {object|null}
     */
    static _pickOneEquipment(zone, curseLevel, isBoss, isElite, usedIds = new Set()) {
        const rarity  = ScalingSystem.rollEquipmentRarity(zone, curseLevel, isBoss, isElite);

        // Gabung semua item (weapon + armor) jadi satu pool
        const allWeapons = getAllWeapons();
        const allArmors  = getAllArmors();
        const allItems   = [...allWeapons, ...allArmors];

        // Filter sesuai rarity dan belum dipakai
        const pool = allItems.filter(item =>
            item.rarity === rarity && !usedIds.has(item.id)
        );

        // Fallback ke satu rarity di bawahnya kalau pool kosong
        if (pool.length === 0) {
            const fallbackRarities = [
                RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE,
                RARITY.EPIC, RARITY.LEGENDARY,
            ];
            const idx = fallbackRarities.indexOf(rarity);
            for (let i = idx - 1; i >= 0; i--) {
                const fallback = allItems.filter(item =>
                    item.rarity === fallbackRarities[i] && !usedIds.has(item.id)
                );
                if (fallback.length > 0) {
                    return fallback[Math.floor(Math.random() * fallback.length)];
                }
            }
            return null;
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ── Treasure Room ─────────────────────────────────────────

    /**
     * Generate loot untuk Treasure Room (tanpa combat).
     * Selalu dapat 1 kartu langsung + ada chance dapat 1 equipment.
     */
    static generateTreasure({ zone, curseLevel = 1 }) {
        const allCards = getAllCardsArray().filter(c => !c.isUpgraded);

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

        // Treasure room: 40% chance dapat bonus equipment juga
        const equipment = [];
        if (Math.random() < 0.40) {
            const item = this._pickOneEquipment(zone, curseLevel, false, false);
            if (item) equipment.push(item);
        }

        return { card, gold: 0, equipment };
    }

    // ── Helpers ───────────────────────────────────────────────

    static _randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}