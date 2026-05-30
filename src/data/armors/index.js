// ============================================================
// data/armors/index.js
// ============================================================

export const ARMORS = {

    // ── Kabuto (Helm) ─────────────────────────────────────────

    kabuto_kayu: {
        id: 'kabuto_kayu', name: 'Kabuto Kayu',
        slot: 'kabuto', rarity: 'common', element: 'kodama',
        statBonus: { def: 2, hp: 8 },
        description: 'Helm kayu sederhana.',
    },
    kabuto_besi: {
        id: 'kabuto_besi', name: 'Kabuto Besi',
        slot: 'kabuto', rarity: 'uncommon', element: 'oni',
        statBonus: { def: 5, hp: 15 },
        description: 'Helm besi standar pasukan.',
    },
    kabuto_naga: {
        id: 'kabuto_naga', name: 'Kabuto Naga',
        slot: 'kabuto', rarity: 'rare', element: 'ryuu',
        statBonus: { def: 8, hp: 25, mdef: 4 },
        specialEffect: 'dragon_will',
        description: 'Helm berukir kepala naga.',
    },
    kabuto_emas: {
        id: 'kabuto_emas', name: 'Kabuto Emas',
        slot: 'kabuto', rarity: 'epic', element: 'taiyo',
        statBonus: { def: 12, hp: 40, mdef: 8 },
        specialEffect: 'golden_aura',
        description: 'Helm emas yang memancarkan cahaya suci.',
        flavorText: '"Cahaya melindungi yang murni hatinya."',
    },

    // ── Do (Baju Besi) ────────────────────────────────────────

    do_kulit: {
        id: 'do_kulit', name: 'Do Kulit',
        slot: 'do', rarity: 'common', element: 'kodama',
        statBonus: { def: 3, hp: 12 },
        description: 'Baju besi kulit yang ringan.',
    },
    do_besi: {
        id: 'do_besi', name: 'Do Besi',
        slot: 'do', rarity: 'uncommon', element: 'oni',
        statBonus: { def: 8, hp: 22 },
        description: 'Baju besi besi standar.',
    },
    do_baja: {
        id: 'do_baja', name: 'Do Baja',
        slot: 'do', rarity: 'rare', element: 'oni',
        statBonus: { def: 14, hp: 35 },
        specialEffect: 'steel_body',
        description: 'Baju besi baja murni.',
    },
    do_api: {
        id: 'do_api', name: 'Do Api',
        slot: 'do', rarity: 'rare', element: 'kasha',
        statBonus: { def: 10, hp: 28, mdef: 6 },
        specialEffect: 'fire_shield',
        description: 'Baju besi yang dicelupkan dalam api yokai.',
    },
    do_dewa: {
        id: 'do_dewa', name: 'Do Dewa',
        slot: 'do', rarity: 'legendary', element: 'taiyo',
        statBonus: { def: 22, hp: 60, mdef: 14 },
        specialEffect: 'divine_body',
        description: 'Baju besi yang konon milik dewa perang.',
        flavorText: '"Tidak ada senjata yang bisa menembus kehendak dewa."',
    },

    // ── Kote (Sarung Tangan) ──────────────────────────────────

    kote_kulit: {
        id: 'kote_kulit', name: 'Kote Kulit',
        slot: 'kote', rarity: 'common', element: 'kodama',
        statBonus: { str: 1, hit: 3 },
        description: 'Sarung tangan kulit ringan.',
    },
    kote_besi: {
        id: 'kote_besi', name: 'Kote Besi',
        slot: 'kote', rarity: 'uncommon', element: 'oni',
        statBonus: { str: 3, hit: 5, def: 2 },
        description: 'Sarung tangan besi.',
    },
    kote_petir: {
        id: 'kote_petir', name: 'Kote Petir',
        slot: 'kote', rarity: 'rare', element: 'raijin',
        statBonus: { str: 5, int: 5, hit: 8 },
        specialEffect: 'thunder_fist',
        description: 'Sarung tangan yang dialiri listrik Raijin.',
    },
    kote_bayangan: {
        id: 'kote_bayangan', name: 'Kote Bayangan',
        slot: 'kote', rarity: 'epic', element: 'tsuki',
        statBonus: { agi: 8, crit: 10, crit_dmg: 20 },
        specialEffect: 'shadow_strike',
        description: 'Sarung tangan dari bayangan malam.',
        flavorText: '"Yang tidak kelihatan tidak bisa dihindari."',
    },

    // ── Suneate (Pelindung Kaki) ──────────────────────────────

    suneate_kayu: {
        id: 'suneate_kayu', name: 'Suneate Kayu',
        slot: 'suneate', rarity: 'common', element: 'kodama',
        statBonus: { agi: 2, dodge: 3 },
        description: 'Pelindung kaki dari kayu ringan.',
    },
    suneate_besi: {
        id: 'suneate_besi', name: 'Suneate Besi',
        slot: 'suneate', rarity: 'uncommon', element: 'oni',
        statBonus: { agi: 3, dodge: 5, def: 3 },
        description: 'Pelindung kaki besi yang kokoh.',
    },
    suneate_angin: {
        id: 'suneate_angin', name: 'Suneate Angin',
        slot: 'suneate', rarity: 'rare', element: 'ryuu',
        statBonus: { agi: 8, dodge: 12 },
        specialEffect: 'wind_step',
        description: 'Pelindung kaki yang ringan seperti angin.',
        flavorText: '"Kecepatan adalah pertahanan terbaik."',
    },
    suneate_hantu: {
        id: 'suneate_hantu', name: 'Suneate Hantu',
        slot: 'suneate', rarity: 'epic', element: 'tsuki',
        statBonus: { agi: 14, dodge: 20 },
        specialEffect: 'phantom_step',
        description: 'Pelindung kaki yang membuat pemakainya setengah transparan.',
        flavorText: '"Mati suri adalah seni tertinggi seorang shinobi."',
    },

    // ── Accessory ─────────────────────────────────────────────

    magatama_biasa: {
        id: 'magatama_biasa', name: 'Magatama Biasa',
        slot: 'accessory', rarity: 'common', element: 'kodama',
        statBonus: { hp: 10, mp: 5 },
        description: 'Jimat batu magatama yang membawa keberuntungan kecil.',
    },
    cincin_kekuatan: {
        id: 'cincin_kekuatan', name: 'Cincin Kekuatan',
        slot: 'accessory', rarity: 'uncommon', element: 'oni',
        statBonus: { str: 4, hp: 15 },
        description: 'Cincin besi yang mengalirkan kekuatan.',
    },
    cincin_sihir: {
        id: 'cincin_sihir', name: 'Cincin Sihir',
        slot: 'accessory', rarity: 'uncommon', element: 'kodama',
        statBonus: { int: 4, mp: 20 },
        description: 'Cincin yang meningkatkan kekuatan sihir.',
    },
    magatama_naga: {
        id: 'magatama_naga', name: 'Magatama Naga',
        slot: 'accessory', rarity: 'rare', element: 'ryuu',
        statBonus: { str: 4, int: 4, hp: 25 },
        specialEffect: 'dragon_soul',
        description: 'Magatama berukir naga yang sangat langka.',
    },
    liontin_bulan: {
        id: 'liontin_bulan', name: 'Liontin Bulan',
        slot: 'accessory', rarity: 'rare', element: 'tsuki',
        statBonus: { agi: 6, dodge: 8, crit: 8 },
        specialEffect: 'moonlight',
        description: 'Liontin berbentuk bulan sabit yang bercahaya.',
        flavorText: '"Bulan tidak pernah berbohong."',
    },
    orb_api: {
        id: 'orb_api', name: 'Orb Api',
        slot: 'accessory', rarity: 'epic', element: 'kasha',
        statBonus: { int: 10, hp: 20 },
        specialEffect: 'flame_aura',
        description: 'Bola api kecil yang melayang di sekeliling pemakainya.',
        flavorText: '"Api yang tidak pernah padam."',
    },
    orb_petir: {
        id: 'orb_petir', name: 'Orb Petir',
        slot: 'accessory', rarity: 'epic', element: 'raijin',
        statBonus: { int: 8, agi: 8 },
        specialEffect: 'thunder_aura',
        description: 'Bola petir yang terus berputar.',
    },
    jimat_abadi: {
        id: 'jimat_abadi', name: 'Jimat Abadi',
        slot: 'accessory', rarity: 'legendary', element: 'taiyo',
        statBonus: { str: 8, int: 8, agi: 8, hp: 50 },
        specialEffect: 'eternal_life',
        description: 'Jimat kuno yang konon bisa menolak kematian.',
        flavorText: '"Selama jimat ini ada, perjalanan belum berakhir."',
    },
};

export function getAllArmors() { return Object.values(ARMORS); }
export function getArmor(id)   { return ARMORS[id] || null; }