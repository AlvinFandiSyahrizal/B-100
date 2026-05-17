// ============================================================
// special_cards.js — kartu spesial: curse, kondisional, yokai
// Kartu-kartu ini lebih langka dan punya efek unik
// ============================================================

import { CARD_TYPE, DMG_TYPE, STATUS, CARD_RARITY } from '../../config/constants.js';

export const SPECIAL_CARDS = {

    // ── Curse Cards — merugikan tapi ada benefit ──────────────

    kutukan_darah: {
        id:          'kutukan_darah',
        name:        'Kutukan Darah',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        isCurse:     true,
        curseEffect: { damage: 3 },          // kena 3 dmg tiap turn
        curseBenefit: { costReduction: 1 },  // semua kartu cost -1
        spriteKey:   'card_attack',
        description: 'KUTUKAN: Kena 3 damage tiap turn. BENEFIT: Semua kartu cost -1.',
        flavorText:  '"Ada harga untuk setiap kekuatan."',
    },

    perjanjian_iblis: {
        id:          'perjanjian_iblis',
        name:        'Perjanjian Iblis',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        0,
        isCurse:     true,
        curseEffect: { hpMaxReduce: 20 },    // HP max -20%
        curseBenefit: { extraDraw: 2 },       // tarik 2 kartu ekstra tiap turn
        spriteKey:   'card_attack',
        description: 'KUTUKAN: HP max -20%. BENEFIT: Tarik 2 kartu ekstra tiap turn.',
        flavorText:  '"Kekuatan datang dengan pengorbanan."',
    },

    keserakahan: {
        id:          'keserakahan',
        name:        'Keserakahan',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        isCurse:     true,
        curseEffect: { noHeal: true },       // tidak bisa heal selama combat
        curseBenefit: { damageBonus: 50 },   // damage +50%
        spriteKey:   'card_attack',
        description: 'KUTUKAN: Tidak bisa heal. BENEFIT: Semua damage +50%.',
        flavorText:  '"Serahkan segalanya, dapatkan segalanya."',
    },

    pengorbanan: {
        id:          'pengorbanan',
        name:        'Pengorbanan',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        sacrificeCard: true,  // buang 1 kartu random dari tangan
        nextCardFree:  true,  // kartu berikutnya gratis
        spriteKey:   'card_support',
        description: 'Buang 1 kartu random dari tangan. Kartu berikutnya cost 0.',
        flavorText:  '"Lepaskan satu, dapatkan satu."',
    },

    // ── Kartu Reaksi/Trigger ──────────────────────────────────

    balas_dendam: {
        id:          'balas_dendam',
        name:        'Balas Dendam',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        reactDamage: true,    // damage = 2x damage terakhir yang diterima
        requiresDamageTaken: true,
        upgradedId:  'balas_dendam_plus',
        spriteKey:   'card_attack',
        description: 'Hanya bisa dipakai setelah kena damage. Balik 2x damage yang diterima.',
        flavorText:  '"Tiap luka adalah bahan bakar."',
    },

    balas_dendam_plus: {
        id:          'balas_dendam_plus',
        name:        'Balas Dendam+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        reactDamage: true,
        reactMultiplier: 3,   // 3x bukan 2x
        requiresDamageTaken: true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Balik 3x damage yang diterima.',
        flavorText:  '"Amarah yang terkontrol adalah senjata terkuat."',
    },

    tunda: {
        id:          'tunda',
        name:        'Tunda',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        skipTurn:    true,    // skip turn ini
        nextTurnEnergy: 2,    // giliran berikutnya dapat 2 energi ekstra
        upgradedId:  'tunda_plus',
        spriteKey:   'card_support',
        description: 'Skip turn ini. Giliran berikutnya dapat 2 energi ekstra.',
        flavorText:  '"Kadang mundur adalah strategi terbaik."',
    },

    tunda_plus: {
        id:          'tunda_plus',
        name:        'Tunda+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        skipTurn:    true,
        nextTurnEnergy: 3,
        nextTurnDraw:   1,    // bonus tarik 1 kartu juga
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Skip turn ini. Giliran berikutnya +3 energi dan tarik 1 kartu.',
        flavorText:  '"Kesabaran yang dibalas berlipat."',
    },

    // ── Kartu Kondisional ─────────────────────────────────────

    eksekusi: {
        id:          'eksekusi',
        name:        'Eksekusi',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        2,
        executeThreshold: 25,   // kalau HP musuh < 25%, langsung KO
        damage:      10,
        damageType:  DMG_TYPE.PHYSICAL,
        upgradedId:  'eksekusi_plus',
        spriteKey:   'card_attack',
        description: 'Jika HP musuh < 25%, langsung KO. Jika tidak, 10 damage.',
        flavorText:  '"Tidak ada belas kasihan di ujung pedang."',
    },

    eksekusi_plus: {
        id:          'eksekusi_plus',
        name:        'Eksekusi+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        executeThreshold: 35,   // threshold lebih tinggi
        damage:      10,
        damageType:  DMG_TYPE.PHYSICAL,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Jika HP musuh < 35%, langsung KO. Jika tidak, 10 damage.',
        flavorText:  '"Lebih cepat, lebih tepat."',
    },

    last_stand: {
        id:          'last_stand',
        name:        'Last Stand',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        0,
        lastStand:   true,      // hanya bisa dipakai kalau HP < 20%
        healPercent: 40,        // heal 40% HP max
        upgradedId:  'last_stand_plus',
        spriteKey:   'card_support',
        description: 'Hanya bisa dipakai saat HP < 20%. Heal 40% HP max.',
        flavorText:  '"Selama ada nafas, ada harapan."',
    },

    last_stand_plus: {
        id:          'last_stand_plus',
        name:        'Last Stand+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        0,
        lastStand:   true,
        healPercent: 60,
        gainBlock:   20,        // bonus block juga
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Saat HP < 20%. Heal 60% HP max + Block 20.',
        flavorText:  '"Bangkit lebih kuat dari sebelumnya."',
    },

    desperate: {
        id:          'desperate',
        name:        'Desperate',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        desperateDmg: true,    // damage naik sesuai missing HP
        baseDamage:  5,
        upgradedId:  'desperate_plus',
        spriteKey:   'card_attack',
        description: 'Damage = 5 + (HP max - HP saat ini). Makin lemah makin kuat.',
        flavorText:  '"Terdesak adalah awal dari keajaiban."',
    },

    desperate_plus: {
        id:          'desperate_plus',
        name:        'Desperate+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        desperateDmg: true,
        baseDamage:  8,
        desperateMultiplier: 1.5,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Damage = 8 + (HP max - HP saat ini) x1.5.',
        flavorText:  '"Ketiadaan harapan membakar segalanya."',
    },

    snipe: {
        id:          'snipe',
        name:        'Snipe',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        damage:      8,
        damageType:  DMG_TYPE.PHYSICAL,
        statusBonus: true,     // damage x3 kalau musuh punya status effect
        upgradedId:  'snipe_plus',
        spriteKey:   'card_attack',
        description: 'Damage 8. Jika musuh punya status effect, damage x3.',
        flavorText:  '"Bidik kelemahan, bukan kekuatan."',
    },

    snipe_plus: {
        id:          'snipe_plus',
        name:        'Snipe+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        damage:      12,
        damageType:  DMG_TYPE.PHYSICAL,
        statusBonus: true,
        statusMultiplier: 4,   // x4 bukan x3
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Damage 12. Jika musuh punya status effect, damage x4.',
        flavorText:  '"Presisi adalah senjata tertinggi."',
    },

    // ── Kartu Yokai Lore Unik ─────────────────────────────────

    iaijutsu: {
        id:          'iaijutsu',
        name:        'Iaijutsu',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        1,
        iaijutsu:    true,     // damage = jumlah kartu di tangan x 4
        emptyHand:   true,     // kosongi tangan setelah dipakai
        damageType:  DMG_TYPE.PHYSICAL,
        upgradedId:  'iaijutsu_plus',
        spriteKey:   'card_attack',
        description: 'Damage = kartu di tangan x4. Buang semua kartu di tangan.',
        flavorText:  '"Satu sabetan, satu nyawa."',
    },

    iaijutsu_plus: {
        id:          'iaijutsu_plus',
        name:        'Iaijutsu+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        1,
        iaijutsu:    true,
        iaijutsuMultiplier: 6,  // x6 bukan x4
        emptyHand:   true,
        damageType:  DMG_TYPE.PHYSICAL,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Damage = kartu di tangan x6. Buang semua kartu di tangan.',
        flavorText:  '"Kilat yang tidak terlihat sebelum terasa."',
    },

    taiko: {
        id:          'taiko',
        name:        'Taiko',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        effects:     [{ type: STATUS.TAIKO, value: 2, duration: 10 }],  // +2 dmg per kartu dipakai
        upgradedId:  'taiko_plus',
        spriteKey:   'card_support',
        description: 'Setiap kartu yang dipakai turn ini, semua damage +2 (stack).',
        flavorText:  '"Ritme perang tidak bisa dihentikan."',
    },

    taiko_plus: {
        id:          'taiko_plus',
        name:        'Taiko+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        effects:     [{ type: STATUS.TAIKO, value: 3, duration: 10 }],  // +3 dmg per kartu
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Setiap kartu yang dipakai, damage +3 (stack). Gratis.',
        flavorText:  '"Semakin cepat, semakin keras."',
    },

    kitsunebi: {
        id:          'kitsunebi',
        name:        'Kitsunebi',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        3,
        damage:      0,
        damageType:  DMG_TYPE.MAGIC,
        kitsunebi:   true,    // pasang api di 3 kartu random musuh — saat musuh pakai, meledak
        burnOnUse:   { value: 8, duration: 3 },
        targetAll:   true,
        upgradedId:  'kitsunebi_plus',
        spriteKey:   'card_magic',
        description: 'Semua musuh kena Burn 8 selama 3 turn + damage magic tiap turn.',
        flavorText:  '"Api kitsune tidak padam oleh air biasa."',
    },

    kitsunebi_plus: {
        id:          'kitsunebi_plus',
        name:        'Kitsunebi+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        2,
        damage:      0,
        damageType:  DMG_TYPE.MAGIC,
        kitsunebi:   true,
        burnOnUse:   { value: 12, duration: 4 },
        targetAll:   true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Semua musuh kena Burn 12 selama 4 turn.',
        flavorText:  '"Sembilan ekor membawa sembilan api."',
    },

    tatari: {
        id:          'tatari',
        name:        'Tatari',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        2,
        effects:     [{ type: STATUS.POISON, value: 5, duration: 99 }],  // poison permanen
        tatari:      true,    // saat musuh mati, poison melompat ke musuh berikutnya
        upgradedId:  'tatari_plus',
        spriteKey:   'card_magic',
        description: 'Kasih Poison 5 permanen. Saat musuh mati, melompat ke musuh berikutnya.',
        flavorText:  '"Kutukan yang tidak kenal akhir."',
    },

    tatari_plus: {
        id:          'tatari_plus',
        name:        'Tatari+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.EPIC,
        cost:        2,
        effects:     [{ type: STATUS.POISON, value: 8, duration: 99 }],
        tatari:      true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Poison 8 permanen yang melompat antar musuh.',
        flavorText:  '"Tidak ada tempat bersembunyi dari tatari."',
    },

    catalyze: {
        id:          'catalyze',
        name:        'Catalyze',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        2,
        catalyze:    true,   // double semua status effect di musuh
        upgradedId:  'catalyze_plus',
        spriteKey:   'card_magic',
        description: 'Double semua stack status effect yang aktif di musuh.',
        flavorText:  '"Percepat apa yang sudah berjalan."',
    },

    catalyze_plus: {
        id:          'catalyze_plus',
        name:        'Catalyze+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        catalyze:    true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Double semua status effect musuh. Cost berkurang.',
        flavorText:  '"Reaksi berantai yang tidak bisa dihentikan."',
    },

    bakar_kartu: {
        id:          'bakar_kartu',
        name:        'Bakar Kartu',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        burnCard:    true,   // hancurkan 1 kartu di tangan, dapat energi sebesar cost-nya
        upgradedId:  'bakar_kartu_plus',
        spriteKey:   'card_attack',
        description: 'Hancurkan 1 kartu di tangan. Dapat energi = cost kartu itu.',
        flavorText:  '"Terkadang satu kartu harus berkorban untuk yang lain."',
    },

    bakar_kartu_plus: {
        id:          'bakar_kartu_plus',
        name:        'Bakar Kartu+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        burnCard:    true,
        burnCardBonus: 1,    // +1 energi ekstra
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Hancurkan 1 kartu. Dapat energi = cost + 1.',
        flavorText:  '"Api memurnikan, energi mengalir."',
    },

    multi_strike: {
        id:          'multi_strike',
        name:        'Multi Strike',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        2,
        damage:      4,
        damageType:  DMG_TYPE.PHYSICAL,
        hits:        4,      // serang 4x
        agiScaling:  true,
        upgradedId:  'multi_strike_plus',
        spriteKey:   'card_attack',
        description: 'Serang 4x dengan damage kecil. Makin tinggi AGI, makin kuat.',
        flavorText:  '"Banyak pukulan kecil lebih baik dari satu pukulan besar."',
    },

    multi_strike_plus: {
        id:          'multi_strike_plus',
        name:        'Multi Strike+',
        type:        CARD_TYPE.SPECIAL,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        2,
        damage:      5,
        damageType:  DMG_TYPE.PHYSICAL,
        hits:        6,      // 6x bukan 4x
        agiScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Serang 6x. Damage per hit lebih besar.',
        flavorText:  '"Tak terhitung, tak terbendung."',
    },
};