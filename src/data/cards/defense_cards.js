// ============================================================
// defense_cards.js — kartu tipe bertahan
// ============================================================

import { CARD_TYPE, DMG_TYPE, STATUS } from '../../config/constants.js';

export const DEFENSE_CARDS = {

    kuda_kuda: {
        id:          'kuda_kuda',
        name:        'Kuda-Kuda',
        type:        CARD_TYPE.DEFENSE,
        cost:        1,
        block:       8,
        effects:     [],
        upgradedId:  'kuda_kuda_kokoh',
        spriteKey:   'card_defense',
        description: 'Pasang kuda-kuda. Dapatkan Block 8 untuk giliran ini.',
        flavorText:  '"Diam, tapi bersiap."',
    },

    kuda_kuda_kokoh: {
        id:          'kuda_kuda_kokoh',
        name:        'Kuda-Kuda Kokoh',
        type:        CARD_TYPE.DEFENSE,
        cost:        1,
        block:       12,
        blockPersist: true,  // block tidak hilang di awal giliran berikut
        isUpgraded:  true,
        spriteKey:   'card_defense',
        description: 'Block 12 yang tidak hilang di awal giliran berikutnya.',
        flavorText:  '"Benteng yang tidak bisa ditembus waktu."',
    },

    langkah_bayangan: {
        id:          'langkah_bayangan',
        name:        'Langkah Bayangan',
        type:        CARD_TYPE.DEFENSE,
        cost:        1,
        effects:     [{ type: STATUS.DODGE, value: 50, duration: 1 }],  // 50% dodge 1 turn
        upgradedId:  'langkah_hantu',
        spriteKey:   'card_defense',
        description: 'Bergerak seperti bayangan. Dodge +50% untuk giliran ini.',
        flavorText:  '"Kalau tidak bisa dilihat, tidak bisa dipukul."',
    },

    langkah_hantu: {
        id:          'langkah_hantu',
        name:        'Langkah Hantu',
        type:        CARD_TYPE.DEFENSE,
        cost:        1,
        effects:     [{ type: STATUS.DODGE, value: 75, duration: 1 }],
        counterDamage: 5,     // kalau dodge berhasil, balik damage kecil
        isUpgraded:  true,
        spriteKey:   'card_defense',
        description: 'Dodge +75% untuk giliran ini. Jika dodge berhasil, balik 5 damage.',
        flavorText:  '"Hantu tidak hanya menghilang. Mereka juga membalas."',
    },

    balas_budi: {
        id:          'balas_budi',
        name:        'Balas Budi',
        type:        CARD_TYPE.DEFENSE,
        cost:        0,
        block:       4,
        requiresBlock: true,   // hanya berguna kalau ada block aktif
        bonusDamage:   8,      // kalau block aktif, tambah damage ke musuh
        upgradedId:  'balas_budi_plus',
        spriteKey:   'card_defense',
        description: 'Dapatkan Block 4. Jika kamu punya Block, serang musuh 8 damage.',
        flavorText:  '"Tiap serangan yang diblok adalah hutang yang harus dibayar."',
    },

    balas_budi_plus: {
        id:          'balas_budi_plus',
        name:        'Balas Budi+',
        type:        CARD_TYPE.DEFENSE,
        cost:        0,
        block:       6,
        requiresBlock: true,
        bonusDamage:   14,
        isUpgraded:  true,
        spriteKey:   'card_defense',
        description: 'Block 6. Jika ada Block, serang musuh 14 damage.',
        flavorText:  '"Pertahanan adalah serangan terbaik."',
    },

    tembok_baja: {
        id:          'tembok_baja',
        name:        'Tembok Baja',
        type:        CARD_TYPE.DEFENSE,
        cost:        2,
        block:       20,
        blockPersist: true,
        upgradedId:  'tembok_baja_plus',
        spriteKey:   'card_defense',
        description: 'Block 20 yang tidak hilang di awal giliran berikutnya.',
        flavorText:  '"Tidak ada yang tembus."',
    },

    tembok_baja_plus: {
        id:          'tembok_baja_plus',
        name:        'Tembok Baja+',
        type:        CARD_TYPE.DEFENSE,
        cost:        2,
        block:       28,
        blockPersist: true,
        isUpgraded:  true,
        spriteKey:   'card_defense',
        description: 'Block 28 yang bertahan. Tidak ada yang tembus.',
        flavorText:  '"Baja yang tidak bisa hancur."',
    },
};
