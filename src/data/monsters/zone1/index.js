// ============================================================
// data/monsters/zone1/index.js — Monster Zona 1: Hutan Kappa
// ============================================================

import { DMG_TYPE } from '../../../config/constants.js';

// ── Kappa — elemen Ryuu (air) ─────────────────────────────────
export const KAPPA = {
    id:          'kappa',
    name:        'Kappa',
    element:     'ryuu',
    description: 'Yokai air berbentuk kura-kura kecil. Senang menyeret mangsa ke dalam sungai.',
    zone:        1,
    baseHP:      35,
    spriteKey:   'monster_basic',
    stats: { str: 6, int: 3, agi: 5, def: 3, mdef: 1 },
    attackPattern: [
        { id: 'cengkram',    type: 'attack', damage: 7, damageType: DMG_TYPE.PHYSICAL, intent: 'attack',  description: 'Kappa mencengkram dengan cakar dinginnya.' },
        { id: 'semburan_air',type: 'attack', damage: 5, damageType: DMG_TYPE.MAGIC,    intent: 'attack',  description: 'Menyemburkan air bertekanan tinggi.' },
        { id: 'cengkram',    type: 'attack', damage: 7, damageType: DMG_TYPE.PHYSICAL, intent: 'attack',  description: 'Kappa mencengkram dengan cakar dinginnya.' },
        { id: 'shell_harden',type: 'buff',   block: 6,                                 intent: 'defend',  description: 'Kappa masuk ke dalam cangkangnya.' },
    ],
    lootTable: { gold: [5, 12], items: [] },
};

// ── Tanuki Kecil — elemen Kodama ─────────────────────────────
export const TANUKI_KECIL = {
    id:          'tanuki_kecil',
    name:        'Tanuki Kecil',
    element:     'kodama',
    description: 'Tanuki muda yang suka berbuat onar. Bisa mengubah bentuk untuk mengecoh.',
    zone:        1,
    baseHP:      28,
    spriteKey:   'monster_basic',
    stats: { str: 5, int: 4, agi: 8, def: 2, mdef: 2 },
    attackPattern: [
        { id: 'pukulan',      type: 'attack', damage: 6,  damageType: DMG_TYPE.PHYSICAL, intent: 'attack',        description: 'Tanuki memukul dengan perut buncitnya.' },
        { id: 'tipuan',       type: 'debuff', effect: 'confuse',                          intent: 'buff',          description: 'Tanuki berubah bentuk, mengacaukan fokus lawan.' },
        { id: 'pukulan_kuat', type: 'attack', damage: 10, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong', description: 'Setelah tipuan, Tanuki menyerang keras.' },
    ],
    lootTable: { gold: [4, 10], items: [] },
};

// ── Kodama — elemen Kodama ────────────────────────────────────
export const KODAMA = {
    id:          'kodama',
    name:        'Kodama',
    element:     'kodama',
    description: 'Roh pohon yang tenang, tapi marah kalau diganggu. Bisa memanggil teman.',
    zone:        1,
    baseHP:      22,
    spriteKey:   'monster_basic',
    stats: { str: 4, int: 6, agi: 3, def: 1, mdef: 4 },
    attackPattern: [
        { id: 'pukul_ranting',   type: 'attack', damage: 5, damageType: DMG_TYPE.PHYSICAL, intent: 'attack', description: 'Memukul dengan ranting pohon.' },
        { id: 'panggilan_hutan', type: 'summon',                                            intent: 'buff',   description: 'Memanggil Kodama lain sebagai bala bantuan.' },
        { id: 'sihir_hutan',     type: 'attack', damage: 8, damageType: DMG_TYPE.MAGIC,    intent: 'attack', description: 'Menyerang dengan energi hutan.' },
    ],
    lootTable: { gold: [3, 8], items: [] },
};

// ── Oni Kecil — elemen Oni ───────────────────────────────────
export const ONI_KECIL = {
    id:          'oni_kecil',
    name:        'Oni Kecil',
    element:     'oni',
    description: 'Oni merah bertubuh kecil tapi kuat. Suka memukul tanpa pikir panjang.',
    zone:        1,
    baseHP:      40,
    spriteKey:   'monster_basic',
    stats: { str: 9, int: 2, agi: 4, def: 5, mdef: 1 },
    attackPattern: [
        { id: 'pukul_keras', type: 'attack', damage: 10, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong', description: 'Oni memukul keras dengan tinju besarnya.' },
        { id: 'pukul_keras', type: 'attack', damage: 10, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong', description: 'Oni memukul keras dengan tinju besarnya.' },
        { id: 'pertahanan',  type: 'buff',   block: 8,                                  intent: 'defend',        description: 'Oni bersiap menerima serangan.' },
    ],
    lootTable: { gold: [6, 14], items: [] },
};

// ── Raijuu Kecil — elemen Raijin ─────────────────────────────
export const RAIJUU_KECIL = {
    id:          'raijuu_kecil',
    name:        'Raijuu Kecil',
    element:     'raijin',
    description: 'Makhluk kecil berbentuk musang yang tubuhnya dialiri listrik.',
    zone:        1,
    baseHP:      25,
    spriteKey:   'monster_basic',
    stats: { str: 5, int: 7, agi: 10, def: 1, mdef: 3 },
    attackPattern: [
        { id: 'gigit_listrik', type: 'attack', damage: 6, damageType: DMG_TYPE.MAGIC,    intent: 'attack', description: 'Menggigit dengan listrik yang menyengat.' },
        { id: 'lompat_cepat',  type: 'attack', damage: 8, damageType: DMG_TYPE.PHYSICAL, intent: 'attack', description: 'Melompat dengan kecepatan kilat.' },
        { id: 'gigit_listrik', type: 'attack', damage: 6, damageType: DMG_TYPE.MAGIC,    intent: 'attack', description: 'Menggigit dengan listrik yang menyengat.' },
        { id: 'stun_jolt',     type: 'attack', damage: 4, damageType: DMG_TYPE.MAGIC,    intent: 'attack',
          effects: [{ type: 'stun', value: 1, duration: 1 }],
          description: 'Listrik kejut yang melumpuhkan sebentar.' },
    ],
    lootTable: { gold: [5, 11], items: [] },
};

// ── Pool ──────────────────────────────────────────────────────
// FIX: semua key pakai nama CONSTANT yang benar (uppercase)
export const ZONE1_MONSTERS = {
    kappa:        KAPPA,
    tanuki_kecil: TANUKI_KECIL,
    kodama:       KODAMA,
    oni_kecil:    ONI_KECIL,
    raijuu_kecil: RAIJUU_KECIL,
};

export const ZONE1_MONSTER_POOL = [
    'kappa',
    'tanuki_kecil',
    'kodama',
    'oni_kecil',
    'raijuu_kecil',
];

export function getZone1Monster(id) {
    return ZONE1_MONSTERS[id] || null;
}