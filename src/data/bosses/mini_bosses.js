// ============================================================
// data/bosses/mini_bosses.js — mini boss tiap lantai
// Mini boss = lebih kuat dari kroco, lebih lemah dari boss besar
// Muncul di akhir setiap lantai B1-B9, B11-B19, dst
// ============================================================

import { DMG_TYPE, STATUS } from '../../config/constants.js';

// ── Zona 1: Mini Boss B1-B9 ───────────────────────────────────

export const MINI_BOSSES_ZONE1 = {

    // B1 — Kappa Tua
    1: {
        id:          'kappa_tua',
        name:        'Kappa Tua',
        title:       'Penjaga Sungai Kecil',
        description: 'Kappa yang sudah tua tapi masih berbahaya.',
        zone:        1,
        isMini:      true,
        baseHP:      65,
        spriteKey:   'monster_basic',
        stats: { str: 10, int: 5, agi: 6, def: 6, mdef: 3 },
        attackPattern: [
            { type: 'attack', damage: 10, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'attack', damage: 8,  damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'buff',   block: 8,                                   intent: 'defend' },
        ],
        lootTable: { gold: [20, 35] },
    },

    // B2 — Tanuki Licik
    2: {
        id:          'tanuki_licik',
        name:        'Tanuki Licik',
        title:       'Penipu Hutan',
        description: 'Tanuki yang ahli tipuan dan ilusi.',
        zone:        1,
        isMini:      true,
        baseHP:      70,
        spriteKey:   'monster_basic',
        stats: { str: 9, int: 8, agi: 10, def: 4, mdef: 5 },
        attackPattern: [
            { type: 'attack', damage: 9,  damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'buff',   block: 6,                                   intent: 'buff'   },
            { type: 'attack', damage: 12, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
            { type: 'attack', damage: 8,  damageType: DMG_TYPE.MAGIC,
              effects: [{ type: STATUS.STUN, value: 1, duration: 1 }],    intent: 'attack' },
        ],
        lootTable: { gold: [22, 38] },
    },

    // B3 — Kodama Tua
    3: {
        id:          'kodama_tua',
        name:        'Kodama Tua',
        title:       'Roh Pohon Kuno',
        description: 'Roh pohon yang sudah ratusan tahun, akarnya menjadi senjata.',
        zone:        1,
        isMini:      true,
        baseHP:      80,
        spriteKey:   'monster_basic',
        stats: { str: 8, int: 12, agi: 4, def: 5, mdef: 8 },
        attackPattern: [
            { type: 'attack', damage: 7,  damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'attack', damage: 7,  damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'buff',   block: 10,                                  intent: 'defend' },
            { type: 'attack', damage: 15, damageType: DMG_TYPE.MAGIC,    intent: 'attack_strong' },
        ],
        lootTable: { gold: [25, 40] },
    },

    // B4 — Kappa Prajurit
    4: {
        id:          'kappa_prajurit',
        name:        'Kappa Prajurit',
        title:       'Komandan Kappa',
        description: 'Kappa yang terlatih dalam seni perang air.',
        zone:        1,
        isMini:      true,
        baseHP:      88,
        spriteKey:   'monster_basic',
        stats: { str: 13, int: 6, agi: 7, def: 9, mdef: 4 },
        attackPattern: [
            { type: 'attack', damage: 12, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'buff',   block: 12,                                  intent: 'defend' },
            { type: 'attack', damage: 16, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
            { type: 'attack', damage: 10, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
        ],
        lootTable: { gold: [28, 45] },
    },

    // B5 — Tanuki Dukun
    5: {
        id:          'tanuki_dukun',
        name:        'Tanuki Dukun',
        title:       'Ahli Racun Hutan',
        description: 'Tanuki yang menguasai seni racun dan kutukan.',
        zone:        1,
        isMini:      true,
        baseHP:      95,
        spriteKey:   'monster_basic',
        stats: { str: 8, int: 14, agi: 8, def: 5, mdef: 9 },
        attackPattern: [
            { type: 'attack', damage: 8,  damageType: DMG_TYPE.MAGIC,
              effects: [{ type: STATUS.POISON, value: 3, duration: 3 }], intent: 'attack' },
            { type: 'attack', damage: 10, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'buff',   block: 8,                                   intent: 'buff'   },
            { type: 'attack', damage: 12, damageType: DMG_TYPE.MAGIC,
              effects: [{ type: STATUS.POISON, value: 5, duration: 4 }], intent: 'attack_strong' },
        ],
        lootTable: { gold: [32, 50] },
    },

    // B6 — Kappa Kapten
    6: {
        id:          'kappa_kapten',
        name:        'Kappa Kapten',
        title:       'Penguasa Sungai Dalam',
        description: 'Kappa paling kuat di sungai bawah tanah.',
        zone:        1,
        isMini:      true,
        baseHP:      105,
        spriteKey:   'monster_basic',
        stats: { str: 15, int: 8, agi: 8, def: 11, mdef: 6 },
        attackPattern: [
            { type: 'attack', damage: 14, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'attack', damage: 10, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'buff',   block: 15,                                  intent: 'defend' },
            { type: 'attack', damage: 18, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
            { type: 'attack', damage: 12, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
        ],
        lootTable: { gold: [35, 55] },
    },

    // B7 — Kodama Raja
    7: {
        id:          'kodama_raja',
        name:        'Kodama Raja',
        title:       'Penguasa Hutan Bawah',
        description: 'Raja para Kodama, bisa memanggil seluruh hutan untuk menyerang.',
        zone:        1,
        isMini:      true,
        baseHP:      115,
        spriteKey:   'monster_basic',
        stats: { str: 10, int: 16, agi: 6, def: 7, mdef: 12 },
        attackPattern: [
            { type: 'attack', damage: 10, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'buff',   block: 14,                                  intent: 'defend' },
            { type: 'attack', damage: 14, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'attack', damage: 10, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'attack', damage: 20, damageType: DMG_TYPE.MAGIC,    intent: 'attack_strong' },
        ],
        lootTable: { gold: [38, 60] },
    },

    // B8 — Tanuki Tua
    8: {
        id:          'tanuki_tua',
        name:        'Tanuki Tua',
        title:       'Master Ilusi Dungeon',
        description: 'Tanuki paling tua di dungeon. Ilusinya hampir tidak bisa dibedakan dari kenyataan.',
        zone:        1,
        isMini:      true,
        baseHP:      125,
        spriteKey:   'monster_basic',
        stats: { str: 12, int: 16, agi: 12, def: 7, mdef: 10 },
        attackPattern: [
            { type: 'attack', damage: 12, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'attack', damage: 12, damageType: DMG_TYPE.MAGIC,
              effects: [{ type: STATUS.STUN, value: 1, duration: 1 }],   intent: 'attack' },
            { type: 'buff',   block: 14,                                  intent: 'buff'   },
            { type: 'attack', damage: 16, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
            { type: 'attack', damage: 14, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
        ],
        lootTable: { gold: [42, 65] },
    },

    // B9 — Kappa Jenderal
    9: {
        id:          'kappa_jenderal',
        name:        'Kappa Jenderal',
        title:       'Gerbang Menuju Kappa Agung',
        description: 'Penjaga terakhir sebelum Kappa Agung. Tidak ada yang melewatinya... sampai sekarang.',
        zone:        1,
        isMini:      true,
        baseHP:      140,
        spriteKey:   'monster_basic',
        stats: { str: 17, int: 10, agi: 10, def: 13, mdef: 8 },
        attackPattern: [
            { type: 'attack', damage: 16, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'buff',   block: 18,                                  intent: 'defend' },
            { type: 'attack', damage: 12, damageType: DMG_TYPE.MAGIC,    intent: 'attack' },
            { type: 'attack', damage: 20, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
            { type: 'attack', damage: 14, damageType: DMG_TYPE.MAGIC,
              effects: [{ type: STATUS.BLEED, value: 4, duration: 3 }],  intent: 'attack' },
        ],
        lootTable: { gold: [48, 75] },
    },
};

// ── Zona 2: placeholder, akan diisi nanti ────────────────────
export const MINI_BOSSES_ZONE2 = {};

// ── Registry semua mini boss ──────────────────────────────────
export const ALL_MINI_BOSSES = {
    1: MINI_BOSSES_ZONE1,
    2: MINI_BOSSES_ZONE2,
};

/**
 * Ambil mini boss untuk lantai dan zona tertentu.
 * @param {number} floor  - lantai dalam zona (1-9)
 * @param {number} zone   - zona (1-10)
 */
export function getMiniBoss(floor, zone) {
    const zoneData = ALL_MINI_BOSSES[zone];
    if (zoneData && zoneData[floor]) return zoneData[floor];

    // Fallback: generate mini boss generic dari floor
    return {
        id:          `mini_boss_z${zone}_f${floor}`,
        name:        `Yokai Kuat Lantai ${floor}`,
        title:       `Penjaga Lantai B${(zone - 1) * 10 + floor}`,
        description: 'Yokai kuat yang menjaga lantai ini.',
        zone,
        isMini:      true,
        baseHP:      60 + floor * 10,
        spriteKey:   'monster_basic',
        stats: {
            str:  8  + floor * 1,
            int:  7  + floor * 1,
            agi:  6  + floor * 1,
            def:  5  + floor * 1,
            mdef: 4  + floor * 1,
        },
        attackPattern: [
            { type: 'attack', damage: 8 + floor * 2, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' },
            { type: 'buff',   block: 6 + floor,                                      intent: 'defend' },
            { type: 'attack', damage: 12 + floor * 2, damageType: DMG_TYPE.PHYSICAL, intent: 'attack_strong' },
        ],
        lootTable: { gold: [15 + floor * 5, 30 + floor * 8] },
    };
}