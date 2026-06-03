// ============================================================
// data/relics/index.js — data semua Relic (Jimat)
// Relic didapat saat game over, berlaku permanen antar run
// Tiap relic punya passive yang diapply saat run baru dimulai
//
// Cara dapat:
//   - Game over di lantai tertentu → unlock relic tier rendah
//   - Game over setelah kalahkan boss → unlock relic tier tinggi
//   - Akumulasi total run → unlock relic khusus
// ============================================================

export const RELICS = {

    // ── TIER 1 — Unlock dari run pertama ─────────────────────

    jimat_pemula: {
        id:          'jimat_pemula',
        name:        'Jimat Pemula',
        tier:        1,
        icon:        '🪬',
        description: 'HP awal +10.',
        flavorText:  '"Setiap petualang butuh sedikit keberuntungan."',
        unlockCondition: { type: 'any_run', value: 1 },
        effect: { type: 'stat_bonus', stat: 'hp', value: 10 },
    },

    batu_keberanian: {
        id:          'batu_keberanian',
        name:        'Batu Keberanian',
        tier:        1,
        icon:        '🪨',
        description: 'Mulai setiap run dengan 20 gold ekstra.',
        flavorText:  '"Modal kecil untuk perjalanan besar."',
        unlockCondition: { type: 'any_run', value: 1 },
        effect: { type: 'start_gold', value: 20 },
    },

    gelang_kayu: {
        id:          'gelang_kayu',
        name:        'Gelang Kayu',
        tier:        1,
        icon:        '📿',
        description: '+1 kartu di hand awal setiap combat.',
        flavorText:  '"Dibuat dari kayu pohon tua di pintu dungeon."',
        unlockCondition: { type: 'reach_floor', value: 3 },
        effect: { type: 'card_draw', value: 1 },
    },

    // ── TIER 2 — Unlock dari mencapai lantai tertentu ────────

    taring_kappa: {
        id:          'taring_kappa',
        name:        'Taring Kappa',
        tier:        2,
        icon:        '🦷',
        description: 'DEF +3 permanen.',
        flavorText:  '"Diambil dari Kappa pertama yang kamu kalahkan."',
        unlockCondition: { type: 'reach_floor', value: 5 },
        effect: { type: 'stat_bonus', stat: 'def', value: 3 },
    },

    sisik_naga: {
        id:          'sisik_naga',
        name:        'Sisik Naga',
        tier:        2,
        icon:        '🐉',
        description: 'Damage fisik +5%.',
        flavorText:  '"Keras seperti baja, ringan seperti angin."',
        unlockCondition: { type: 'reach_floor', value: 5 },
        effect: { type: 'damage_bonus', damageType: 'physical', value: 5 },
    },

    koin_tanuki: {
        id:          'koin_tanuki',
        name:        'Koin Tanuki',
        tier:        2,
        icon:        '🪙',
        description: 'Gold drop dari semua combat +15%.',
        flavorText:  '"Tanuki selalu tahu cara mencari keuntungan."',
        unlockCondition: { type: 'reach_floor', value: 7 },
        effect: { type: 'gold_bonus', value: 15 },
    },

    cermin_kitsune: {
        id:          'cermin_kitsune',
        name:        'Cermin Kitsune',
        tier:        2,
        icon:        '🪞',
        description: 'Dodge rate +5.',
        flavorText:  '"Bayangan yang kamu lihat bukan dirimu."',
        unlockCondition: { type: 'reach_floor', value: 7 },
        effect: { type: 'stat_bonus', stat: 'dodge', value: 5 },
    },

    // ── TIER 3 — Unlock dari kalahkan mini boss / boss ───────

    tanduk_oni: {
        id:          'tanduk_oni',
        name:        'Tanduk Oni',
        tier:        3,
        icon:        '👹',
        description: 'STR +3 permanen.',
        flavorText:  '"Kekuatan Oni mengalir ke tanganmu."',
        unlockCondition: { type: 'defeat_miniboss', value: 1 },
        effect: { type: 'stat_bonus', stat: 'str', value: 3 },
    },

    bulu_tengu: {
        id:          'bulu_tengu',
        name:        'Bulu Tengu',
        tier:        3,
        icon:        '🪶',
        description: 'AGI +3 permanen.',
        flavorText:  '"Secepat angin, seringan bulu."',
        unlockCondition: { type: 'defeat_miniboss', value: 1 },
        effect: { type: 'stat_bonus', stat: 'agi', value: 3 },
    },

    kristal_ryuu: {
        id:          'kristal_ryuu',
        name:        'Kristal Ryuu',
        tier:        3,
        icon:        '💎',
        description: 'INT +3 dan damage magic +5%.',
        flavorText:  '"Terbentuk dari air mata naga."',
        unlockCondition: { type: 'defeat_boss', value: 1 },
        effect: { type: 'multi', effects: [
            { type: 'stat_bonus', stat: 'int', value: 3 },
            { type: 'damage_bonus', damageType: 'magic', value: 5 },
        ]},
    },

    magatama_kutukan: {
        id:          'magatama_kutukan',
        name:        'Magatama Kutukan',
        tier:        3,
        icon:        '⚫',
        description: 'Mulai setiap run dengan 1 status Fortify (3 giliran).',
        flavorText:  '"Kutukan yang justru melindungi."',
        unlockCondition: { type: 'defeat_boss', value: 1 },
        effect: { type: 'start_status', status: { type: 'fortify', value: 5, duration: 3 } },
    },

    // ── TIER 4 — Unlock dari pencapaian khusus ───────────────

    jimat_ronin: {
        id:          'jimat_ronin',
        name:        'Jimat Ronin',
        tier:        4,
        icon:        '⚔️',
        description: 'Semua stat +2 permanen.',
        flavorText:  '"Ronin sejati tidak pernah berhenti berlatih."',
        unlockCondition: { type: 'total_runs', value: 5 },
        effect: { type: 'multi', effects: [
            { type: 'stat_bonus', stat: 'str', value: 2 },
            { type: 'stat_bonus', stat: 'int', value: 2 },
            { type: 'stat_bonus', stat: 'agi', value: 2 },
        ]},
    },

    arwah_pendahulu: {
        id:          'arwah_pendahulu',
        name:        'Arwah Pendahulu',
        tier:        4,
        icon:        '👻',
        description: 'Mulai setiap run dengan HP 110% dari max.',
        flavorText:  '"Semangat mereka yang gugur mengisimu."',
        unlockCondition: { type: 'total_runs', value: 10 },
        effect: { type: 'hp_bonus_percent', value: 10 },
    },

    buku_yokai: {
        id:          'buku_yokai',
        name:        'Buku Yokai',
        tier:        4,
        icon:        '📖',
        description: 'Mulai setiap run dengan 1 kartu random rarity Rare.',
        flavorText:  '"Pengetahuan adalah senjata terkuat."',
        unlockCondition: { type: 'bestiary_entries', value: 5 },
        effect: { type: 'start_card', rarity: 'rare' },
    },

    kunci_dungeon: {
        id:          'kunci_dungeon',
        name:        'Kunci Dungeon',
        tier:        4,
        icon:        '🗝️',
        description: 'Harga shop -10% di semua run.',
        flavorText:  '"Ada yang selalu membuka jalan bagimu."',
        unlockCondition: { type: 'reach_floor', value: 20 },
        effect: { type: 'shop_discount', value: 10 },
    },
};

