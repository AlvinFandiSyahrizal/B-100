// ============================================================
// support_cards.js — kartu tipe support: buff, heal, stance
// ============================================================

import { CARD_TYPE, DMG_TYPE, STATUS, STANCE, CARD_RARITY } from '../../config/constants.js';

export const SUPPORT_CARDS = {

    // ── Heal ─────────────────────────────────────────────────

    ramuan_darurat: {
        id:          'ramuan_darurat',
        name:        'Ramuan Darurat',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.COMMON,
        cost:        2,
        heal:        12,
        upgradedId:  'ramuan_darurat_plus',
        spriteKey:   'card_support',
        description: 'Pulihkan 12 HP.',
        flavorText:  '"Pahit, tapi mujarab."',
    },

    ramuan_darurat_plus: {
        id:          'ramuan_darurat_plus',
        name:        'Ramuan Darurat+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.COMMON,
        cost:        2,
        heal:        20,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Pulihkan 20 HP.',
        flavorText:  '"Resep rahasia leluhur."',
    },

    meditasi: {
        id:          'meditasi',
        name:        'Meditasi',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        heal:        5,
        drawCards:   1,
        upgradedId:  'meditasi_dalam',
        spriteKey:   'card_support',
        description: 'Pulihkan 5 HP dan tarik 1 kartu.',
        flavorText:  '"Tenang di tengah badai."',
    },

    meditasi_dalam: {
        id:          'meditasi_dalam',
        name:        'Meditasi Dalam',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        heal:        8,
        drawCards:   2,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Pulihkan 8 HP dan tarik 2 kartu.',
        flavorText:  '"Pikiran jernih, tubuh pulih."',
    },

    // ── Buff ─────────────────────────────────────────────────

    haste: {
        id:          'haste',
        name:        'Haste',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        effects:     [{ type: STATUS.HASTE, value: 1, duration: 1 }],
        upgradedId:  'haste_plus',
        spriteKey:   'card_support',
        description: 'Dapat 1 energi bonus turn ini.',
        flavorText:  '"Bergerak sebelum dunia berkedip."',
    },

    haste_plus: {
        id:          'haste_plus',
        name:        'Haste+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        effects:     [{ type: STATUS.HASTE, value: 2, duration: 1 }],
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Dapat 2 energi bonus turn ini.',
        flavorText:  '"Bahkan waktu tidak bisa mengikuti."',
    },

    fokus: {
        id:          'fokus',
        name:        'Fokus',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        effects:     [{ type: STATUS.FOCUS, value: 1, duration: 1 }],
        upgradedId:  'fokus_plus',
        spriteKey:   'card_support',
        description: 'Kartu berikutnya yang dipakai turn ini damage x1.5.',
        flavorText:  '"Satu titik, satu tujuan."',
    },

    fokus_plus: {
        id:          'fokus_plus',
        name:        'Fokus+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        effects:     [{ type: STATUS.FOCUS, value: 2, duration: 1 }],
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Kartu berikutnya damage x2.',
        flavorText:  '"Konsentrasi absolut."',
    },

    fortifikasi: {
        id:          'fortifikasi',
        name:        'Fortifikasi',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        2,
        effects:     [{ type: STATUS.FORTIFY, value: 50, duration: 2 }],
        upgradedId:  'fortifikasi_plus',
        spriteKey:   'card_support',
        description: 'DEF +50% selama 2 giliran.',
        flavorText:  '"Jadilah tembok yang tidak bisa ditembus."',
    },

    fortifikasi_plus: {
        id:          'fortifikasi_plus',
        name:        'Fortifikasi+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        2,
        effects:     [{ type: STATUS.FORTIFY, value: 75, duration: 3 }],
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'DEF +75% selama 3 giliran.',
        flavorText:  '"Tidak ada yang menembus baja yang dipertegas."',
    },

    echo: {
        id:          'echo',
        name:        'Echo',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        2,
        effects:     [{ type: STATUS.ECHO, value: 1, duration: 1 }],
        upgradedId:  'echo_plus',
        spriteKey:   'card_support',
        description: 'Kartu berikutnya yang dipakai dieksekusi 2x.',
        flavorText:  '"Sekali tidak cukup."',
    },

    echo_plus: {
        id:          'echo_plus',
        name:        'Echo+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        effects:     [{ type: STATUS.ECHO, value: 1, duration: 1 }],
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Kartu berikutnya dieksekusi 2x. Cost berkurang.',
        flavorText:  '"Gema yang tak tertahankan."',
    },

    // ── Stance ───────────────────────────────────────────────

    stance_serang: {
        id:          'stance_serang',
        name:        'Stance Serang',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        stance:      STANCE.ATTACK,
        upgradedId:  'stance_serang_plus',
        spriteKey:   'card_support',
        description: 'Masuk Stance Serang. Semua damage +30%, tidak bisa block.',
        flavorText:  '"Serangan terbaik adalah serangan yang tidak berhenti."',
    },

    stance_serang_plus: {
        id:          'stance_serang_plus',
        name:        'Stance Serang+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        stance:      STANCE.ATTACK,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Masuk Stance Serang gratis. Damage +30%.',
        flavorText:  '"Berubah seperti angin."',
    },

    stance_bertahan: {
        id:          'stance_bertahan',
        name:        'Stance Bertahan',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        1,
        stance:      STANCE.DEFEND,
        upgradedId:  'stance_bertahan_plus',
        spriteKey:   'card_support',
        description: 'Masuk Stance Bertahan. Block x2, damage -30%.',
        flavorText:  '"Kura-kura pun menang dengan sabar."',
    },

    stance_bertahan_plus: {
        id:          'stance_bertahan_plus',
        name:        'Stance Bertahan+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        stance:      STANCE.DEFEND,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Masuk Stance Bertahan gratis. Block x2.',
        flavorText:  '"Diam adalah senjata terkuat."',
    },

    stance_mengalir: {
        id:          'stance_mengalir',
        name:        'Stance Mengalir',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        stance:      STANCE.FLOW,
        upgradedId:  'stance_mengalir_plus',
        spriteKey:   'card_support',
        description: 'Masuk Stance Mengalir. Setiap dodge, dapat 1 energi.',
        flavorText:  '"Air tidak melawan, air mengalir."',
    },

    stance_mengalir_plus: {
        id:          'stance_mengalir_plus',
        name:        'Stance Mengalir+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        stance:      STANCE.FLOW,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Stance Mengalir gratis. Dodge juga kasih +5 block.',
        flavorText:  '"Seperti sungai yang tidak bisa ditangkap."',
    },

    // ── Deck Manipulation ─────────────────────────────────────

    daur_ulang: {
        id:          'daur_ulang',
        name:        'Daur Ulang',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        recycleHand: true,   // shuffle tangan ke deck, tarik jumlah yang sama +1
        upgradedId:  'daur_ulang_plus',
        spriteKey:   'card_support',
        description: 'Shuffle tangan ke deck, tarik sebanyak itu +1.',
        flavorText:  '"Kesempatan kedua selalu ada."',
    },

    daur_ulang_plus: {
        id:          'daur_ulang_plus',
        name:        'Daur Ulang+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.UNCOMMON,
        cost:        0,
        recycleHand: true,
        recycleBonus: 2,     // +2 kartu bukan +1
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Shuffle tangan ke deck, tarik sebanyak itu +2.',
        flavorText:  '"Dua kesempatan lebih baik dari satu."',
    },

    pelajari: {
        id:          'pelajari',
        name:        'Pelajari',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        1,
        scryCount:   3,      // lihat 3 kartu teratas, buang yang tidak diinginkan
        upgradedId:  'pelajari_plus',
        spriteKey:   'card_support',
        description: 'Lihat 3 kartu teratas deck, buang yang tidak diinginkan.',
        flavorText:  '"Tahu apa yang datang adalah setengah dari kemenangan."',
    },

    pelajari_plus: {
        id:          'pelajari_plus',
        name:        'Pelajari+',
        type:        CARD_TYPE.SUPPORT,
        rarity:      CARD_RARITY.RARE,
        cost:        0,
        scryCount:   5,
        isUpgraded:  true,
        spriteKey:   'card_support',
        description: 'Lihat 5 kartu teratas deck, buang yang tidak diinginkan.',
        flavorText:  '"Masa depan terbuka bagi yang mau melihat."',
    },
};