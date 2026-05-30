// ============================================================
// data/weapons/index.js
// ============================================================

export const EQUIP_SLOT = {
    WEAPON:    'weapon',
    KABUTO:    'kabuto',
    DO:        'do',
    KOTE:      'kote',
    SUNEATE:   'suneate',
    ACCESSORY: 'accessory',
};

export const WEAPONS = {

    // ── Katana ────────────────────────────────────────────────

    katana_biasa: {
        id: 'katana_biasa', name: 'Katana Biasa',
        slot: 'weapon', rarity: 'common', type: 'katana', element: 'oni',
        statBonus: { str: 2 }, damageBonus: 4, damageType: 'physical',
        description: 'Katana standar seorang ronin.',
        flavorText: '"Sederhana, tapi teruji."',
    },

    katana_baja: {
        id: 'katana_baja', name: 'Katana Baja',
        slot: 'weapon', rarity: 'uncommon', type: 'katana', element: 'oni',
        statBonus: { str: 5, def: 1 }, damageBonus: 8, damageType: 'physical',
        description: 'Katana dari baja berkualitas tinggi.',
        flavorText: '"Setiap goresan meninggalkan bekas."',
    },

    katana_hantu: {
        id: 'katana_hantu', name: 'Katana Hantu',
        slot: 'weapon', rarity: 'rare', type: 'katana', element: 'tsuki',
        statBonus: { str: 4, agi: 6 }, damageBonus: 10, damageType: 'physical',
        specialEffect: 'ghost_strike',
        description: 'Katana yang ditempa di bawah bulan purnama.',
        flavorText: '"Bayangan pedang lebih mematikan dari pedang itu sendiri."',
    },

    katana_naga: {
        id: 'katana_naga', name: 'Katana Naga',
        slot: 'weapon', rarity: 'epic', type: 'katana', element: 'ryuu',
        statBonus: { str: 8, int: 4 }, damageBonus: 16, damageType: 'physical',
        specialEffect: 'dragon_slash',
        description: 'Katana berukir naga, dipercaya membawa kekuatan langit.',
        flavorText: '"Naga tidur di dalam bilah ini, menunggu dipanggil."',
    },

    katana_dewa: {
        id: 'katana_dewa', name: 'Katana Dewa',
        slot: 'weapon', rarity: 'legendary', type: 'katana', element: 'taiyo',
        statBonus: { str: 14, agi: 8, crit: 15 }, damageBonus: 28, damageType: 'physical',
        specialEffect: 'divine_cut',
        description: 'Katana yang konon ditempa oleh dewa matahari sendiri.',
        flavorText: '"Tidak ada yang bisa menahan cahaya."',
    },

    // ── Naginata ──────────────────────────────────────────────

    naginata_kayu: {
        id: 'naginata_kayu', name: 'Naginata Kayu',
        slot: 'weapon', rarity: 'common', type: 'naginata', element: 'kodama',
        statBonus: { str: 3 }, damageBonus: 5, damageType: 'physical',
        aoeBonus: true,
        description: 'Naginata sederhana dari kayu keras.',
    },

    naginata_besi: {
        id: 'naginata_besi', name: 'Naginata Besi',
        slot: 'weapon', rarity: 'uncommon', type: 'naginata', element: 'oni',
        statBonus: { str: 6 }, damageBonus: 9, damageType: 'physical',
        aoeBonus: true,
        description: 'Naginata besi yang cocok untuk pertarungan banyak musuh.',
    },

    naginata_api: {
        id: 'naginata_api', name: 'Naginata Api',
        slot: 'weapon', rarity: 'rare', type: 'naginata', element: 'kasha',
        statBonus: { str: 7, int: 5 }, damageBonus: 13, damageType: 'physical',
        aoeBonus: true, specialEffect: 'fire_sweep',
        description: 'Naginata yang bilahnya dilapisi minyak api.',
        flavorText: '"Satu sapuan, satu pembakaran."',
    },

    // ── Ofuda ─────────────────────────────────────────────────

    ofuda_putih: {
        id: 'ofuda_putih', name: 'Ofuda Putih',
        slot: 'weapon', rarity: 'common', type: 'ofuda', element: 'kodama',
        statBonus: { int: 3 }, damageBonus: 4, damageType: 'magic',
        magicBonus: true,
        description: 'Ofuda sederhana bertuliskan mantra perlindungan.',
    },

    ofuda_api_weapon: {
        id: 'ofuda_api_weapon', name: 'Ofuda Api',
        slot: 'weapon', rarity: 'uncommon', type: 'ofuda', element: 'kasha',
        statBonus: { int: 6 }, damageBonus: 8, damageType: 'magic',
        magicBonus: true, specialEffect: 'burn_chance',
        description: 'Ofuda merah yang memancarkan panas.',
    },

    ofuda_petir: {
        id: 'ofuda_petir', name: 'Ofuda Petir',
        slot: 'weapon', rarity: 'rare', type: 'ofuda', element: 'raijin',
        statBonus: { int: 10, agi: 4 }, damageBonus: 14, damageType: 'magic',
        magicBonus: true, specialEffect: 'thunder_chain',
        description: 'Ofuda biru penuh muatan listrik Raijin.',
        flavorText: '"Tulis namamu di sini, dan petir akan mengikutimu."',
    },

    ofuda_bulan: {
        id: 'ofuda_bulan', name: 'Ofuda Bulan',
        slot: 'weapon', rarity: 'epic', type: 'ofuda', element: 'tsuki',
        statBonus: { int: 14, agi: 6 }, damageBonus: 20, damageType: 'magic',
        magicBonus: true, specialEffect: 'lunar_curse',
        description: 'Ofuda hitam bermandikan cahaya bulan.',
        flavorText: '"Kegelapan adalah senjata paling jujur."',
    },

    // ── Busur ─────────────────────────────────────────────────

    yumi_bambu: {
        id: 'yumi_bambu', name: 'Yumi Bambu',
        slot: 'weapon', rarity: 'common', type: 'yumi', element: 'raijin',
        statBonus: { agi: 4 }, damageBonus: 5, damageType: 'physical',
        rangeBonus: true,
        description: 'Busur bambu ringan, cocok untuk serangan cepat.',
    },

    yumi_besi: {
        id: 'yumi_besi', name: 'Yumi Besi',
        slot: 'weapon', rarity: 'uncommon', type: 'yumi', element: 'raijin',
        statBonus: { agi: 7, crit: 5 }, damageBonus: 9, damageType: 'physical',
        rangeBonus: true,
        description: 'Busur besi dengan tali yang kuat.',
    },

    yumi_angin: {
        id: 'yumi_angin', name: 'Yumi Angin',
        slot: 'weapon', rarity: 'rare', type: 'yumi', element: 'ryuu',
        statBonus: { agi: 10, crit: 8 }, damageBonus: 14, damageType: 'physical',
        rangeBonus: true, specialEffect: 'wind_shot',
        description: 'Busur dari kayu pohon angin kuno.',
        flavorText: '"Angin tidak pernah meleset."',
    },
};

export function getAllWeapons() { return Object.values(WEAPONS); }
export function getWeapon(id)   { return WEAPONS[id] || null; }
export const STARTER_WEAPON = 'katana_biasa';