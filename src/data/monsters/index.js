// ============================================================
// data/monsters/index.js — registry semua monster
// ============================================================

import { KAPPA, TANUKI_KECIL, KODAMA, ZONE1_MONSTER_POOL } from './zone1/index.js';
// Phase berikutnya tambah:
// import { ... } from './zone2/index.js';

export const ALL_MONSTERS = {
    kappa:        KAPPA,
    tanuki_kecil: TANUKI_KECIL,
    kodama:       KODAMA,
};

export const ZONE_MONSTER_POOLS = {
    1: ZONE1_MONSTER_POOL,
    // 2: ZONE2_MONSTER_POOL, dst
};

export function getMonster(id) {
    const m = ALL_MONSTERS[id];
    if (!m) console.warn(`[Monsters] Monster tidak ditemukan: "${id}"`);
    return m || null;
}

export function getZoneMonsterPool(zone) {
    return ZONE_MONSTER_POOLS[zone] || ZONE1_MONSTER_POOL;
}
