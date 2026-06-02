// ============================================================
// entities/Pet.js — class pet (passive buff saja)
// Pet tidak aktif di combat. Mereka kasih passive buff
// permanen selama run — diapply saat CombatSystem.start()
//
// Passive types:
//   stat_bonus    → +X ke stat tertentu (hp_max, dodge, dll)
//   gold_bonus    → +X% gold drop
//   damage_bonus  → +X% damage tipe tertentu
//   card_draw     → +X kartu di hand awal combat
//   shop_discount → -X% harga shop
//   status_start  → combat mulai dengan 1 status effect
//   see_intent    → lihat intent musuh dari turn 1
//   passive_fn    → logic custom via fungsi
// ============================================================

export class Pet {

    /**
     * @param {object} data — dari pets/index.js
     */
    constructor(data) {
        this.id          = data.id;
        this.name        = data.name;
        this.rarity      = data.rarity   || 'common';
        this.element     = data.element  || 'kodama';
        this.description = data.description || '';
        this.flavorText  = data.flavorText  || '';

        // Passive definition — array of { type, ...params }
        this.passives    = data.passives || [];

        // Fungsi custom kalau passive terlalu kompleks untuk didescribe
        this._passiveFn  = data.passiveFn || null;
    }

    // ── Apply Passives ────────────────────────────────────────

    /**
     * Apply semua passive ke player di awal combat.
     * Dipanggil dari CombatSystem.start().
     *
     * Return array events untuk ditampilkan di UI (opsional).
     *
     * @param {object}   player
     * @param {object}   context  — { floor, zone, isBoss, isElite }
     * @returns {object[]} events
     */
    applyPassives(player, context = {}) {
        const events = [];

        for (const passive of this.passives) {
            const evt = this._applyOne(passive, player, context);
            if (evt) events.push(evt);
        }

        if (this._passiveFn) {
            const extra = this._passiveFn(player, context, this);
            if (Array.isArray(extra)) events.push(...extra);
        }

        return events;
    }

    _applyOne(passive, player, context) {
        switch (passive.type) {

            // +X ke stat (hp_max, mp_max, dodge, crit, dll)
            case 'stat_bonus': {
                const key = passive.stat;
                if (player.stats && player.stats[key] !== undefined) {
                    player.stats[key] += passive.value;
                    // Kalau hp_max naik, HP ikut naik
                    if (key === 'hp_max') {
                        player.hp = Math.min(player.hp + passive.value, player.stats['hp_max']);
                    }
                }
                return { type: 'pet_passive', petId: this.id, passiveType: 'stat_bonus', stat: key, value: passive.value };
            }

            // +X kartu di hand awal — set flag, dipakai DeckSystem.draw
            case 'card_draw': {
                player._extraDraw = (player._extraDraw || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'card_draw', value: passive.value };
            }

            // +X% damage tipe tertentu — set flag, dipakai CombatSystem
            case 'damage_bonus': {
                if (!player._petDamageBonus) player._petDamageBonus = {};
                const dmgType = passive.damageType || 'all';
                player._petDamageBonus[dmgType] = (player._petDamageBonus[dmgType] || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'damage_bonus', dmgType, value: passive.value };
            }

            // Mulai combat dengan status tertentu di musuh
            case 'status_start': {
                // Flag — CombatSystem apply ke semua monster saat start
                if (!player._petStatusStart) player._petStatusStart = [];
                player._petStatusStart.push({ ...passive.status });
                return { type: 'pet_passive', petId: this.id, passiveType: 'status_start', status: passive.status };
            }

            // Lihat intent musuh dari turn 1 (flag saja)
            case 'see_intent': {
                player._petSeeIntent = true;
                return { type: 'pet_passive', petId: this.id, passiveType: 'see_intent' };
            }

            // Block tidak hilang antar turn
            case 'block_persist': {
                player._petBlockPersist = true;
                return { type: 'pet_passive', petId: this.id, passiveType: 'block_persist' };
            }

            // Status effect damage bonus (misal: semua Burn +50%)
            case 'status_dmg_bonus': {
                if (!player._petStatusDmgBonus) player._petStatusDmgBonus = {};
                player._petStatusDmgBonus[passive.status] =
                    (player._petStatusDmgBonus[passive.status] || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'status_dmg_bonus', status: passive.status, value: passive.value };
            }

            // Heal X HP tiap turn (flag — diproses di _tickPlayerStatus)
            case 'regen': {
                player._petRegen = (player._petRegen || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'regen', value: passive.value };
            }

            // +X% gold drop — flag untuk LootSystem
            case 'gold_bonus': {
                player._petGoldBonus = (player._petGoldBonus || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'gold_bonus', value: passive.value };
            }

            // -X% shop price — flag untuk ShopScene
            case 'shop_discount': {
                player._petShopDiscount = (player._petShopDiscount || 0) + passive.value;
                return { type: 'pet_passive', petId: this.id, passiveType: 'shop_discount', value: passive.value };
            }

            default:
                return null;
        }
    }

    // ── Reset ─────────────────────────────────────────────────

    /**
     * Reset flag combat dari pet — dipanggil di _resetAllTempBuffs.
     * Perlu dipisah dari apply supaya bisa reset tanpa re-apply.
     */
    static resetPetFlags(player) {
        player._extraDraw        = 0;
        player._petDamageBonus   = {};
        player._petStatusStart   = [];
        player._petSeeIntent     = false;
        player._petBlockPersist  = false;
        player._petStatusDmgBonus = {};
        player._petRegen         = 0;
        // gold bonus dan shop discount TIDAK direset — berlaku sepanjang run
    }

    // ── Serialization ─────────────────────────────────────────

    toJSON() {
        return { id: this.id };
    }

    static fromJSON(saved, template) {
        return new Pet(template);
    }
}