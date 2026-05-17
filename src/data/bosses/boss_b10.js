// ============================================================
// boss_b10.js — Kappa Agung, Boss Zona 1 (B10)
// 3 Fase: Pertahanan → Agresif → Desperate
// ============================================================

import { DMG_TYPE } from '../../config/constants.js';

export const BOSS_B10 = {
    id:          'kappa_agung',
    name:        'Kappa Agung',
    title:       'Penguasa Sungai',
    description: 'Kappa tertua yang pernah ada. Cangkangnya keras seperti baja.',
    zone:        1,
    isBoss:      true,
    baseHP:      180,
    spriteKey:   'monster_basic',
    stats: { str: 18, int: 10, agi: 8, def: 12, mdef: 6 },

    // FASE 1 (HP 100%-60%) — Pertahanan kuat
    attackPattern: [
        { type: 'attack', damage: 18, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
        { type: 'attack', damage: 14, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
        { type: 'buff',   block: 20,                                  intent: 'defend' },
        { type: 'attack', damage: 18, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
        { type: 'attack', damage: 24, damageType: DMG_TYPE.MAGIC,    intent: 'attack_strong' },
    ],

    phases: [
        // FASE 2 (HP < 60%) — Agresif
        {
            hpThreshold:  60,
            announcement: '💧 Kappa Agung retak! Air mengalir dari cangkangnya... ia semakin murka!',
            attackPattern: [
                { type: 'attack', damage: 22, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
                { type: 'attack', damage: 18, damageType: DMG_TYPE.MAGIC,
                  effects: [{ type: 'bleed', value: 4, duration: 3 }],        intent: 'attack' },
                { type: 'attack', damage: 22, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
                { type: 'buff',   block: 14,                                  intent: 'defend' },
                { type: 'attack', damage: 28, damageType: DMG_TYPE.MAGIC,    intent: 'attack_strong' },
            ],
        },
        // FASE 3 (HP < 30%) — Desperate, all-out
        {
            hpThreshold:  30,
            announcement: '🌊 KAPPA AGUNG LEPAS KENDALI! Seluruh sungai bawah tanah bergolak!',
            attackPattern: [
                { type: 'attack', damage: 28, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
                { type: 'attack', damage: 24, damageType: DMG_TYPE.MAGIC,
                  effects: [{ type: 'bleed', value: 6, duration: 4 }],        intent: 'attack' },
                { type: 'attack', damage: 28, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
                { type: 'attack', damage: 32, damageType: DMG_TYPE.MAGIC,
                  effects: [{ type: 'stun', value: 1, duration: 1 }],         intent: 'attack_strong' },
            ],
        },
    ],

    lootTable: { gold: [80, 120], items: [] },
    introDialog: [
        '"Berani sekali makhluk kecil masuk ke wilayahku..."',
        '"Kamu akan menjadi santapan terbaikku hari ini."',
    ],
};