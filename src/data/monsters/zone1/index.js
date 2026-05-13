// ============================================================
// data/monsters/zone1/kappa.js — Kappa, monster zona 1
// ============================================================

import { DMG_TYPE } from '../../../config/constants.js';

export const KAPPA = {
    id:          'kappa',
    name:        'Kappa',
    description: 'Yokai air berbentuk kura-kura kecil. Senang menyeret mangsa ke dalam sungai.',
    zone:        1,
    baseHP:      35,
    spriteKey:   'monster_basic',
    stats: {
        str:  6,
        int:  3,
        agi:  5,
        def:  3,
        mdef: 1,
    },
    attackPattern: [
        {
            id:         'cengkram',
            type:       'attack',
            damage:     7,
            damageType: DMG_TYPE.PHYSICAL,
            intent:     'attack',
            description:'Kappa mencengkram dengan cakar dinginnya.',
        },
        {
            id:         'semburan_air',
            type:       'attack',
            damage:     5,
            damageType: DMG_TYPE.MAGIC,
            intent:     'attack',
            description:'Menyemburkan air bertekanan tinggi.',
        },
        {
            id:         'cengkram',
            type:       'attack',
            damage:     7,
            damageType: DMG_TYPE.PHYSICAL,
            intent:     'attack',
            description:'Kappa mencengkram dengan cakar dinginnya.',
        },
        {
            id:         'shell_harden',
            type:       'buff',
            block:      6,
            intent:     'defend',
            description:'Kappa masuk ke dalam cangkangnya.',
        },
    ],
    lootTable: {
        gold:  [5, 12],
        items: [],
    },
};

export const TANUKI_KECIL = {
    id:          'tanuki_kecil',
    name:        'Tanuki Kecil',
    description: 'Tanuki muda yang suka berbuat onar. Bisa mengubah bentuk untuk mengecoh.',
    zone:        1,
    baseHP:      28,
    spriteKey:   'monster_basic',
    stats: {
        str:  5,
        int:  4,
        agi:  8,
        def:  2,
        mdef: 2,
    },
    attackPattern: [
        {
            id:         'pukulan',
            type:       'attack',
            damage:     6,
            damageType: DMG_TYPE.PHYSICAL,
            intent:     'attack',
            description:'Tanuki memukul dengan perut buncitnya.',
        },
        {
            id:         'tipuan',
            type:       'debuff',
            effect:     'confuse',
            intent:     'buff',      // dari luar terlihat buff tapi sebenarnya debuff player
            description:'Tanuki berubah bentuk, mengacaukan fokus lawan.',
        },
        {
            id:         'pukulan_kuat',
            type:       'attack',
            damage:     10,
            damageType: DMG_TYPE.PHYSICAL,
            intent:     'attack_strong',
            description:'Setelah tipuan, Tanuki menyerang keras.',
        },
    ],
    lootTable: {
        gold:  [4, 10],
        items: [],
    },
};

export const KODAMA = {
    id:          'kodama',
    name:        'Kodama',
    description: 'Roh pohon yang tenang, tapi marah kalau diganggu. Bisa memanggil teman.',
    zone:        1,
    baseHP:      22,
    spriteKey:   'monster_basic',
    stats: {
        str:  4,
        int:  6,
        agi:  3,
        def:  1,
        mdef: 4,
    },
    attackPattern: [
        {
            id:         'pukul_ranting',
            type:       'attack',
            damage:     5,
            damageType: DMG_TYPE.PHYSICAL,
            intent:     'attack',
            description:'Memukul dengan ranting pohon.',
        },
        {
            id:         'panggilan_hutan',
            type:       'summon',
            intent:     'buff',
            description:'Memanggil Kodama lain sebagai bala bantuan.',
        },
        {
            id:         'sihir_hutan',
            type:       'attack',
            damage:     8,
            damageType: DMG_TYPE.MAGIC,
            intent:     'attack',
            description:'Menyerang dengan energi hutan.',
        },
    ],
    lootTable: {
        gold:  [3, 8],
        items: [],
    },
};

// Pool monster yang bisa muncul di zona 1
export const ZONE1_MONSTER_POOL = ['kappa', 'tanuki_kecil', 'kodama'];
