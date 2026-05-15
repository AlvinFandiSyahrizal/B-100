// ============================================================
// boss_b20.js — Tengu Merah, Boss Zona 2 (B20)
// ============================================================

import { DMG_TYPE, STATUS } from '../../../config/constants.js';

export const BOSS_B20 = {
    id:          'tengu_merah',
    name:        'Tengu Merah',
    title:       'Penjaga Hutan',
    description: 'Tengu dengan sayap merah darah. Pernah mengalahkan seribu samurai.',
    zone:        2,
    isBoss:      true,
    baseHP:      220,
    spriteKey:   'monster_basic',
    stats: {
        str:  16,
        int:  18,
        agi:  20,
        def:  8,
        mdef: 14,
    },
    attackPattern: [
        {
            id:          'tebasan_sayap',
            type:        'attack',
            damage:      16,
            damageType:  DMG_TYPE.PHYSICAL,
            intent:      'attack',
            description: 'Tebasan sayap merah yang tajam.',
        },
        {
            id:          'angin_pisau',
            type:        'attack',
            damage:      12,
            damageType:  DMG_TYPE.MAGIC,
            intent:      'attack',
            effects:     [{ type: STATUS.BLEED, value: 4, duration: 3 }],
            description: 'Mengirimkan pisau angin yang menyebabkan perdarahan.',
        },
        {
            id:          'terbang_tinggi',
            type:        'buff',
            block:       12,
            intent:      'buff',
            description: 'Terbang tinggi, dodge meningkat.',
        },
        {
            id:          'badai_bulu',
            type:        'attack',
            damage:      10,
            damageType:  DMG_TYPE.PHYSICAL,
            intent:      'attack',
            hits:        3,
            description: 'Menghujani dengan bulu-bulu tajam sebanyak 3 kali.',
        },
        {
            id:          'angin_pisau',
            type:        'attack',
            damage:      12,
            damageType:  DMG_TYPE.MAGIC,
            intent:      'attack',
            effects:     [{ type: STATUS.BLEED, value: 4, duration: 3 }],
            description: 'Mengirimkan pisau angin yang menyebabkan perdarahan.',
        },
        {
            id:          'jurus_langit',
            type:        'attack',
            damage:      30,
            damageType:  DMG_TYPE.MAGIC,
            intent:      'attack_strong',
            description: 'Serangan pamungkas dari ketinggian.',
        },
    ],
    lootTable: {
        gold:  [110, 160],
        items: [],
    },
    introDialog: [
        '"Kamu telah memasuki hutan yang salah, manusia."',
        '"Sayapku akan menjadi hal terakhir yang kamu lihat."',
    ],
};