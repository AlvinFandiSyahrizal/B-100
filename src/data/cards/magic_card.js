// ============================================================
// magic_cards.js — kartu tipe jutsu / ofuda / magic
// ============================================================

import { CARD_TYPE, DMG_TYPE, STATUS } from '../../config/constants.js';

export const MAGIC_CARDS = {

    ofuda_api: {
        id:          'ofuda_api',
        name:        'Ofuda Api',
        type:        CARD_TYPE.MAGIC,
        cost:        2,
        damage:      14,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.BURN, value: 3, duration: 2 }],
        intScaling:  true,
        upgradedId:  'ofuda_api_plus',
        spriteKey:   'card_magic',
        description: 'Bakar musuh dengan ofuda sakti. Damage magic + Burn 3 selama 2 giliran.',
        flavorText:  '"Api yang tertulis di atas kertas, menjadi api yang sesungguhnya."',
    },

    ofuda_api_plus: {
        id:          'ofuda_api_plus',
        name:        'Ofuda Api+',
        type:        CARD_TYPE.MAGIC,
        cost:        2,
        damage:      14,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.BURN, value: 5, duration: 3 }],
        intScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Burn yang lebih panas — Burn 5 selama 3 giliran.',
        flavorText:  '"Tulisannya lebih gelap, apinya lebih membara."',
    },

    ofuda_racun: {
        id:          'ofuda_racun',
        name:        'Ofuda Racun',
        type:        CARD_TYPE.MAGIC,
        cost:        1,
        damage:      5,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.POISON, value: 4, duration: 4 }],
        upgradedId:  'ofuda_racun_plus',
        spriteKey:   'card_magic',
        description: 'Racun yokai yang perlahan mematikan. Poison 4 selama 4 giliran.',
        flavorText:  '"Racun tidak terburu-buru. Racun menunggu."',
    },

    ofuda_racun_plus: {
        id:          'ofuda_racun_plus',
        name:        'Ofuda Racun+',
        type:        CARD_TYPE.MAGIC,
        cost:        1,
        damage:      5,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.POISON, value: 6, duration: 5 }],
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Racun lebih pekat. Poison 6 selama 5 giliran.',
        flavorText:  '"Pekat seperti malam di dasar dungeon."',
    },

    petir_raijin: {
        id:          'petir_raijin',
        name:        'Petir Raijin',
        type:        CARD_TYPE.MAGIC,
        cost:        3,
        damage:      32,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.STUN, value: 1, duration: 1 }],
        intScaling:  true,
        upgradedId:  'petir_raijin_plus',
        spriteKey:   'card_magic',
        description: 'Panggil petir Raijin. Damage magic besar + Stun 1 giliran.',
        flavorText:  '"Guntur berbicara, petir bertindak."',
    },

    petir_raijin_plus: {
        id:          'petir_raijin_plus',
        name:        'Petir Raijin+',
        type:        CARD_TYPE.MAGIC,
        cost:        3,
        damage:      44,
        damageType:  DMG_TYPE.MAGIC,
        effects:     [{ type: STATUS.STUN, value: 1, duration: 1 }],
        intScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Petir yang lebih dahsyat. Damage lebih tinggi + Stun.',
        flavorText:  '"Kali ini langit sendiri yang menyerang."',
    },

    tiup_bara: {
        id:          'tiup_bara',
        name:        'Tiup Bara',
        type:        CARD_TYPE.MAGIC,
        cost:        1,
        damage:      10,
        damageType:  DMG_TYPE.MAGIC,
        burnBonus:   true,   // damage x2 kalau musuh kena Burn
        upgradedId:  'tiup_bara_plus',
        spriteKey:   'card_magic',
        description: 'Damage 10. Jika musuh terkena Burn, damage x2.',
        flavorText:  '"Angin kecil bisa membesarkan api."',
    },

    tiup_bara_plus: {
        id:          'tiup_bara_plus',
        name:        'Tiup Bara+',
        type:        CARD_TYPE.MAGIC,
        cost:        1,
        damage:      16,
        damageType:  DMG_TYPE.MAGIC,
        burnBonus:   true,
        isUpgraded:  true,
        spriteKey:   'card_magic',
        description: 'Damage 16. Jika musuh terkena Burn, damage x2.',
        flavorText:  '"Setiap napas yang berhembus, bara makin membara."',
    },
};
