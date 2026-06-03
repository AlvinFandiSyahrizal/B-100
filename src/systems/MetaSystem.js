// ============================================================
// systems/MetaSystem.js — logic meta-progression
// Dipanggil saat:
//   1. Game over → recordRun, checkNewUnlocks, simpan ke meta
//   2. New run start → applyRelics ke player baru
// ============================================================

import { SaveSystem }           from '../storage/SaveSystem.js';
import { getRelic, getAllRelics, checkNewUnlocks } from '../data/relics/index.js';
import { getAllCardsArray }      from '../data/cards/index.js';

export class MetaSystem {

    // ── Game Over ─────────────────────────────────────────────

    /**
     * Dipanggil saat player mati.
     * Rekam hasil run, cek unlock relic baru, simpan meta.
     *
     * @param {object} runResult
     * @param {number} runResult.floor
     * @param {number} runResult.zone
     * @param {number} runResult.curseLevel
     * @param {number} runResult.kills
     * @param {boolean} runResult.won
     * @param {boolean} runResult.defeatedBoss
     * @param {boolean} runResult.defeatedMiniBoss
     * @param {object[]} runResult.defeatedBossIds
     * @param {object}  runResult.playerData
     *
     * @returns {{ meta: object, newRelics: string[] }}
     */
    static processGameOver(runResult) {
        const meta = SaveSystem.loadMeta();

        // Update stats
        meta.totalRuns   = (meta.totalRuns   || 0) + 1;
        meta.totalKills  = (meta.totalKills  || 0) + (runResult.kills || 0);
        meta.ownedRelics = meta.ownedRelics  || [];

        if ((runResult.floor || 0) > (meta.bestFloor || 0)) {
            meta.bestFloor = runResult.floor;
        }

        if (runResult.defeatedBoss) {
            meta.totalBossKills = (meta.totalBossKills || 0) + 1;
            const bossIds = runResult.defeatedBossIds || [];
            meta.defeatedBosses = [...new Set([...(meta.defeatedBosses || []), ...bossIds])];
        }

        if (runResult.defeatedMiniBoss) {
            meta.totalMiniBossKills = (meta.totalMiniBossKills || 0) + 1;
        }

        // Update bestiary dari playerData (monsters yang pernah ditemui)
        if (runResult.playerData?.encounteredMonsters) {
            meta.bestiary = meta.bestiary || {};
            for (const id of runResult.playerData.encounteredMonsters) {
                if (!meta.bestiary[id]) meta.bestiary[id] = { firstSeen: Date.now(), kills: 0 };
                meta.bestiary[id].kills++;
            }
        }

        // Cek relic baru
        const newRelics = checkNewUnlocks(meta);
        for (const id of newRelics) {
            if (!meta.ownedRelics.includes(id)) {
                meta.ownedRelics.push(id);
            }
        }

        // Simpan
        SaveSystem.saveMeta(meta);
        SaveSystem.clearRun();

        return { meta, newRelics };
    }

    // ── New Run ───────────────────────────────────────────────

    /**
     * Apply semua relic yang dimiliki ke player baru.
     * Dipanggil di CharacterSelectScene sebelum scene.start().
     *
     * @param {object} player   — Player instance
     * @param {object} meta     — dari SaveSystem.loadMeta()
     * @returns {string[]}      — id relic yang berhasil diapply
     */
    static applyRelics(player, meta) {
        const ownedIds = meta?.ownedRelics || [];
        const applied  = [];

        for (const id of ownedIds) {
            const relic = getRelic(id);
            if (!relic) continue;

            const ok = this._applyOneRelic(relic, player, meta);
            if (ok) applied.push(id);
        }

        // Simpan relic aktif ke player supaya bisa ditampilkan di UI
        player.activeRelics = ownedIds;

        return applied;
    }

