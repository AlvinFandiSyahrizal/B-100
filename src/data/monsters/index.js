// ============================================================
// data/monsters/index.js — registry semua monster
// Fix: tambah ONI_KECIL dan RAIJUU_KECIL dari zone1
// ============================================================

import {
    KAPPA, TANUKI_KECIL, KODAMA,
    ONI_KECIL, RAIJUU_KECIL,
    ZONE1_MONSTER_POOL,
} from './zone1/index.js';

export const ALL_MONSTERS = {
    kappa:        KAPPA,
    tanuki_kecil: TANUKI_KECIL,
    kodama:       KODAMA,
    oni_kecil:    ONI_KECIL,
    raijuu_kecil: RAIJUU_KECIL,
};

export const ZONE_MONSTER_POOLS = {
    1: ZONE1_MONSTER_POOL,
};

export function getMonster(id) {
    const m = ALL_MONSTERS[id];
    if (!m) console.warn(`[Monsters] Monster tidak ditemukan: "${id}"`);
    return m || null;
}

export function getZoneMonsterPool(zone) {
    return ZONE_MONSTER_POOLS[zone] || ZONE1_MONSTER_POOL;
}