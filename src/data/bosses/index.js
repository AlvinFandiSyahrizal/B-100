import { BOSS_B10 } from './boss_b10.js';
import { BOSS_B20 } from './boss_b20.js';


// Map zona ke data boss
export const BOSS_BY_ZONE = {
    1:  BOSS_B10,
    2:  BOSS_B20,
    // 3: BOSS_B30,
    // dst...
};

/**
 * Ambil data boss berdasarkan zona.
 * Kalau zona belum ada datanya, fallback ke boss zona 1 dengan stat discale.
 */
export function getBossForZone(zone) {
    if (BOSS_BY_ZONE[zone]) {
        return BOSS_BY_ZONE[zone];
    }

    // Fallback: clone boss_b10 dengan stat dinaikkan
    const fallback = { ...BOSS_B10 };
    fallback.id          = `boss_zona_${zone}`;
    fallback.name        = `Boss Zona ${zone}`;
    fallback.title       = `Penguasa Lantai ${zone * 10}`;
    fallback.zone        = zone;
    fallback.baseHP      = BOSS_B10.baseHP + (zone - 1) * 40;
    fallback.stats       = {
        str:  BOSS_B10.stats.str  + (zone - 1) * 3,
        int:  BOSS_B10.stats.int  + (zone - 1) * 3,
        agi:  BOSS_B10.stats.agi  + (zone - 1) * 2,
        def:  BOSS_B10.stats.def  + (zone - 1) * 2,
        mdef: BOSS_B10.stats.mdef + (zone - 1) * 2,
    };
    fallback.lootTable = {
        gold: [
            BOSS_B10.lootTable.gold[0] + (zone - 1) * 20,
            BOSS_B10.lootTable.gold[1] + (zone - 1) * 30,
        ],
        items: [],
    };

    return fallback;
}