    /**
     * Apply satu relic ke player.
     * @returns {boolean} berhasil atau tidak
     */
    static _applyOneRelic(relic, player, meta) {
        const eff = relic.effect;
        if (!eff) return false;

        // Handle multi-effect
        if (eff.type === 'multi') {
            for (const e of (eff.effects || [])) {
                this._applySingleEffect(e, player, meta);
            }
            return true;
        }

        return this._applySingleEffect(eff, player, meta);
    }

    static _applySingleEffect(eff, player, meta) {
        switch (eff.type) {

            // Bonus stat langsung ke baseStats
            case 'stat_bonus': {
                const key = eff.stat;
                if (['str','int','agi'].includes(key)) {
                    player.baseStats[key] = (player.baseStats[key] || 0) + eff.value;
                    // Recalc stats setelah baseStats berubah
                    player.stats = player._calculateStats();
                    player.hp    = Math.min(player.hp, player.stats['hp_max']);
                } else if (key === 'hp') {
                    // Bonus HP flat — tambah langsung ke hp_max
                    player.stats['hp_max'] = (player.stats['hp_max'] || 0) + eff.value;
                    player.hp = Math.min(player.hp + eff.value, player.stats['hp_max']);
                } else {
                    player.stats[key] = (player.stats[key] || 0) + eff.value;
                }
                return true;
            }

            // Bonus HP % dari max
            case 'hp_bonus_percent': {
                const bonus = Math.floor((player.stats['hp_max'] || 100) * eff.value / 100);
                player.hp   = Math.min(player.hp + bonus, player.stats['hp_max'] + bonus);
                player.stats['hp_max'] += bonus;
                return true;
            }

            // Gold ekstra di awal run
            case 'start_gold': {
                player.gold = (player.gold || 0) + eff.value;
                return true;
            }

            // +X kartu di hand awal setiap combat — simpan sebagai flag
            case 'card_draw': {
                player._relicExtraDraw = (player._relicExtraDraw || 0) + eff.value;
                return true;
            }

            // Bonus damage — simpan sebagai flag, dipakai CombatSystem
            case 'damage_bonus': {
                if (!player._relicDamageBonus) player._relicDamageBonus = {};
                const t = eff.damageType || 'all';
                player._relicDamageBonus[t] = (player._relicDamageBonus[t] || 0) + eff.value;
                return true;
            }

            // Bonus gold drop — flag untuk LootSystem
            case 'gold_bonus': {
                player._relicGoldBonus = (player._relicGoldBonus || 0) + eff.value;
                return true;
            }

            // Diskon shop — flag untuk ShopScene
            case 'shop_discount': {
                player._relicShopDiscount = (player._relicShopDiscount || 0) + eff.value;
                return true;
            }

            // Mulai dengan status effect
            case 'start_status': {
                if (!player._relicStartStatuses) player._relicStartStatuses = [];
                player._relicStartStatuses.push({ ...eff.status });
                return true;
            }

            // Mulai dengan 1 kartu random sesuai rarity
            case 'start_card': {
                const pool = getAllCardsArray().filter(c =>
                    !c.isUpgraded && (c.rarity || 'common') === (eff.rarity || 'common')
                );
                if (pool.length > 0) {
                    const card = pool[Math.floor(Math.random() * pool.length)];
                    player.deck.push({ ...card });
                }
                return true;
            }

            default:
                return false;
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Ambil semua relic yang dimiliki player sebagai objek lengkap.
     * Untuk ditampilkan di RelicDisplay.
     */
    static getOwnedRelics(meta) {
        return (meta?.ownedRelics || [])
            .map(id => getRelic(id))
            .filter(Boolean);
    }

    /**
     * Berapa total relic yang sudah di-unlock.
     */
    static getUnlockProgress() {
        const meta  = SaveSystem.loadMeta();
        const owned = (meta.ownedRelics || []).length;
        const total = getAllRelics().length;
        return { owned, total };
    }

    /**
     * Reset semua meta (untuk debug / hard reset).
     */
    static resetMeta() {
        SaveSystem.saveMeta(SaveSystem._defaultMeta());
        console.log('[MetaSystem] Meta di-reset.');
    }
}