// ── Helpers ───────────────────────────────────────────────────

export function getRelic(id)   { return RELICS[id] || null; }
export function getAllRelics()  { return Object.values(RELICS); }

/**
 * Cek relic mana yang seharusnya unlock berdasarkan kondisi.
 * @param {object} meta — dari SaveSystem.loadMeta()
 * @returns {string[]} array id relic yang baru unlock
 */
export function checkNewUnlocks(meta) {
    const alreadyOwned = new Set(meta.ownedRelics || []);
    const newUnlocks   = [];

    for (const relic of getAllRelics()) {
        if (alreadyOwned.has(relic.id)) continue;

        const cond = relic.unlockCondition;
        let unlocked = false;

        switch (cond.type) {
            case 'any_run':
                unlocked = (meta.totalRuns || 0) >= cond.value;
                break;
            case 'reach_floor':
                unlocked = (meta.bestFloor || 0) >= cond.value;
                break;
            case 'defeat_miniboss':
                unlocked = (meta.totalMiniBossKills || 0) >= cond.value;
                break;
            case 'defeat_boss':
                unlocked = (meta.totalBossKills || 0) >= cond.value;
                break;
            case 'total_runs':
                unlocked = (meta.totalRuns || 0) >= cond.value;
                break;
            case 'bestiary_entries':
                unlocked = Object.keys(meta.bestiary || {}).length >= cond.value;
                break;
        }

        if (unlocked) newUnlocks.push(relic.id);
    }

    return newUnlocks;
}