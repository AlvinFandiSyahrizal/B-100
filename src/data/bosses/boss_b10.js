// ============================================================
// boss_b10.js — Kappa Agung, Boss Zona 1 (B10)
// ============================================================

import { DMG_TYPE, STATUS } from '../../config/constants.js';

export const BOSS_B10 = {
    id:          'kappa_agung',
    name:        'Kappa Agung',
    title:       'Penguasa Sungai',
    description: 'Kappa tertua yang pernah ada. Cangkangnya keras seperti baja.',
    zone:        1,
    isBoss:      true,
    baseHP:      180,
    spriteKey:   'monster_basic',   // ganti dengan sprite boss nanti
    stats: {
        str:  18,
        int:  10,
        agi:  8,
        def:  12,
        mdef: 6,
    },
    // Pola serangan boss — berulang dari index 0
    // Lebih kompleks dari kroco, ada fase
    attackPattern: [
        {
            id:          'cakar_baja',
            type:        'attack',
            damage:      18,
            damageType:  DMG_TYPE.PHYSICAL,
            intent:      'attack',
            description: 'Mencengkram dengan cakar sekeras baja.',
        },
        {
            id:          'semburan_deras',
            type:        'attack',
            damage:      14,
            damageType:  DMG_TYPE.MAGIC,
            intent:      'attack',
            effects:     [{ type: STATUS.FREEZE, value: 1, duration: 1 }],
            description: 'Menyemburkan air bertekanan tinggi.',
        },
        {
            id:          'shell_fortress',
            type:        'buff',
            block:       20,
            intent:      'defend',
            description: 'Masuk ke dalam cangkang, mendapat block besar.',
        },
        {
            id:          'cakar_baja',
            type:        'attack',
            damage:      18,
            damageType:  DMG_TYPE.PHYSICAL,
            intent:      'attack',
            description: 'Mencengkram dengan cakar sekeras baja.',
        },
        {
            id:          'tsunami_kecil',
            type:        'attack',
            damage:      24,
            damageType:  DMG_TYPE.MAGIC,
            intent:      'attack_strong',
            description: 'Serangan air yang kuat, damage besar.',
        },
        {
            id:          'panggil_anak_buah',
            type:        'summon',
            intent:      'buff',
            description: 'Memanggil Kappa kecil sebagai bala bantuan.',
        },
    ],
    lootTable: {
        gold:  [80, 120],
        items: [],
    },
    // Dialog intro boss
    introDialog: [
        '"Berani sekali makhluk kecil masuk ke wilayahku..."',
        '"Kamu akan menjadi santapan terbaikku hari ini."',
    ],
};